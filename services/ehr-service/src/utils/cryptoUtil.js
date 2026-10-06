import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

// Master key from env (32 bytes hex = 64 characters)
const getMasterKey = () => {
  const hexKey = process.env.EHR_MASTER_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  return Buffer.from(hexKey, 'hex');
};

/**
 * Encrypt plaintext using AES-256-GCM
 * Returns { ciphertext, iv, authTag } (all hex encoded)
 */
export const encryptField = (plaintext) => {
  if (plaintext === undefined || plaintext === null) return null;
  const key = getMasterKey();
  const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(typeof plaintext === 'string' ? plaintext : JSON.stringify(plaintext), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return {
    ciphertext: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag
  };
};

/**
 * Decrypt AES-256-GCM encrypted package
 */
export const decryptField = (encryptedObj) => {
  if (!encryptedObj || !encryptedObj.ciphertext || !encryptedObj.iv || !encryptedObj.authTag) {
    return null;
  }

  const key = getMasterKey();
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(encryptedObj.iv, 'hex')
  );

  decipher.setAuthTag(Buffer.from(encryptedObj.authTag, 'hex'));

  let decrypted = decipher.update(encryptedObj.ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  try {
    return JSON.parse(decrypted);
  } catch {
    return decrypted;
  }
};

/**
 * Compute SHA-256 hash for tamper-evident hash chaining
 */
export const computeAuditHash = ({ index, timestamp, userId, action, resourceId, previousHash }) => {
  const data = `${index}|${timestamp}|${userId}|${action}|${resourceId}|${previousHash}`;
  return crypto.createHash('sha256').update(data).digest('hex');
};
