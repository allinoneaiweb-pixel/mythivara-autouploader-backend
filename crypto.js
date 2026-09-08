import crypto from 'node:crypto';
import process from 'node:process';
import { Buffer } from 'node:buffer';
const key = () => Buffer.from(process.env.TOKEN_ENCRYPTION_KEY || '', 'base64');
export const randomValue = () => crypto.randomBytes(32).toString('base64url');
export const hash = (value) => crypto.createHash('sha256').update(value).digest('hex');
export function encrypt(value) {
  const encryptionKey = key();
  if (encryptionKey.length !== 32) throw new Error('TOKEN_ENCRYPTION_KEY must be a base64 32-byte key.');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv);
  return `${iv.toString('base64')}:${Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]).toString('base64')}:${cipher.getAuthTag().toString('base64')}`;
}
export function decrypt(value) {
  const [ivText, payload, tagText] = value.split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(ivText, 'base64'));
  decipher.setAuthTag(Buffer.from(tagText, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(payload, 'base64')), decipher.final()]).toString('utf8');
}