import sharp from 'sharp';
import { readObject, thumbKeyFor, writeObject } from '../lib/storage.js';

export const handler = async (event) => {
  for (const record of event.Records ?? []) {
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
    if (!key.startsWith('uploads/')) continue;

    const original = await readObject(key);
    const thumb = await sharp(original).rotate().resize(600, 750, { fit: 'cover', position: sharp.strategy.attention }).webp({ quality: 80 }).toBuffer();
    await writeObject(thumbKeyFor(key), thumb, 'image/webp');
    console.log(`ย่อรูปแล้ว: ${key} → ${thumbKeyFor(key)}`);
  }
};
