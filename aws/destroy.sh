#!/usr/bin/env bash
set -uo pipefail

PREFIX="${PREFIX:-shopflow}"
REGION="${AWS_REGION:-us-east-1}"
export AWS_DEFAULT_REGION="$REGION" AWS_PAGER=""

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
BUCKET="$PREFIX-images-$ACCOUNT_ID"

echo "This permanently deletes every \"$PREFIX\" resource in account $ACCOUNT_ID ($REGION):"
echo "the website, API, Lambda functions, user accounts, orders, products and images."
if [ "${CONFIRM:-}" != "$PREFIX" ]; then
  read -r -p "Type $PREFIX to continue: " answer
  [ "$answer" = "$PREFIX" ] || { echo "Cancelled."; exit 1; }
fi

step() { printf '\n\033[1;31m==> %s\033[0m\n' "$*"; }
found() { [ -n "$1" ] && [ "$1" != "None" ]; }

step "Amplify app"
APP_ID="$(aws amplify list-apps --query "apps[?name=='$PREFIX'].appId | [0]" --output text)"
found "$APP_ID" && aws amplify delete-app --app-id "$APP_ID" >/dev/null

step "Schedule"
aws scheduler delete-schedule --name "$PREFIX-daily-report" 2>/dev/null

step "API Gateway"
API_ID="$(aws apigateway get-rest-apis --query "items[?name=='$PREFIX-api'].id | [0]" --output text)"
found "$API_ID" && aws apigateway delete-rest-api --rest-api-id "$API_ID"

step "Lambda functions"
for uuid in $(aws lambda list-event-source-mappings --function-name "$PREFIX-on-order-created" --query 'EventSourceMappings[].UUID' --output text 2>/dev/null); do
  aws lambda delete-event-source-mapping --uuid "$uuid" >/dev/null
done
for fn in api on-image-uploaded on-order-created daily-report seed presignup; do
  aws lambda delete-function --function-name "$PREFIX-$fn" 2>/dev/null && echo "  $PREFIX-$fn"
done

step "Cognito user pool"
POOL_ID="$(aws cognito-idp list-user-pools --max-results 60 --query "UserPools[?Name=='$PREFIX-users'].Id | [0]" --output text)"
found "$POOL_ID" && aws cognito-idp delete-user-pool --user-pool-id "$POOL_ID"

step "S3 bucket"
aws s3 rb "s3://$BUCKET" --force >/dev/null 2>&1

step "DynamoDB tables"
aws dynamodb delete-table --table-name "$PREFIX-products" >/dev/null 2>&1
aws dynamodb delete-table --table-name "$PREFIX-orders" >/dev/null 2>&1

step "SNS topic"
aws sns delete-topic --topic-arn "arn:aws:sns:$REGION:$ACCOUNT_ID:$PREFIX-admin-alerts" 2>/dev/null

echo
echo "Done."
