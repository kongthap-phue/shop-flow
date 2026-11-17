import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({});
const Bucket = process.env.BUCKET;
const ASSET_BASE_URL = process.env.ASSET_BASE_URL;

export const createUploadUrl = (key, contentType) =>
  getSignedUrl(s3, new PutObjectCommand({ Bucket, Key: key, ContentType: contentType }), { expiresIn: 300 });

export function publicUrl(key) {
  if (!key) return null;
  if (ASSET_BASE_URL) return `${ASSET_BASE_URL}/${key}`;
  return getSignedUrl(s3, new GetObjectCommand({ Bucket, Key: key }), { expiresIn: 12 * 60 * 60 });
}

export const thumbKeyFor = (key) => key.replace(/^uploads\//, 'thumbs/').replace(/\.[^.]+$/, '.webp');

export async function readObject(key) {
  const res = await s3.send(new GetObjectCommand({ Bucket, Key: key }));
  return Buffer.from(await res.Body.transformToByteArray());
}

export const writeObject = (key, body, contentType) =>
  s3.send(new PutObjectCommand({ Bucket, Key: key, Body: body, ContentType: contentType }));
