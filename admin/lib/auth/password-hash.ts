import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  type ScryptOptions,
} from "node:crypto";

const HASH_PREFIX = "scrypt";
const DEFAULT_SCRYPT_N = 1 << 14;
const DEFAULT_SCRYPT_R = 8;
const DEFAULT_SCRYPT_P = 1;
const DEFAULT_KEY_LENGTH = 64;
const DEFAULT_SALT_LENGTH = 16;

interface ParsedPasswordHash {
  n: number;
  r: number;
  p: number;
  salt: Buffer;
  key: Buffer;
}

function scryptAsync(
  password: string,
  salt: Buffer,
  keyLength: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keyLength, options, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(Buffer.from(derivedKey));
    });
  });
}

function getScryptOptions(n: number, r: number, p: number): ScryptOptions {
  return {
    N: n,
    r,
    p,
    // Keep maxmem above the expected working set to avoid runtime rejections.
    maxmem: 128 * n * r * 2,
  };
}

function isPositiveSafeInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}

function parsePositiveInteger(raw: string): number | null {
  const value = Number.parseInt(raw, 10);
  return isPositiveSafeInteger(value) ? value : null;
}

function parsePasswordHash(storedHash: string): ParsedPasswordHash | null {
  const parts = storedHash.split(":");

  if (parts.length !== 6 || parts[0] !== HASH_PREFIX) {
    return null;
  }

  const n = parsePositiveInteger(parts[1]);
  const r = parsePositiveInteger(parts[2]);
  const p = parsePositiveInteger(parts[3]);

  if (!n || !r || !p) {
    return null;
  }

  try {
    const salt = Buffer.from(parts[4], "base64url");
    const key = Buffer.from(parts[5], "base64url");

    if (!salt.length || !key.length) {
      return null;
    }

    return { n, r, p, salt, key };
  } catch {
    return null;
  }
}

export async function createPasswordHash(password: string): Promise<string> {
  const salt = randomBytes(DEFAULT_SALT_LENGTH);
  const key = await scryptAsync(
    password,
    salt,
    DEFAULT_KEY_LENGTH,
    getScryptOptions(DEFAULT_SCRYPT_N, DEFAULT_SCRYPT_R, DEFAULT_SCRYPT_P),
  );

  return [
    HASH_PREFIX,
    String(DEFAULT_SCRYPT_N),
    String(DEFAULT_SCRYPT_R),
    String(DEFAULT_SCRYPT_P),
    salt.toString("base64url"),
    key.toString("base64url"),
  ].join(":");
}

export async function verifyPasswordHash(
  storedHash: string,
  password: string,
): Promise<boolean> {
  const parsed = parsePasswordHash(storedHash);

  if (!parsed) {
    return false;
  }

  try {
    const candidate = await scryptAsync(
      password,
      parsed.salt,
      parsed.key.length,
      getScryptOptions(parsed.n, parsed.r, parsed.p),
    );

    return (
      candidate.length === parsed.key.length &&
      timingSafeEqual(candidate, parsed.key)
    );
  } catch {
    return false;
  }
}
