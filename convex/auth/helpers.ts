/**
 * Authentication helper functions for JWT validation and password hashing
 *
 * NOTE: These functions use npm packages that only work in Convex actions,
 * not in queries or mutations. For queries/mutations, use internal functions.
 */

import * as jose from "jose";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 */
export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

/**
 * Generate a JWT token
 */
export async function generateToken(
  payload: { userId: string; roles: string[] },
  secret: string,
  expiresIn: string = "28d"
): Promise<string> {
  const secretKey = new TextEncoder().encode(secret);

  const token = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretKey);

  return token;
}

/**
 * Validate a JWT token and return the payload
 */
export async function validateToken(
  token: string,
  secret: string
): Promise<{ userId: string; roles: string[] }> {
  const secretKey = new TextEncoder().encode(secret);

  const { payload } = await jose.jwtVerify(token, secretKey);

  if (!payload.userId || !Array.isArray(payload.roles)) {
    throw new Error("Invalid token payload");
  }

  return {
    userId: payload.userId as string,
    roles: payload.roles as string[],
  };
}

/**
 * Generate a random password
 */
export function generateRandomPassword(length: number = 12): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Transliterate Cyrillic to Latin for username generation
 */
export function transliterate(text: string): string {
  const cyrillic = "абвгдеёжзийклмнопрстуфхцчшщъыьэюяАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ";
  const latin = [
    "a", "b", "v", "g", "d", "e", "yo", "zh", "z", "i", "y", "k", "l", "m",
    "n", "o", "p", "r", "s", "t", "u", "f", "kh", "ts", "ch", "sh", "shch",
    "", "y", "", "e", "yu", "ya",
    "A", "B", "V", "G", "D", "E", "Yo", "Zh", "Z", "I", "Y", "K", "L", "M",
    "N", "O", "P", "R", "S", "T", "U", "F", "Kh", "Ts", "Ch", "Sh", "Shch",
    "", "Y", "", "E", "Yu", "Ya"
  ];

  return text.split("").map(char => {
    const index = cyrillic.indexOf(char);
    return index >= 0 ? latin[index] : char;
  }).join("");
}

/**
 * Generate a username from name parts
 */
export function generateUsername(lastName: string, firstName: string): string {
  const transliteratedLastName = transliterate(lastName).toLowerCase();
  const transliteratedFirstName = transliterate(firstName).toLowerCase();

  // Use first letter of first name + last name
  const base = transliteratedFirstName.charAt(0) + transliteratedLastName;

  // Remove non-alphanumeric characters
  return base.replace(/[^a-z0-9]/g, "");
}
