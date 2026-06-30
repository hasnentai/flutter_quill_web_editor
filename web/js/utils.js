/**
 * Utility Functions
 * =================
 * Shared utilities for Quill editor
 */

import { FONT_FAMILY_MAP, SIZE_WHITELIST } from './config.js';
import { applyOrderedListContinuation } from './list-numbering.js';

// Whitelisted pixel sizes (the string entries of SIZE_WHITELIST, e.g. '14px')
const SIZE_PX_WHITELIST = SIZE_WHITELIST.filter((s) => typeof s === 'string');

/**
 * Snap an arbitrary pixel value to the nearest whitelisted px size.
 * @param {number} px - pixel value
 * @returns {string|false} nearest whitelisted size (e.g. '14px') or false
 */
function snapToWhitelist(px) {
  if (px === null || isNaN(px) || SIZE_PX_WHITELIST.length === 0) return false;
  let nearest = SIZE_PX_WHITELIST[0];
  let best = Infinity;
  for (const s of SIZE_PX_WHITELIST) {
    const diff = Math.abs(parseFloat(s) - px);
    if (diff < best) {
      best = diff;
      nearest = s;
    }
  }
  return nearest;
}

/**
 * Convert RGB/RGBA color to hex format
 * @param {string} rgb - RGB or RGBA color string
 * @returns {string|null} Hex color or null
 */
export function rgbToHex(rgb) {
  if (!rgb) return null;
  if (rgb.startsWith('#')) return rgb;
  
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    const r = parseInt(match[1]).toString(16).padStart(2, '0');
    const g = parseInt(match[2]).toString(16).padStart(2, '0');
    const b = parseInt(match[3]).toString(16).padStart(2, '0');
    return '#' + r + g + b;
  }
  return rgb;
}

/**
 * Normalize color to hex format for consistency
 * Handles named colors, rgb, rgba, and hex
 * @param {string} color - Color string in any format
 * @returns {string|null} Hex color or null
 */
export function normalizeColor(color) {
  if (!color) return null;
  color = color.trim();
  
  // Already hex
  if (color.startsWith('#')) return color;
  
  // Named colors - let browser convert
  const tempEl = document.createElement('div');
  tempEl.style.color = color;
  document.body.appendChild(tempEl);
  const computed = getComputedStyle(tempEl).color;
  document.body.removeChild(tempEl);
  
  return rgbToHex(computed);
}

/**
 * Map font family string to Quill font class
 * @param {string} fontFamily - CSS font-family value
 * @returns {string|false} Quill font class name or false for default
 */
export function mapFontFamily(fontFamily) {
  if (!fontFamily) return false;
  
  // Clean and normalize font family
  const fonts = fontFamily.toLowerCase()
    .split(',')
    .map(f => f.trim().replace(/['"]/g, ''));
  
  // Try to match each font in the stack
  for (const font of fonts) {
    if (FONT_FAMILY_MAP[font]) {
      return FONT_FAMILY_MAP[font];
    }
    // Try partial match
    for (const [key, value] of Object.entries(FONT_FAMILY_MAP)) {
      if (font.includes(key) || key.includes(font)) {
        return value;
      }
    }
  }
  
  return false; // default font
}

/**
 * Map font size to Quill size class
 * @param {string} size - CSS font-size value
 * @returns {string|false} Quill size class name or false for normal
 */
export function mapFontSize(size) {
  if (!size) return false;
  const sizeStr = size.toLowerCase().trim();
  
  // Handle px values
  let pxValue = null;
  if (sizeStr.endsWith('px')) {
    pxValue = parseFloat(sizeStr);
  } else if (sizeStr.endsWith('pt')) {
    pxValue = parseFloat(sizeStr) * 1.333; // pt to px
  } else if (sizeStr.endsWith('em')) {
    pxValue = parseFloat(sizeStr) * 16; // assuming base 16px
  } else if (sizeStr.endsWith('rem')) {
    pxValue = parseFloat(sizeStr) * 16;
  } else if (!isNaN(parseFloat(sizeStr))) {
    pxValue = parseFloat(sizeStr);
  }
  
  // Handle keyword sizes - convert to an approximate px value
  if (sizeStr === 'small' || sizeStr === 'x-small' || sizeStr === 'xx-small') pxValue = 12;
  else if (sizeStr === 'large' || sizeStr === 'x-large') pxValue = 24;
  else if (sizeStr === 'xx-large' || sizeStr === 'xxx-large') pxValue = 32;

  // Snap any resolved px value to the nearest whitelisted size
  if (pxValue !== null) {
    return snapToWhitelist(pxValue);
  }

  return false; // normal/default size
}

/**
 * Map an arbitrary CSS font-weight to one of the dropdown options.
 * Snaps to: false (Normal / <=400), '600' (Semi Bold), '700' (Bold).
 * @param {string|number} weight - CSS font-weight value
 * @returns {string|false} '600', '700', or false for normal/unset
 */
export function mapFontWeight(weight) {
  if (!weight) return false;
  const w = weight.toString().toLowerCase().trim();

  let num = null;
  if (w === 'bold' || w === 'bolder') num = 700;
  else if (w === 'normal' || w === 'lighter') num = 400;
  else if (!isNaN(parseInt(w, 10))) num = parseInt(w, 10);

  if (num === null) return false;
  if (num >= 700) return '700'; // 700-900 -> Bold
  if (num >= 500) return '600'; // 500-699 -> Semi Bold
  return false; // <=400 -> Normal (unset)
}

/**
 * Pre-process HTML to convert inline styles to Quill classes
 * @param {string} html - HTML string to process
 * @returns {string} Processed HTML with Quill classes
 */
export function preprocessHtml(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString('<div>' + html + '</div>', 'text/html');
  const container = doc.body.firstChild;
  
  // Process all elements with inline styles
  container.querySelectorAll('*').forEach(el => {
    const style = el.style;
    const classes = [];
    let fontClass = null;
    let colorStyle = null;
    let bgColorStyle = null;
    
    // Convert font-family to ql-font-* class
    if (style.fontFamily) {
      const font = mapFontFamily(style.fontFamily);
      if (font) {
        fontClass = 'ql-font-' + font;
        classes.push(fontClass);
        style.removeProperty('font-family');
      }
    }
    
    // Normalize inline font-size to a whitelisted px value (style-based size format)
    if (style.fontSize) {
      const size = mapFontSize(style.fontSize);
      if (size) {
        style.fontSize = size; // e.g. '14px'
      } else {
        style.removeProperty('font-size');
      }
    }
    
    // Normalize and preserve color
    if (style.color) {
      const normalizedColor = normalizeColor(style.color);
      if (normalizedColor) {
        colorStyle = normalizedColor;
        style.color = normalizedColor;
      }
    }
    
    // Normalize and preserve background color
    if (style.backgroundColor) {
      const normalizedBg = normalizeColor(style.backgroundColor);
      if (normalizedBg) {
        bgColorStyle = normalizedBg;
        style.backgroundColor = normalizedBg;
      }
    }
    
    // Add classes if any
    if (classes.length > 0) {
      el.className = (el.className ? el.className + ' ' : '') + classes.join(' ');
    }
    
    // Special handling for images, videos, and iframes - preserve width/height and alignment
    if (el.tagName === 'IMG' || el.tagName === 'VIDEO' || el.tagName === 'IFRAME') {
      // Convert width/height attributes to inline styles (Quill preserves inline styles better)
      if (el.hasAttribute('width')) {
        const widthAttr = el.getAttribute('width');
        if (widthAttr && widthAttr.trim()) {
          // Convert attribute to inline style if not already present
          if (!style.width || style.width === 'auto' || style.width === '') {
            const widthValue = widthAttr.trim();
            // Add 'px' if it's a number without unit
            if (/^\d+$/.test(widthValue)) {
              style.width = widthValue + 'px';
            } else if (widthValue.includes('%') || widthValue.includes('px') || widthValue.includes('em') || widthValue.includes('rem')) {
              style.width = widthValue;
            } else {
              style.width = widthValue + 'px';
            }
          }
        }
      }
      
      if (el.hasAttribute('height')) {
        const heightAttr = el.getAttribute('height');
        if (heightAttr && heightAttr.trim()) {
          // Convert attribute to inline style if not already present
          if (!style.height || style.height === 'auto' || style.height === '') {
            const heightValue = heightAttr.trim();
            // Add 'px' if it's a number without unit
            if (/^\d+$/.test(heightValue)) {
              style.height = heightValue + 'px';
            } else if (heightValue.includes('%') || heightValue.includes('px') || heightValue.includes('em') || heightValue.includes('rem')) {
              style.height = heightValue;
            } else {
              style.height = heightValue + 'px';
            }
          }
        }
      }
      
      // Ensure width/height styles are preserved (don't remove them)
      // They will be kept in the inline style attribute
      
      // Preserve or detect alignment classes
      const existingClasses = el.className ? el.className.split(/\s+/) : [];
      const hasAlignmentClass = existingClasses.some(cls => 
        cls === 'align-left' || cls === 'align-center' || cls === 'align-right'
      );
      
      if (!hasAlignmentClass) {
        // Detect alignment from styles and add class
        if (style.float === 'left' || (style.textAlign && style.textAlign.includes('left'))) {
          el.classList.add('align-left');
        } else if (style.float === 'right' || (style.textAlign && style.textAlign.includes('right'))) {
          el.classList.add('align-right');
        } else if ((style.marginLeft === 'auto' && style.marginRight === 'auto') || 
                   (style.textAlign && style.textAlign.includes('center'))) {
          el.classList.add('align-center');
        }
      }
    }
    
    // Special handling for table cells (TD, TH) - wrap text content in span with formatting
    if ((el.tagName === 'TD' || el.tagName === 'TH') && (fontClass || sizeClass || colorStyle)) {
      const hasFormattedChildren = el.querySelector('span[class*="ql-font"], span[class*="ql-size"]');
      
      if (!hasFormattedChildren) {
        const wrapContent = (parent) => {
          const childNodes = Array.from(parent.childNodes);
          childNodes.forEach(child => {
            if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
              const span = doc.createElement('span');
              if (fontClass) span.classList.add(fontClass);
              if (sizeClass) span.classList.add(sizeClass);
              if (colorStyle) span.style.color = colorStyle;
              span.textContent = child.textContent;
              child.replaceWith(span);
            } else if (child.nodeType === Node.ELEMENT_NODE) {
              if (child.tagName === 'P' || child.tagName === 'DIV') {
                wrapContent(child);
              } else if (child.tagName === 'SPAN' && !child.className.includes('ql-font') && !child.className.includes('ql-size')) {
                if (fontClass && !child.classList.contains(fontClass)) child.classList.add(fontClass);
                if (sizeClass && !child.classList.contains(sizeClass)) child.classList.add(sizeClass);
                if (colorStyle && !child.style.color) child.style.color = colorStyle;
              }
            }
          });
        };
        wrapContent(el);
      }
    }
  });
  
  // Handle <font> tags - convert to spans with proper styling
  container.querySelectorAll('font').forEach(font => {
    const span = doc.createElement('span');
    span.innerHTML = font.innerHTML;
    
    // Copy color attribute
    if (font.color) {
      const normalizedColor = normalizeColor(font.color);
      if (normalizedColor) {
        span.style.color = normalizedColor;
      }
    }
    
    // Copy face attribute (font family)
    if (font.face) {
      const mappedFont = mapFontFamily(font.face);
      if (mappedFont) {
        span.classList.add('ql-font-' + mappedFont);
      }
    }
    
    // Copy size attribute
    if (font.size) {
      const size = parseInt(font.size);
      if (size <= 2) span.classList.add('ql-size-small');
      else if (size >= 5) span.classList.add('ql-size-large');
      else if (size >= 6) span.classList.add('ql-size-huge');
    }
    
    font.parentNode.replaceChild(span, font);
  });
  
  return container.innerHTML;
}

/**
 * Extract body content from full HTML document
 * @param {string} html - Full HTML document or fragment
 * @returns {string} Body content only
 */
export function extractBodyContent(html) {
  if (html.includes('<!DOCTYPE') || html.includes('<html')) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const body = doc.body;
    if (body) {
      return body.innerHTML;
    }
  }
  return html;
}

/**
 * Clean HTML for preview by removing selection classes
 * @param {string} html - HTML to clean
 * @returns {string} Cleaned HTML
 */
export function cleanHtmlForPreview(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Classes to remove (selection-related)
  const selectionClasses = [
    'selected', 'ql-cell-selected', 'ql-table-selected', 
    'ql-cell-focused', 'ql-table-better-selected-td',
    'ql-table-better-selection-line', 'ql-table-better-selection-block'
  ];
  
  // Classes to preserve (alignment-related)
  const preserveClasses = ['align-left', 'align-center', 'align-right', 'table-with-header'];
  
  // Remove selection classes from all elements
  doc.querySelectorAll('*').forEach(el => {
    selectionClasses.forEach(cls => {
      el.classList.remove(cls);
    });
    
    // Remove any class containing 'select' (but preserve alignment and header classes)
    const classesToRemove = [];
    el.classList.forEach(cls => {
      if (cls.includes('select') && !preserveClasses.includes(cls)) {
        classesToRemove.push(cls);
      }
    });
    classesToRemove.forEach(cls => el.classList.remove(cls));
    
    // Remove inline background styles from table cells (selection colors)
    if (el.tagName === 'TD' || el.tagName === 'TH') {
      const bgStyle = el.style.backgroundColor;
      if (bgStyle && (bgStyle.includes('rgb(') || bgStyle.includes('rgba('))) {
        const match = bgStyle.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (match) {
          const [, r, g, b] = match.map(Number);
          // Remove if it's a light blue/selection color (high blue component)
          if (b > r && b > g) {
            el.style.removeProperty('background-color');
            el.style.removeProperty('background');
          }
        }
      }
    }
  });
  
  // Remove quill-table-better tool elements entirely
  doc.querySelectorAll('[class*="ql-table-better-tool"], [class*="ql-table-better-col"], [class*="ql-table-better-row"], [class*="ql-table-better-corner"]').forEach(el => {
    el.remove();
  });

  // Keep numbered lists continuous across tables in the read-only preview too.
  applyOrderedListContinuation(doc.body);

  return doc.body.innerHTML;
}

