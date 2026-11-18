#!/usr/bin/env bash
set -euo pipefail

PREFIX="${PREFIX:-shopflow}"
REGION="${AWS_REGION:-us-east-1}"
RUNTIME="${RUNTIME:-nodejs22.x}"
DEMO_USERS="${DEMO_USERS:-yes}"
ADMIN_EMAIL="${ADMIN_EMAIL:-}"
export AWS_DEFAULT_REGION="$REGION" AWS_PAGER=""

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/aws-build"
mkdir -p "$OUT"

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
ROLE_ARN="${ROLE_ARN:-arn:aws:iam::$ACCOUNT_ID:role/LabRole}"
BUCKET="$PREFIX-images-$ACCOUNT_ID"
PRODUCTS_TABLE="$PREFIX-products"
ORDERS_TABLE="$PREFIX-orders"
LAMBDA_ARN="arn:aws:lambda:$REGION:$ACCOUNT_ID:function"
SPA_RULES='[{"source":"</^[^.]+$|\\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp)$)([^.]+$)/>","target":"/index.html","status":"200"}]'

step() { printf '\n\033[1;32m==> %s\033[0m\n' "$*"; }
quiet() { "$@" >/dev/null 2>&1; }
found() { [ -n "$1" ] && [ "$1" != "None" ]; }

step "Account $ACCOUNT_ID, region $REGION, prefix \"$PREFIX\""
quiet aws iam get-role --role-name "${ROLE_ARN##*/}" || echo "Could not read role $ROLE_ARN. Outside Learner Lab, set ROLE_ARN to a Lambda role you own."

step "DynamoDB tables"
if ! quiet aws dynamodb describe-table --table-name "$PRODUCTS_TABLE"; then
  aws dynamodb create-table --table-name "$PRODUCTS_TABLE" --billing-mode PAY_PER_REQUEST \
    --attribute-definitions AttributeName=productId,AttributeType=S \
    --key-schema AttributeName=productId,KeyType=HASH >/dev/null
fi
if ! quiet aws dynamodb describe-table --table-name "$ORDERS_TABLE"; then
  aws dynamodb create-table --table-name "$ORDERS_TABLE" --billing-mode PAY_PER_REQUEST \
    --attribute-definitions AttributeName=orderId,AttributeType=S AttributeName=userId,AttributeType=S AttributeName=createdAt,AttributeType=S \
    --key-schema AttributeName=orderId,KeyType=HASH \
    --global-secondary-indexes 'IndexName=byUser,KeySchema=[{AttributeName=userId,KeyType=HASH},{AttributeName=createdAt,KeyType=RANGE}],Projection={ProjectionType=ALL}' \
    --stream-specification StreamEnabled=true,StreamViewType=NEW_IMAGE >/dev/null
fi
aws dynamodb wait table-exists --table-name "$PRODUCTS_TABLE"
aws dynamodb wait table-exists --table-name "$ORDERS_TABLE"
STREAM_ARN="$(aws dynamodb describe-table --table-name "$ORDERS_TABLE" --query Table.LatestStreamArn --output text)"

step "S3 bucket $BUCKET"
if ! quiet aws s3api head-bucket --bucket "$BUCKET"; then
  if [ "$REGION" = "us-east-1" ]; then
    aws s3api create-bucket --bucket "$BUCKET" >/dev/null
  else
    aws s3api create-bucket --bucket "$BUCKET" --create-bucket-configuration "LocationConstraint=$REGION" >/dev/null
  fi
fi
aws s3api put-bucket-cors --bucket "$BUCKET" \
  --cors-configuration '{"CORSRules":[{"AllowedOrigins":["*"],"AllowedMethods":["PUT"],"AllowedHeaders":["*"],"MaxAgeSeconds":3000}]}'

step "SNS topic"
TOPIC_ARN="$(aws sns create-topic --name "$PREFIX-admin-alerts" --query TopicArn --output text)"
if [ -n "$ADMIN_EMAIL" ]; then
  aws sns subscribe --topic-arn "$TOPIC_ARN" --protocol email --notification-endpoint "$ADMIN_EMAIL" >/dev/null
  echo "Confirmation email sent to $ADMIN_EMAIL"
fi

step "Lambda packages"
bash "$ROOT/aws/build-lambda.sh"
mkdir -p "$OUT/presignup"
cat > "$OUT/presignup/index.mjs" <<'JS'
export const handler = async (event) => {
  if (event.triggerSource === 'PreSignUp_SignUp') {
    event.response.autoConfirmUser = true;
    event.response.autoVerifyEmail = true;
  }
  return event;
};
JS
(cd "$OUT/presignup" && rm -f ../presignup.zip && zip -q ../presignup.zip index.mjs)

ENV_VARS="Variables={PRODUCTS_TABLE=$PRODUCTS_TABLE,ORDERS_TABLE=$ORDERS_TABLE,BUCKET=$BUCKET,TOPIC_ARN=$TOPIC_ARN,LOW_STOCK_THRESHOLD=5}"

deploy_function() {
  local name="$1" handler="$2" memory="$3" zip="$4" env="$5"
  if quiet aws lambda get-function --function-name "$name"; then
    aws lambda update-function-code --function-name "$name" --zip-file "fileb://$zip" >/dev/null
    aws lambda wait function-updated-v2 --function-name "$name"
    aws lambda update-function-configuration --function-name "$name" --runtime "$RUNTIME" --role "$ROLE_ARN" \
      --handler "$handler" --memory-size "$memory" --timeout 60 --environment "$env" >/dev/null
    aws lambda wait function-updated-v2 --function-name "$name"
  else
    aws lambda create-function --function-name "$name" --runtime "$RUNTIME" --role "$ROLE_ARN" \
      --handler "$handler" --memory-size "$memory" --timeout 60 --zip-file "fileb://$zip" --environment "$env" >/dev/null
    aws lambda wait function-active-v2 --function-name "$name"
  fi
  echo "  $name"
}

step "Lambda functions"
deploy_function "$PREFIX-presignup" index.handler 128 "$OUT/presignup.zip" "Variables={}"
deploy_function "$PREFIX-api" src/api.handler 512 "$OUT/shopflow-backend.zip" "$ENV_VARS"
deploy_function "$PREFIX-on-image-uploaded" src/events/onImageUploaded.handler 1024 "$OUT/shopflow-backend.zip" "$ENV_VARS"
deploy_function "$PREFIX-on-order-created" src/events/onOrderCreated.handler 256 "$OUT/shopflow-backend.zip" "$ENV_VARS"
deploy_function "$PREFIX-daily-report" src/events/dailyReport.handler 256 "$OUT/shopflow-backend.zip" "$ENV_VARS"
deploy_function "$PREFIX-seed" src/seed.handler 512 "$OUT/shopflow-backend.zip" "$ENV_VARS"

step "Cognito user pool"
POOL_ID="$(aws cognito-idp list-user-pools --max-results 60 --query "UserPools[?Name=='$PREFIX-users'].Id | [0]" --output text)"
if ! found "$POOL_ID"; then
  POOL_ID="$(aws cognito-idp create-user-pool --pool-name "$PREFIX-users" \
    --username-attributes email --auto-verified-attributes email \
    --policies 'PasswordPolicy={MinimumLength=8,RequireUppercase=false,RequireLowercase=false,RequireNumbers=false,RequireSymbols=false}' \
    --schema Name=email,AttributeDataType=String,Mutable=true,Required=true Name=name,AttributeDataType=String,Mutable=true,Required=true \
    --lambda-config "PreSignUp=$LAMBDA_ARN:$PREFIX-presignup" \
    --query UserPool.Id --output text)"
fi
quiet aws lambda add-permission --function-name "$PREFIX-presignup" --statement-id cognito-presignup \
  --action lambda:InvokeFunction --principal cognito-idp.amazonaws.com \
  --source-arn "arn:aws:cognito-idp:$REGION:$ACCOUNT_ID:userpool/$POOL_ID" || true
CLIENT_ID="$(aws cognito-idp list-user-pool-clients --user-pool-id "$POOL_ID" --query "UserPoolClients[?ClientName=='$PREFIX-web'].ClientId | [0]" --output text)"
if ! found "$CLIENT_ID"; then
  CLIENT_ID="$(aws cognito-idp create-user-pool-client --user-pool-id "$POOL_ID" --client-name "$PREFIX-web" \
    --no-generate-secret --explicit-auth-flows ALLOW_USER_SRP_AUTH ALLOW_REFRESH_TOKEN_AUTH \
    --query UserPoolClient.ClientId --output text)"
fi
quiet aws cognito-idp create-group --user-pool-id "$POOL_ID" --group-name admin || true

add_user() {
  local email="$1" password="$2" name="$3"
  quiet aws cognito-idp admin-create-user --user-pool-id "$POOL_ID" --username "$email" --message-action SUPPRESS \
    --user-attributes Name=email,Value="$email" Name=email_verified,Value=true Name=name,Value="$name" || true
  aws cognito-idp admin-set-user-password --user-pool-id "$POOL_ID" --username "$email" --password "$password" --permanent
}
if [ "$DEMO_USERS" = "yes" ]; then
  add_user admin@shop.local admin1234 "แอดมินร้าน"
  add_user customer@shop.local customer1234 "ลูกค้าทดลอง"
  aws cognito-idp admin-add-user-to-group --user-pool-id "$POOL_ID" --username admin@shop.local --group-name admin
  echo "  demo accounts ready"
fi

step "Triggers"
quiet aws lambda add-permission --function-name "$PREFIX-on-image-uploaded" --statement-id s3-uploads \
  --action lambda:InvokeFunction --principal s3.amazonaws.com \
  --source-arn "arn:aws:s3:::$BUCKET" --source-account "$ACCOUNT_ID" || true
aws s3api put-bucket-notification-configuration --bucket "$BUCKET" --notification-configuration "{
  \"LambdaFunctionConfigurations\": [{
    \"Id\": \"resize-uploads\",
    \"LambdaFunctionArn\": \"$LAMBDA_ARN:$PREFIX-on-image-uploaded\",
    \"Events\": [\"s3:ObjectCreated:*\"],
    \"Filter\": {\"Key\": {\"FilterRules\": [{\"Name\": \"prefix\", \"Value\": \"uploads/\"}]}}
  }]
}"
MAPPING="$(aws lambda list-event-source-mappings --function-name "$PREFIX-on-order-created" --event-source-arn "$STREAM_ARN" --query 'EventSourceMappings[0].UUID' --output text)"
if ! found "$MAPPING"; then
  aws lambda create-event-source-mapping --function-name "$PREFIX-on-order-created" --event-source-arn "$STREAM_ARN" \
    --starting-position LATEST --batch-size 10 >/dev/null
fi

step "Sample products"
aws lambda invoke --function-name "$PREFIX-seed" "$OUT/seed-result.json" >/dev/null
cat "$OUT/seed-result.json"; echo

step "API Gateway"
node "$ROOT/aws/make-openapi.mjs" "$REGION" "$ACCOUNT_ID" "$POOL_ID" "$OUT/api.json" "$PREFIX-api" >/dev/null
API_ID="$(aws apigateway get-rest-apis --query "items[?name=='$PREFIX-api'].id | [0]" --output text)"
if found "$API_ID"; then
  aws apigateway put-rest-api --rest-api-id "$API_ID" --mode overwrite --body "fileb://$OUT/api.json" >/dev/null
else
  API_ID="$(aws apigateway import-rest-api --parameters endpointConfigurationTypes=REGIONAL --body "fileb://$OUT/api.json" --query id --output text)"
fi
quiet aws lambda add-permission --function-name "$PREFIX-api" --statement-id apigateway-invoke \
  --action lambda:InvokeFunction --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*" || true
aws apigateway create-deployment --rest-api-id "$API_ID" --stage-name prod >/dev/null
API_URL="https://$API_ID.execute-api.$REGION.amazonaws.com/prod"

step "Daily report schedule"
if ! quiet aws scheduler get-schedule --name "$PREFIX-daily-report"; then
  aws scheduler create-schedule --name "$PREFIX-daily-report" \
    --schedule-expression 'cron(0 8 * * ? *)' --schedule-expression-timezone Asia/Bangkok \
    --flexible-time-window Mode=OFF \
    --target "Arn=$LAMBDA_ARN:$PREFIX-daily-report,RoleArn=$ROLE_ARN" >/dev/null
fi

step "Website build"
npm --prefix "$ROOT/frontend" ci --no-audit --no-fund --loglevel=error
bash "$ROOT/aws/build-web.sh" "$API_URL" "$POOL_ID" "$CLIENT_ID"

step "Amplify Hosting"
APP_ID="$(aws amplify list-apps --query "apps[?name=='$PREFIX'].appId | [0]" --output text)"
if found "$APP_ID"; then
  aws amplify update-app --app-id "$APP_ID" --custom-rules "$SPA_RULES" >/dev/null
else
  APP_ID="$(aws amplify create-app --name "$PREFIX" --custom-rules "$SPA_RULES" --query app.appId --output text)"
fi
quiet aws amplify get-branch --app-id "$APP_ID" --branch-name main || aws amplify create-branch --app-id "$APP_ID" --branch-name main >/dev/null
read -r JOB_ID UPLOAD_URL < <(aws amplify create-deployment --app-id "$APP_ID" --branch-name main --query '[jobId,zipUploadUrl]' --output text)
curl -sSf -T "$OUT/shopflow-web.zip" "$UPLOAD_URL" >/dev/null
aws amplify start-deployment --app-id "$APP_ID" --branch-name main --job-id "$JOB_ID" >/dev/null
for _ in $(seq 1 60); do
  STATUS="$(aws amplify get-job --app-id "$APP_ID" --branch-name main --job-id "$JOB_ID" --query job.summary.status --output text)"
  case "$STATUS" in SUCCEED|FAILED|CANCELLED) break ;; esac
  sleep 5
done
echo "  deployment $STATUS"
SITE_URL="https://main.$APP_ID.amplifyapp.com"

cat > "$OUT/outputs.env" <<ENV
SITE_URL=$SITE_URL
API_URL=$API_URL
USER_POOL_ID=$POOL_ID
APP_CLIENT_ID=$CLIENT_ID
BUCKET=$BUCKET
TOPIC_ARN=$TOPIC_ARN
AMPLIFY_APP_ID=$APP_ID
ENV

step "Done"
echo "Website:      $SITE_URL"
echo "API:          $API_URL"
echo "User pool:    $POOL_ID"
echo "App client:   $CLIENT_ID"
if [ "$DEMO_USERS" = "yes" ]; then
  echo "Admin login:  admin@shop.local / admin1234"
  echo "Customer:     customer@shop.local / customer1234"
fi
echo "Saved to $OUT/outputs.env"
