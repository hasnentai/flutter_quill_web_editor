/**
 * Configuration
 * =============
 * Shared configuration for Quill editor
 */

// Font whitelist for Quill (package defaults)
// Custom fonts can be added via config-override.js in your app
export const FONT_WHITELIST = [
  'roboto'
];

// Size whitelist for Quill.
// Uses explicit pixel values (style-based size format) so the toolbar dropdown
// shows real sizes like "12px", "14px". There is no "Normal" option; 12px is
// the default (it's first in the list and matches the editor's base font-size).
export const SIZE_WHITELIST = [
  '12px', '13px', '14px', '16px', '18px', '20px', '24px',
  '28px', '32px', '36px', '48px', '60px', '72px'
];

// Default font size. Must be one of SIZE_WHITELIST. Applied to the cursor when
// it sits at an unsized location, so the size dropdown shows it as the selected
// default and newly typed text uses it.
export const DEFAULT_SIZE = '14px';

// Font-weight whitelist for the custom "weight" dropdown (style-based format).
// `false` is the unset/default weight and renders as "Normal" (inherits 400).
// '600' = Semi Bold, '700' = Bold. Labels are defined in styles/weights.css.
export const WEIGHT_WHITELIST = [false, '600', '700'];

// Line-height whitelist for the custom "lineheight" dropdown (block style format).
// `false` is the unset/default and renders as "Line Height" in the picker. The
// numeric values are unitless CSS line-height multipliers and become inline
// `style="line-height: <value>"` on the block (p, h1-h6, li, ...). Labels are
// defined in styles/lineheight.css.
export const LINE_HEIGHT_WHITELIST = [false, '1', '1.15', '1.5', '2', '2.5', '3'];

// Font family mapping - maps common fonts to Quill font classes
// Custom mappings can be extended in config-override.js
export const FONT_FAMILY_MAP = {
  // Direct mappings
  'roboto': 'roboto',
  // Common sans-serif fonts map to roboto
  'arial': 'roboto',
  'helvetica': 'roboto',
  'verdana': 'roboto',
  'tahoma': 'roboto',
  'trebuchet ms': 'roboto',
  // Monospace fonts
  'courier': 'roboto',
  'courier new': 'roboto',
  'consolas': 'roboto',
  'monaco': 'roboto',
  'menlo': 'roboto'
};

// Toolbar configuration
export const TOOLBAR_OPTIONS = {
  container: [
    // Text structure - Headers
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    
    // Font family
    [{ 'font': FONT_WHITELIST }],
    
    // Font size
    [{ 'size': SIZE_WHITELIST }],

    // Font weight (Normal / Semi Bold / Bold)
    [{ 'weight': WEIGHT_WHITELIST }],

    // Text formatting
    ['bold', 'italic', 'underline', 'strike'],
    
    // Subscript / Superscript
    [{ 'script': 'sub' }, { 'script': 'super' }],
    
    // Colors
    [{ 'color': [] }, { 'background': [] }],
    
    // Lists (ordered, bullet, checklist)
    [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'list': 'check' }],
    
    // Indentation
    [{ 'indent': '-1' }, { 'indent': '+1' }],
    
    // Text alignment
    [{ 'align': [] }],

    // Line height (paragraph line spacing)
    [{ 'lineheight': LINE_HEIGHT_WHITELIST }],

    // Text direction (LTR/RTL)
    [{ 'direction': 'rtl' }],
    
    // Block formats
    ['blockquote', 'code-block'],
    
    // Media and embeds
    ['link', 'image', 'video'],
    
    // Table
    ['table-better'],
    
    // Clear formatting
    ['clean']
  ]
};

// Content change throttle (ms)
export const CONTENT_CHANGE_THROTTLE = 200;

// Media resize constraints
export const MEDIA_MIN_SIZE = 50;
export const TABLE_MIN_WIDTH = 100;

// Zoom constraints
export const ZOOM_MIN = 0.5;
export const ZOOM_MAX = 3.0;

