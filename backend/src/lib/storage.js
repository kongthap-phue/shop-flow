const impl = process.env.BUCKET ? await import('./storage-aws.js') : await import('./storage-local.js');

export const { createUploadUrl, publicUrl, thumbKeyFor, readObject, writeObject } = impl;
