import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DeleteCommand, DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const doc = DynamoDBDocumentClient.from(new DynamoDBClient({}), { marshallOptions: { removeUndefinedValues: true } });
const PRODUCTS = process.env.PRODUCTS_TABLE;
const ORDERS = process.env.ORDERS_TABLE;

async function scanAll(TableName) {
  const items = [];
  let ExclusiveStartKey;
  do {
    const page = await doc.send(new ScanCommand({ TableName, ExclusiveStartKey }));
    items.push(...page.Items);
    ExclusiveStartKey = page.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return items;
}

const getItem = async (TableName, Key) => (await doc.send(new GetCommand({ TableName, Key }))).Item ?? null;

async function updateItem(TableName, Key, patch) {
  const names = {};
  const values = {};
  const sets = Object.entries(patch).map(([field, value], i) => {
    names[`#f${i}`] = field;
    values[`:v${i}`] = value;
    return `#f${i} = :v${i}`;
  });
  try {
    const res = await doc.send(
      new UpdateCommand({
        TableName,
        Key,
        UpdateExpression: `SET ${sets.join(', ')}`,
        ConditionExpression: `attribute_exists(${Object.keys(Key)[0]})`,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ReturnValues: 'ALL_NEW',
      }),
    );
    return res.Attributes;
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') return null;
    throw err;
  }
}

export const listProducts = () => scanAll(PRODUCTS);
export const getProduct = (productId) => getItem(PRODUCTS, { productId });
export const putProduct = (product) => doc.send(new PutCommand({ TableName: PRODUCTS, Item: product }));
export const deleteProduct = (productId) => doc.send(new DeleteCommand({ TableName: PRODUCTS, Key: { productId } }));

export async function adjustStock(productId, delta) {
  const product = await getProduct(productId);
  if (!product) return null;
  return updateItem(PRODUCTS, { productId }, { stock: Math.max(0, product.stock + delta), updatedAt: new Date().toISOString() });
}

export const listOrders = () => scanAll(ORDERS);
export const getOrder = (orderId) => getItem(ORDERS, { orderId });
export const putOrder = (order) => doc.send(new PutCommand({ TableName: ORDERS, Item: order }));
export const updateOrder = (orderId, patch) => updateItem(ORDERS, { orderId }, patch);

export async function listOrdersByUser(userId) {
  const res = await doc.send(
    new QueryCommand({
      TableName: ORDERS,
      IndexName: 'byUser',
      KeyConditionExpression: 'userId = :u',
      ExpressionAttributeValues: { ':u': userId },
    }),
  );
  return res.Items;
}
