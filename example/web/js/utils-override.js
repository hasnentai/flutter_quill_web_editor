/**
 * Custom Utils Override
 * =====================
 * 
 * This file extends the package's utils.js to use custom font family mapping.
 * 
 * Last updated: 2025-12-17
 */

// Import package utils
import {
  rgbToHex,
  normalizeColor,
  mapFontSize,
  mapFontWeight,
  extractBodyContent,
  preprocessHtml,
  cleanHtmlForPreview
} from '/assets/packages/quill_web_editor/web/js/utils.js';

// Import custom font family map
import { FONT_FAMILY_MAP } from './config-override.js';

/**
 * Map font family string to Quill font class (with Mulish support)
 * @param {string} fontFamily - CSS font-family value
 * @returns {string|false} Quill font class name or false for default
 */
export function mapFontFamily(fontFamily) {
  if (!fontFamily) return false;
  
  // Clean and normalize font family
  const normalized = fontFamily
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/\s*,\s*/g, ',')
    .split(',')[0]  // Take first font in stack
    .trim();
  
  // Check our extended font family map
  return FONT_FAMILY_MAP[normalized] || false;
}

// Re-export other utility functions unchanged
export { rgbToHex, normalizeColor, mapFontSize, mapFontWeight, extractBodyContent, preprocessHtml, cleanHtmlForPreview };

