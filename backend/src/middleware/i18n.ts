import type { Context, Next } from "hono";
import { setLocale, getLocale, locales } from "../paraglide/runtime.js";
import type { Env } from "../types/env.js";

/**
 * Hono middleware to set the language based on Accept-Language header
 * or a custom X-Language header
 */
export const i18nMiddleware = async (c: Context<{ Bindings: Env }>, next: Next) => {
  // Check for custom language header first
  const customLang = c.req.header("X-Language") || c.req.header("x-language");
  
  if (customLang && isValidLanguageTag(customLang)) {
    setLocale(customLang as any);
    await next();
    return;
  }

  // Fall back to Accept-Language header
  const acceptLanguage = c.req.header("Accept-Language");
  
  if (acceptLanguage) {
    const preferredLang = parseAcceptLanguage(acceptLanguage);
    if (preferredLang && isValidLanguageTag(preferredLang)) {
      setLocale(preferredLang as any);
    }
  }
  
  // Default to 'en' if no valid language found
  const currentLocale = getLocale();
  if (!isValidLanguageTag(currentLocale)) {
    setLocale("en");
  }

  await next();
};

/**
 * Check if a language tag is valid
 */
function isValidLanguageTag(tag: string): boolean {
  return locales.includes(tag as any);
}

/**
 * Parse Accept-Language header to get the best matching language
 * Example: "en-US,en;q=0.9,ru;q=0.8" -> "en"
 */
function parseAcceptLanguage(header: string): string | null {
  const languages = header
    .split(",")
    .map((lang) => {
      const parts = lang.trim().split(";");
      const code = parts[0].split("-")[0]; // Get base language code (en from en-US)
      const quality = parts[1] ? parseFloat(parts[1].split("=")[1]) : 1.0;
      return { code, quality };
    })
    .sort((a, b) => b.quality - a.quality);

  // Find first language that we support
  for (const lang of languages) {
    if (isValidLanguageTag(lang.code)) {
      return lang.code;
    }
  }

  return null;
}
