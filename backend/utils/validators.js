const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_REGEX.test(email.trim());
}

/**
 * Minimum bar for a usable password. Kept simple and beginner-friendly:
 * at least 8 characters. Extend later if you want complexity rules.
 */
function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 8;
}

function isValidName(name) {
  return typeof name === 'string' && name.trim().length >= 2 && name.trim().length <= 120;
}

/**
 * Only BUYER and SELLER can be chosen at registration.
 * ADMIN accounts are created directly in the database (seed.sql) or by
 * another admin — never via public self-registration.
 */
function isValidRegisterRole(role) {
  return role === 'BUYER' || role === 'SELLER';
}

const PRODUCT_CONDITIONS = ['NEW', 'LIKE_NEW', 'USED', 'REFURBISHED'];

function isValidProductTitle(title) {
  return typeof title === 'string' && title.trim().length >= 3 && title.trim().length <= 190;
}

function isValidPrice(price) {
  const n = Number(price);
  return Number.isFinite(n) && n > 0 && n <= 100000000;
}

function isValidCondition(condition) {
  return PRODUCT_CONDITIONS.includes(condition);
}

function isValidQuantity(qty) {
  const n = Number(qty);
  return Number.isInteger(n) && n >= 0;
}

/** Accepts an ISO string / anything `new Date()` can parse into a real, finite date. */
function isValidDate(value) {
  if (!value) return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}

/** Optional scannable code: letters/digits/dashes/underscores, 3-64 chars if provided. */
function isValidSku(sku) {
  if (sku === undefined || sku === null || sku === '') return true;
  return typeof sku === 'string' && /^[A-Za-z0-9_-]{3,64}$/.test(sku);
}

module.exports = {
  isValidEmail,
  isValidPassword,
  isValidName,
  isValidRegisterRole,
  PRODUCT_CONDITIONS,
  isValidProductTitle,
  isValidPrice,
  isValidCondition,
  isValidQuantity,
  isValidDate,
  isValidSku,
};
