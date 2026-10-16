import crypto from 'crypto';

export interface EncryptedPayload {
  algorithm: 'aes-256-gcm';
  iv: string; // Hex (12 bytes)
  ciphertext: string; // Hex
  authTag: string; // Hex (16 bytes)
  timestamp: string;
}

// Master encryption key: 32 bytes (256 bits). Uses environment variable or persistent runtime secret.
const ENCRYPTION_MASTER_KEY: Buffer = (() => {
  const envKey = process.env.APP_ENCRYPTION_KEY;
  if (envKey && envKey.trim().length >= 32) {
    return crypto.createHash('sha256').update(envKey).digest();
  }
  // In development/testing, derive deterministic salt-based 256-bit key
  const fallbackSecret = process.env.AUDIT_HMAC_SECRET || 'zyconomes_default_secure_vault_256_bit_key_salt';
  return crypto.createHash('sha256').update(fallbackSecret).digest();
})();

/**
 * Encrypts sensitive string data (PII, financial notes, balances) using authenticated AES-256-GCM.
 */
export function encryptField(plaintext: string): EncryptedPayload {
  if (typeof plaintext !== 'string') {
    throw new Error('Plaintext must be a string');
  }

  // 12 bytes IV is NIST recommended for GCM mode
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_MASTER_KEY, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return {
    algorithm: 'aes-256-gcm',
    iv: iv.toString('hex'),
    ciphertext: encrypted,
    authTag: authTag.toString('hex'),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Decrypts an authenticated AES-256-GCM payload.
 * Throws an error if ciphertext or authTag is tampered with.
 */
export function decryptField(payload: EncryptedPayload): string {
  if (!payload || payload.algorithm !== 'aes-256-gcm') {
    throw new Error('Invalid encryption payload algorithm');
  }

  const iv = Buffer.from(payload.iv, 'hex');
  const authTag = Buffer.from(payload.authTag, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_MASTER_KEY, iv);

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(payload.ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Demonstrator for UI and security tests: returns simulated step-by-step cryptographic transformations.
 */
export function simulateEncryptionDemo(sampleText: string) {
  const sample = sampleText || 'R$ 150.000,00 - Reserva de Emergência Primária';
  const encrypted = encryptField(sample);
  const decrypted = decryptField(encrypted);
  const isMatch = decrypted === sample;

  return {
    original: sample,
    encrypted,
    decrypted,
    verifiedIntegrity: isMatch,
    keyFingerprint: crypto.createHash('sha256').update(ENCRYPTION_MASTER_KEY).digest('hex').substring(0, 16),
  };
}
