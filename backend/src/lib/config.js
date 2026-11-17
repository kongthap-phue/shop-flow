import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');

export const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data');
export const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(ROOT, 'uploads');

export const ASSET_BASE_URL = process.env.ASSET_BASE_URL || '/api/assets';
export const UPLOAD_BASE_URL = process.env.UPLOAD_BASE_URL || '/api/local-upload';

export const LOW_STOCK = Number(process.env.LOW_STOCK_THRESHOLD ?? 5);
