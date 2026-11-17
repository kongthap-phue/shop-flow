import { writeFileSync } from 'node:fs';

const [region, accountId, userPoolId, out] = process.argv.slice(2);
if (!out) {
  console.error('usage: node aws/make-openapi.mjs <region> <account-id> <user-pool-id> <output.json>');
  process.exit(1);
}

const lambdaUri = `arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/arn:aws:lambda:${region}:${accountId}:function:shopflow-api/invocations`;
const cors = {
  'Access-Control-Allow-Origin': "'*'",
  'Access-Control-Allow-Headers': "'Content-Type,Authorization'",
  'Access-Control-Allow-Methods': "'GET,POST,PUT,PATCH,DELETE,OPTIONS'",
};

const lambda = (secured) => ({
  ...(secured ? { security: [{ cognito: [] }] } : {}),
  responses: { 200: { description: 'OK' } },
  'x-amazon-apigateway-integration': { type: 'aws_proxy', httpMethod: 'POST', uri: lambdaUri },
});

const options = {
  responses: {
    200: {
      description: 'CORS',
      headers: Object.fromEntries(Object.keys(cors).map((h) => [h, { schema: { type: 'string' } }])),
    },
  },
  'x-amazon-apigateway-integration': {
    type: 'mock',
    requestTemplates: { 'application/json': '{"statusCode": 200}' },
    responses: {
      default: {
        statusCode: '200',
        responseParameters: Object.fromEntries(Object.entries(cors).map(([h, v]) => [`method.response.header.${h}`, v])),
      },
    },
  },
};

const idParam = [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }];

const spec = {
  openapi: '3.0.1',
  info: { title: 'shopflow-api', version: '1.0' },
  paths: {
    '/products': { get: lambda(false), post: lambda(true), options },
    '/products/{id}': { parameters: idParam, get: lambda(false), put: lambda(true), delete: lambda(true), options },
    '/uploads': { post: lambda(true), options },
    '/orders': { get: lambda(true), post: lambda(true), options },
    '/orders/me': { get: lambda(true), options },
    '/orders/{id}': { parameters: idParam, patch: lambda(true), options },
  },
  components: {
    securitySchemes: {
      cognito: {
        type: 'apiKey',
        name: 'Authorization',
        in: 'header',
        'x-amazon-apigateway-authtype': 'cognito_user_pools',
        'x-amazon-apigateway-authorizer': {
          type: 'cognito_user_pools',
          providerARNs: [`arn:aws:cognito-idp:${region}:${accountId}:userpool/${userPoolId}`],
        },
      },
    },
  },
  'x-amazon-apigateway-gateway-responses': Object.fromEntries(
    ['DEFAULT_4XX', 'DEFAULT_5XX'].map((type) => [
      type,
      {
        responseParameters: Object.fromEntries(
          Object.entries(cors).map(([h, v]) => [`gatewayresponse.header.${h}`, v]),
        ),
      },
    ]),
  ),
};

writeFileSync(out, JSON.stringify(spec));
console.log(`wrote ${out}`);
