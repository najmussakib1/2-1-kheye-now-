import crypto from 'crypto';

export const SESSION_COOKIE_NAME = 'kheye_now_session';

/**
 * Securely hash password using scrypt with a 16-byte random salt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Verify password against stored salt:hash
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split(':');
    if (parts.length !== 2) return false;
    const [salt, key] = parts;
    const derivedKey = crypto.scryptSync(password, salt, 64);
    const keyBuffer = Buffer.from(key, 'hex');
    return crypto.timingSafeEqual(derivedKey, keyBuffer);
  } catch {
    return false;
  }
}

const SECRET_KEY = process.env.JWT_SECRET || 'kheye_now_auth_secret_key_2026';

export interface SessionData {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  exp: number;
}

export function createSessionToken(user: { id: number; full_name: string; email: string; phone_number: string }): string {
  const payload: SessionData = {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    phone_number: user.phone_number,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days expiration
  };

  const jsonPayload = JSON.stringify(payload);
  const base64Payload = Buffer.from(jsonPayload).toString('base64url');
  const hmac = crypto.createHmac('sha256', SECRET_KEY).update(base64Payload).digest('hex');
  return `${base64Payload}.${hmac}`;
}

export function verifySessionToken(token: string): SessionData | null {
  try {
    const [base64Payload, signature] = token.split('.');
    if (!base64Payload || !signature) return null;

    const expectedHmac = crypto.createHmac('sha256', SECRET_KEY).update(base64Payload).digest('hex');
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedHmac);

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const jsonPayload = Buffer.from(base64Payload, 'base64url').toString('utf8');
    const data: SessionData = JSON.parse(jsonPayload);

    if (data.exp && Date.now() > data.exp) {
      return null; // Expired
    }

    return data;
  } catch {
    return null;
  }
}
