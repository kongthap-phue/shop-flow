# Deploying Shop Flow to AWS

<p align="center">
  <b>English</b> &nbsp;|&nbsp; <a href="AWS-DEPLOYMENT.th.md">ภาษาไทย</a>
</p>

This guide walks through every step we used to put Shop Flow on AWS, with a screenshot for each important screen. Follow it from top to bottom and you will end up with the same working shop.

**Live result:** https://main.d2yz42dazxw1qn.amplifyapp.com

![Shop Flow running on AWS](aws-setup/36-live-site.jpg)

## Contents

1. [What you will build](#what-you-will-build)
2. [Before you start](#before-you-start)
3. [Step 0 · Build the packages on your computer](#step-0--build-the-packages-on-your-computer)
4. [Step 1 · DynamoDB tables](#step-1--dynamodb-tables)
5. [Step 2 · S3 bucket for product images](#step-2--s3-bucket-for-product-images)
6. [Step 3 · SNS topic for admin alerts](#step-3--sns-topic-for-admin-alerts)
7. [Step 4 · Cognito user pool](#step-4--cognito-user-pool)
8. [Step 5 · Lambda functions](#step-5--lambda-functions)
9. [Step 6 · Connect the triggers](#step-6--connect-the-triggers)
10. [Step 7 · API Gateway](#step-7--api-gateway)
11. [Step 8 · Daily report schedule](#step-8--daily-report-schedule)
12. [Step 9 · Website on Amplify Hosting](#step-9--website-on-amplify-hosting)
13. [Step 10 · Test everything](#step-10--test-everything)
14. [Updating the app later](#updating-the-app-later)
15. [Troubleshooting](#troubleshooting)
16. [Clean up](#clean-up)

## What you will build

![AWS architecture](architecture.png)

| Resource | Name we used | Purpose |
|---|---|---|
| DynamoDB table | `shopflow-products` | Products |
| DynamoDB table | `shopflow-orders` (+ index `byUser`, stream on) | Orders |
| S3 bucket | `shopflow-images-<account id>` | Original images in `uploads/`, thumbnails in `thumbs/` |
| SNS topic | `shopflow-admin-alerts` | Emails to the shop admin |
| Cognito user pool | `shopflow-web` app client, group `admin` | Sign up, log in, admin role |
| Lambda | `shopflow-api` | Every REST route |
| Lambda | `shopflow-on-image-uploaded` | Makes 600×750 WebP thumbnails (S3 trigger) |
| Lambda | `shopflow-on-order-created` | Cuts stock and emails the admin (DynamoDB Stream trigger) |
| Lambda | `shopflow-daily-report` | Daily sales report (EventBridge Scheduler) |
| Lambda | `shopflow-presignup` | Confirms new users automatically (Cognito trigger) |
| Lambda | `shopflow-seed` | Loads the 10 sample products once |
| API Gateway | `shopflow-api`, stage `prod` | Public HTTPS API |
| EventBridge Scheduler | `shopflow-daily-report` | Runs the report every day at 08:00 Bangkok time |
| Amplify Hosting | app `shopflow`, branch `main` | The React website |

## Before you start

- An **AWS Academy Learner Lab** session (this guide was written on one). Start the lab and open the AWS Console from it. A normal AWS account works too, see the notes marked *Normal AWS account*.
- Region **US East (N. Virginia) `us-east-1`** for everything. Check the region menu at the top right before you create anything.
- On your computer: Node.js 20 or later, `git`, and `zip`. On Windows, run the commands in **Git Bash** or **WSL**.
- This repository cloned, with `npm run setup` already done:

```bash
git clone https://github.com/kongthap-phue/shop-flow.git
cd shop-flow
npm run setup
```

### Learner Lab limits we worked around

| Limit in Learner Lab | What we did instead |
|---|---|
| You cannot create IAM roles | Every Lambda and the schedule use the existing role **`LabRole`** |
| CloudFront distributions cannot be created (`cloudfront:CreateDistribution` is denied) | The bucket stays private and the API returns **presigned S3 links** for images. Nothing to set up, the code does it when `ASSET_BASE_URL` is empty |
| Turning off S3 *Block public access* is not needed | Keep it **on** |

### Write these values down as you go

| Value | You get it in | Used in |
|---|---|---|
| Account ID (12 digits) | Top right of the console | Bucket name, ARNs |
| SNS topic ARN | Step 3 | Lambda environment variables |
| User pool ID | Step 4 | Website build |
| App client ID | Step 4 | Website build |
| API Invoke URL | Step 7 | Website build |
| Amplify domain | Step 9 | Opening the shop |

## Step 0 · Build the packages on your computer

The repository has two scripts in [`aws/`](../aws) that make the files you will upload.

```bash
./aws/build-lambda.sh
```

This creates `aws-build/shopflow-backend.zip` (about 8 MB). It contains the backend code from `backend/src`, the sample product photos, and the **Linux** build of `sharp` (the image resizer), which Lambda needs. The AWS SDK is not bundled because the Lambda Node.js runtime already includes it.

The website package is built later, in Step 9, because it needs values from Steps 4 and 7.

> **How the code switches to AWS.** `backend/src/lib/db.js`, `storage.js` and `notify.js` pick the AWS version (`*-aws.js`) when the environment variables `PRODUCTS_TABLE`, `BUCKET` and `TOPIC_ARN` exist, and the local version otherwise. The website uses Cognito when it is built with `VITE_COGNITO_CLIENT_ID`. So `npm run dev` on your computer keeps working exactly as before.

## Step 1 · DynamoDB tables

1. Open **DynamoDB → Tables → Create table**.
2. Table name `shopflow-products`, Partition key `productId` (String). Leave **Default settings** and click **Create table**.

   ![Create the products table](aws-setup/02-dynamodb-create-products.jpg)

3. Create a second table the same way: name `shopflow-orders`, partition key `orderId` (String).
4. Wait until both tables show **Active**. Open `shopflow-orders` → tab **Indexes** → **Create index**:
   - Partition key `userId` (String)
   - Sort key `createdAt` (String)
   - Index name `byUser`

   ![Create the byUser index](aws-setup/03-dynamodb-index.jpg)

5. Still on `shopflow-orders`, tab **Exports and streams** → **DynamoDB stream details** → **Turn on**. Choose **New image** and click **Turn on stream**. (If the button is grey, wait for the index to finish creating and refresh.)

   ![Turn on the stream](aws-setup/03b-dynamodb-stream.jpg)

## Step 2 · S3 bucket for product images

1. Open **S3 → Create bucket**.
2. Bucket name `shopflow-images-<your account id>` (for example `shopflow-images-767398126995`). Keep **Block all public access** turned on. Click **Create bucket**.

   ![Create the bucket](aws-setup/04-s3-create-bucket.jpg)

3. Open the bucket → **Permissions** → **Cross-origin resource sharing (CORS)** → **Edit**, paste this and **Save changes**. It lets the browser upload images straight to S3.

   ```json
   [{"AllowedOrigins": ["*"], "AllowedMethods": ["PUT"], "AllowedHeaders": ["*"], "MaxAgeSeconds": 3000}]
   ```

   ![Bucket CORS](aws-setup/05-s3-cors.jpg)

### About CloudFront

Our architecture shows CloudFront in front of S3. In Learner Lab, creating a distribution is blocked:

![CloudFront is blocked in Learner Lab](aws-setup/10-cloudfront-denied.jpg)

So skip CloudFront there. The API signs a temporary S3 link (valid for 12 hours) for every image it returns, which keeps the bucket private.

> *Normal AWS account:* create a distribution with the bucket as origin and **Allow private S3 bucket access to CloudFront** ticked, then later add the environment variable `ASSET_BASE_URL=https://<distribution domain>` to the Lambda functions. The code then returns CloudFront links instead of signed S3 links.
>
> ![CloudFront plan](aws-setup/06-cloudfront-plan.jpg)
> ![CloudFront origin](aws-setup/08-cloudfront-origin.jpg)

## Step 3 · SNS topic for admin alerts

1. Open **Simple Notification Service → Topics → Create topic**.
2. Type **Standard**, name `shopflow-admin-alerts`, **Create topic**. Copy the topic **ARN**.

   ![Create the topic](aws-setup/11-sns-topic.jpg)

3. In the topic, click **Create subscription**: protocol **Email**, endpoint = the admin's email address, **Create subscription**.

   ![Email subscription](aws-setup/12-sns-subscription.jpg)

4. Open the email from *AWS Notifications* and click **Confirm subscription**. Look in the spam folder if it does not arrive. Until you confirm, no alerts are delivered.

## Step 4 · Cognito user pool

1. Open **Cognito → Create user pool** and fill in:
   - Application type **Single-page application (SPA)**
   - Name `shopflow-web`
   - Sign-in identifier: **Email** only
   - **Enable self-registration** ticked
   - Required attributes: **email** and **name**
   - Leave Return URL empty and click **Create user directory**

   ![Create the user pool](aws-setup/13-cognito-create.jpg)

2. Go to **User pools** and copy the **User pool ID** (like `us-east-1_0kEUwS3RQ`). Open the pool → **App clients** and copy the **Client ID**.

   ![App client ID](aws-setup/14-cognito-app-client.jpg)

3. **Authentication methods → Password policy → Edit**: choose **Custom**, minimum length **8**, untick all four character rules, **Save changes**. Our sign-up form only checks the length.

   ![Password policy](aws-setup/15-cognito-password.jpg)

4. **Groups → Create group**, name `admin`, **Create group**. Users in this group can open the back office.

   ![Admin group](aws-setup/16-cognito-group.jpg)

The Pre sign-up trigger is connected in Step 6, after its Lambda exists.

## Step 5 · Lambda functions

### 5.1 `shopflow-presignup` (code typed in the console)

1. **Lambda → Create function → Author from scratch**, name `shopflow-presignup`, runtime **Node.js** (the newest offered, we used 26.x), architecture **x86_64**.
2. Open **Additional settings**, turn on **Custom execution role**, choose **`LabRole`**, **Save**, then **Create function**.

   ![Use LabRole](aws-setup/17-lambda-create-labrole.jpg)

3. Replace the code in `index.mjs` with the snippet below and click **Deploy**.

   ```javascript
   export const handler = async (event) => {
     event.response.autoConfirmUser = true;
     event.response.autoVerifyEmail = true;
     return event;
   };
   ```

   ![Pre sign-up code](aws-setup/18-lambda-presignup-code.jpg)

### 5.2 `shopflow-api` (code from the zip)

1. Create a function named `shopflow-api` exactly like 5.1 (same runtime, x86_64, `LabRole`).
2. **Code → Update → Update from a .zip file**, choose `aws-build/shopflow-backend.zip`, **Update**.

   ![Upload the zip](aws-setup/19-lambda-upload-zip.jpg)

3. **Code → Runtime settings → Edit**, Handler `src/api.handler`, **Save**. Check afterwards that the handler really changed; if the upload was still running it may not save.

   ![Handler](aws-setup/20-lambda-handler.jpg)

4. **Configuration → General configuration → Edit**: Memory `512` MB, Timeout `15` sec, **Save**.

   ![Memory and timeout](aws-setup/21-lambda-basic-settings.jpg)

5. **Configuration → Environment variables → Edit**, add these five and **Save**:

   | Key | Value |
   |---|---|
   | `PRODUCTS_TABLE` | `shopflow-products` |
   | `ORDERS_TABLE` | `shopflow-orders` |
   | `BUCKET` | your bucket name |
   | `TOPIC_ARN` | your topic ARN |
   | `LOW_STOCK_THRESHOLD` | `5` |

   ![Environment variables](aws-setup/22-lambda-env.jpg)

### 5.3 The other four functions (CloudShell)

The remaining functions use the same zip and the same variables, only the handler changes. Creating them in **CloudShell** (the terminal icon at the bottom left of the console) is faster than clicking through four more times. CloudShell already has your Learner Lab permissions.

```bash
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ROLE=arn:aws:iam::$ACCOUNT_ID:role/LabRole
BUCKET=shopflow-images-$ACCOUNT_ID
TOPIC_ARN=arn:aws:sns:us-east-1:$ACCOUNT_ID:shopflow-admin-alerts
RUNTIME=$(aws lambda get-function-configuration --function-name shopflow-api --query Runtime --output text)
curl -s -o code.zip "$(aws lambda get-function --function-name shopflow-api --query Code.Location --output text)"
ENVV="Variables={PRODUCTS_TABLE=shopflow-products,ORDERS_TABLE=shopflow-orders,BUCKET=$BUCKET,TOPIC_ARN=$TOPIC_ARN,LOW_STOCK_THRESHOLD=5}"

for spec in \
  shopflow-on-image-uploaded:src/events/onImageUploaded.handler:1024 \
  shopflow-on-order-created:src/events/onOrderCreated.handler:256 \
  shopflow-daily-report:src/events/dailyReport.handler:256 \
  shopflow-seed:src/seed.handler:512
do
  IFS=: read name handler memory <<< "$spec"
  aws lambda create-function --function-name "$name" --runtime "$RUNTIME" --role "$ROLE" \
    --handler "$handler" --memory-size "$memory" --timeout 60 \
    --zip-file fileb://code.zip --environment "$ENVV" --query '[FunctionName,State]' --output text
done
```

You can also create each one in the console exactly like 5.2:

| Function | Handler | Memory | Timeout |
|---|---|---|---|
| `shopflow-on-image-uploaded` | `src/events/onImageUploaded.handler` | 1024 MB | 60 s |
| `shopflow-on-order-created` | `src/events/onOrderCreated.handler` | 256 MB | 60 s |
| `shopflow-daily-report` | `src/events/dailyReport.handler` | 256 MB | 60 s |
| `shopflow-seed` | `src/seed.handler` | 512 MB | 60 s |

Quick check that `shopflow-api` can read DynamoDB:

```bash
aws lambda invoke --function-name shopflow-api --cli-binary-format raw-in-base64-out \
  --payload '{"httpMethod":"GET","resource":"/products","path":"/products"}' out.json && cat out.json
```

You should see `"statusCode":200` and `"body":"[]"`.

## Step 6 · Connect the triggers

### Cognito → `shopflow-presignup`

Cognito → your pool → **Extensions → Add Lambda trigger**: trigger type **Sign-up**, **Pre sign-up trigger**, function `shopflow-presignup`, **Add Lambda trigger**.

![Pre sign-up trigger](aws-setup/23-cognito-presignup-trigger.jpg)

### S3 → `shopflow-on-image-uploaded`

Lambda `shopflow-on-image-uploaded` → **Add trigger** → source **S3**:
- Bucket: your images bucket
- Event types: **All object create events**
- Prefix: **`uploads/`** (important: thumbnails are written to `thumbs/`, so the prefix stops the function from triggering itself)
- Tick the recursive-invocation acknowledgement and click **Add**

![S3 trigger](aws-setup/24-trigger-s3.jpg)

### DynamoDB Stream → `shopflow-on-order-created`

Lambda `shopflow-on-order-created` → **Add trigger** → source **DynamoDB**: table `shopflow-orders`, batch size `10`, starting position **Latest**, **Add**.

![DynamoDB trigger](aws-setup/25-trigger-dynamodb.jpg)

### Load the sample products

Now that the S3 trigger exists, run the seed function once in CloudShell:

```bash
aws lambda invoke --function-name shopflow-seed seed.json && cat seed.json
sleep 15
aws s3 ls s3://shopflow-images-$(aws sts get-caller-identity --query Account --output text)/ --recursive | awk '{print $4}' | cut -d/ -f1 | sort | uniq -c
```

Expected: `{"created":10}`, then `10 thumbs` and `10 uploads`. Running it again does nothing if products already exist.

## Step 7 · API Gateway

Instead of clicking 6 resources, 10 methods and CORS one by one, we import an OpenAPI file that already describes all routes, the Cognito authorizer and CORS.

1. On your computer, generate the file with your own values:

   ```bash
   node aws/make-openapi.mjs us-east-1 <account-id> <user-pool-id> aws-build/shopflow-api.openapi.json
   ```

2. **API Gateway → Create API → REST API → Import**, click **Choose file** and pick `aws-build/shopflow-api.openapi.json`. Keep endpoint type **Regional** and click **Create API**.

   ![Import the API](aws-setup/26-apigw-import.jpg)

   You get every route. `GET /products` and `GET /products/{id}` are public, everything else requires a Cognito login.

   ![Imported resources](aws-setup/27-apigw-resources.jpg)

3. Allow API Gateway to call the Lambda (CloudShell). Use the API ID shown in the console title (ours was `083krfr322`):

   ```bash
   ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
   API_ID=<your api id>
   aws lambda add-permission --function-name shopflow-api --statement-id apigateway-invoke \
     --action lambda:InvokeFunction --principal apigateway.amazonaws.com \
     --source-arn "arn:aws:execute-api:us-east-1:$ACCOUNT_ID:$API_ID/*"
   ```

4. Click **Deploy API**, stage **New stage**, name `prod`, **Deploy**.

   ![Deploy the API](aws-setup/28-apigw-deploy.jpg)

5. Copy the **Invoke URL** from the stage page.

   ![Invoke URL](aws-setup/29-apigw-stage.jpg)

6. Test it:

   ```bash
   curl https://<api-id>.execute-api.us-east-1.amazonaws.com/prod/products
   curl https://<api-id>.execute-api.us-east-1.amazonaws.com/prod/orders
   ```

   The first returns the 10 products. The second returns `{"message":"Unauthorized"}`, which proves the authorizer works.

## Step 8 · Daily report schedule

1. **Amazon EventBridge → Scheduler → Schedules → Create schedule**, name `shopflow-daily-report`.
2. **Recurring schedule**, time zone **Asia/Bangkok**, **Cron-based**, cron `0 8 * * ? *`, flexible time window **Off**, **Next**.

   ![Cron](aws-setup/30-scheduler-cron.jpg)

3. Target **AWS Lambda Invoke**, function `shopflow-daily-report`, **Next**.

   ![Target](aws-setup/31-scheduler-target.jpg)

4. Permissions: **Use existing role** → **`LabRole`**. **Next → Create schedule**.

   ![LabRole for the schedule](aws-setup/32-scheduler-role.jpg)

To get a report right away: `aws lambda invoke --function-name shopflow-daily-report r.json && cat r.json`.

## Step 9 · Website on Amplify Hosting

1. Build the website with your three values:

   ```bash
   ./aws/build-web.sh <invoke-url> <user-pool-id> <app-client-id>
   ```

   This creates `aws-build/shopflow-web.zip` with `index.html` at the top level of the zip.

2. **AWS Amplify → Deploy an app → Deploy without Git → Next**.

   ![Deploy without Git](aws-setup/33-amplify-without-git.jpg)

3. App name `shopflow`, branch name `main`, method **Drag and drop**, choose `aws-build/shopflow-web.zip`, then **Save and deploy**.

   ![Upload the website](aws-setup/34-amplify-upload.jpg)

4. Add the single-page-app rewrite so links like `/shop` or `/admin` work after a page refresh. In CloudShell, with your app ID from the Amplify page:

   ```bash
   aws amplify update-app --app-id <app-id> --custom-rules '[{"source":"</^[^.]+$|\\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp)$)([^.]+$)/>","target":"/index.html","status":"200"}]'
   ```

   (Same thing in the console: **Hosting → Rewrites and redirects → Manage redirects**, source as above, target `/index.html`, type **200 (Rewrite)**.)

5. The **Domain** on the app page is your shop, for example `https://main.d2yz42dazxw1qn.amplifyapp.com`.

   ![Deployed](aws-setup/35-amplify-deployed.jpg)

## Step 10 · Test everything

Make the first admin:

1. Open the shop, click **เข้าสู่ระบบ → สมัครสมาชิก**, and register with the admin's email.
2. Cognito → your pool → **Users** → pick that user → **Add user to group** → `admin`.
3. Log out and log in again. The menu now shows **หลังร้าน** (back office).

Checklist:

- [ ] The shop lists 10 products with photos
- [ ] Refreshing `/shop` does not give a 404
- [ ] A new customer can register and is logged in right away
- [ ] Ordering with card `4242 4242 4242 4242` succeeds, and `4000 0000 0000 0002` is declined
- [ ] The order appears in **คำสั่งซื้อของฉัน** and in the `shopflow-orders` table
- [ ] Stock of the ordered product goes down in `shopflow-products`
- [ ] The admin email receives "ออร์เดอร์ใหม่ …"
- [ ] The admin can change the order status and the customer sees the new status
- [ ] The admin can add a product with a photo, and a thumbnail appears in `thumbs/` a few seconds later
- [ ] Invoking `shopflow-daily-report` sends a report email

## Updating the app later

| You changed | Do this |
|---|---|
| Backend code (`backend/src`) | `./aws/build-lambda.sh`, then upload `aws-build/shopflow-backend.zip` to each Lambda (or in CloudShell: `aws lambda update-function-code --function-name <name> --zip-file fileb://shopflow-backend.zip` after uploading the zip with **Actions → Upload file**) |
| Website (`frontend/src`) | `./aws/build-web.sh …` again, then Amplify → app → **Deploy updates** and drop the new zip |
| API routes | Edit `aws/make-openapi.mjs`, regenerate, API Gateway → **API actions → Import API** (overwrite), then **Deploy API** to `prod` |

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Runtime.ImportModuleError: Cannot find module 'index'` | Handler still `index.handler` | Set the handler from the tables above |
| Thumbnails never appear; log says `Could not load the sharp module` | Zip built without the Linux `sharp` | Build with `./aws/build-lambda.sh`, not by zipping `backend/` yourself |
| Website shows `Unauthorized` on the back office | Token expired (1 hour) or user not in `admin` | Log out and in again; check the group |
| Sign-up says the password does not meet the policy | Cognito default policy | Step 4.3 |
| Sign-up works but login says `User is not confirmed` | Pre sign-up trigger missing | Step 6, then confirm that user in Cognito → Users |
| Browser blocks the image upload (CORS) | Bucket CORS missing | Step 2.3 |
| `/shop` gives 404 after refresh | Rewrite rule missing | Step 9.4 |
| No emails at all | Subscription not confirmed | Step 3.4 |
| Orders are saved but stock does not change | Stream or trigger missing | Step 1.5 and Step 6; read the logs of `shopflow-on-order-created` |

Every Lambda's logs: Lambda → function → **Monitor → View CloudWatch logs**.

## Clean up

Delete in this order when the project is finished: Amplify app → schedule → API → the 6 Lambda functions → empty and delete the S3 bucket → the two DynamoDB tables → the Cognito user pool (turn off deletion protection first) → the SNS topic.
