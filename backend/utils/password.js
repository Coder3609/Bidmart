/**
 * Password hashing using Node's built-in `crypto` module (scrypt).
 *
 * We intentionally avoid a third-party hashing library so the project has
 * one fewer dependency to install/compile. scrypt is a well-regarded,
 * memory-hard password hashing algorithm built into Node itself.
 *
 * Stored format: "scrypt$<saltHex>$<hashHex>"
 */

const crypto = require('crypto');

const KEY_LENGTH = 64;

function hashPassword(plainPassword) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(plainPassword, salt, KEY_LENGTH).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(plainPassword, storedHash) {
  if (!storedHash || typeof storedHash !== 'string') return false;

  const parts = storedHash.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;

  const [, salt, hashHex] = parts;
  const storedBuffer = Buffer.from(hashHex, 'hex');
  const suppliedBuffer = crypto.scryptSync(plainPassword, salt, KEY_LENGTH);

  // Buffers must be equal length for timingSafeEqual.
  if (storedBuffer.length !== suppliedBuffer.length) return false;

  return crypto.timingSafeEqual(storedBuffer, suppliedBuffer);
}

module.exports = { hashPassword, verifyPassword };
