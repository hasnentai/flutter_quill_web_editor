/**
 * Quill Setup
 * ===========
 * Quill editor initialization and registration
 */

import { FONT_WHITELIST, SIZE_WHITELIST, WEIGHT_WHITELIST, DEFAULT_SIZE, TOOLBAR_OPTIONS } from './config.js';
import { rgbToHex, mapFontFamily, mapFontSize, mapFontWeight } from './utils.js';

/**
 * Register custom formats and modules with Quill
 * @param {Object} Quill - Quill constructor
 * @param {Object} QuillTableBetter - Table Better module
 */
export function registerQuillModules(Quill, QuillTableBetter) {
  // Register Table Better module
  Quill.register({
    'modules/table-better': QuillTableBetter
  }, true);

  // Register custom fonts
  const Font = Quill.import('formats/font');
  Font.whitelist = FONT_WHITELIST;
  Quill.register(Font, true);

  // Register px-based font sizes using the inline-style size attributor.
  // This makes the dropdown show real values (12px, 14px, ...) and produces
  // `style="font-size: 14px"` output instead of `class="ql-size-*"`.
  const SizeStyle = Quill.import('attributors/style/size');
  SizeStyle.whitelist = SIZE_WHITELIST;
  Quill.register(SizeStyle, true);

  // Register a custom "weight" format backed by inline font-weight, used by the
  // Normal / Semi Bold / Bold dropdown. This is independent of the bold button.
  const Parchment = Quill.import('parchment');
  const WeightStyle = new Parchment.StyleAttributor('weight', 'font-weight', {
    scope: Parchment.Scope.INLINE,
    whitelist: WEIGHT_WHITELIST.filter((w) => typeof w === 'string'),
  });
  Quill.register({ 'formats/weight': WeightStyle }, true);
}

/**
 * Create clipboard matchers for paste handling
 * @param {Object} Quill - Quill constructor
 * @returns {Array} Array of clipboard matchers
 */
export function createClipboardMatchers(Quill) {
  const Delta = Quill.import('delta');
  
  return [
    // Match any element with inline styles
    [Node.ELEMENT_NODE, function(node, delta) {
      const style = node.style;
      const formats = {};
      
      // Parse font-family
      if (style.fontFamily) {
        const font = mapFontFamily(style.fontFamily);
        if (font) formats.font = font;
      }
      
      // Parse font-size
      if (style.fontSize) {
        const size = mapFontSize(style.fontSize);
        if (size) formats.size = size;
      }
      
      // Parse color - normalize to hex
      if (style.color) {
        const hexColor = rgbToHex(style.color);
        if (hexColor) formats.color = hexColor;
      }
      
      // Parse background-color - normalize to hex
      if (style.backgroundColor) {
        const hexBg = rgbToHex(style.backgroundColor);
        if (hexBg) formats.background = hexBg;
      }
      
      // Parse font-weight → weight format (snapped to dropdown options)
      if (style.fontWeight) {
        const mappedWeight = mapFontWeight(style.fontWeight);
        if (mappedWeight) formats.weight = mappedWeight;
      }
      
      // Parse font-style (italic)
      if (style.fontStyle === 'italic') {
        formats.italic = true;
      }
      
      // Parse text-decoration (underline, strikethrough)
      if (style.textDecoration) {
        const decoration = style.textDecoration.toLowerCase();
        if (decoration.includes('underline')) formats.underline = true;
        if (decoration.includes('line-through')) formats.strike = true;
      }
      
      // Parse text-align
      if (style.textAlign && style.textAlign !== 'start' && style.textAlign !== 'left') {
        formats.align = style.textAlign;
      }
      
      // Apply formats to all ops in the delta
      if (Object.keys(formats).length > 0) {
        return delta.compose(new Delta().retain(delta.length(), formats));
      }
      
      return delta;
    }],
    
    // Match <font> tags (legacy HTML)
    ['FONT', function(node, delta) {
      const formats = {};
      
      // Handle color attribute - normalize to hex
      if (node.color) {
        let color = node.color;
        if (!color.startsWith('#') && !color.startsWith('rgb')) {
          if (/^[0-9a-fA-F]{6}$/.test(color)) {
            color = '#' + color;
          }
        }
        formats.color = color;
      }
      
      // Handle face attribute (font family)
      if (node.face) {
        const font = mapFontFamily(node.face);
        if (font) formats.font = font;
      }
      
      // Handle size attribute (1-7) - map to a whitelisted px value
      if (node.size) {
        const size = parseInt(node.size);
        if (size <= 2) formats.size = '12px';
        else if (size >= 6) formats.size = '32px';
        else if (size >= 5) formats.size = '24px';
      }
      
      if (Object.keys(formats).length > 0) {
        return delta.compose(new Delta().retain(delta.length(), formats));
      }
      return delta;
    }],
    
    // Match <span> with class-based fonts
    ['SPAN', function(node, delta) {
      const formats = {};
      const className = node.className || '';
      
      // Check for ql-font-* classes
      const fontMatch = className.match(/ql-font-(\S+)/);
      if (fontMatch) {
        formats.font = fontMatch[1];
      }
      
      // Check for ql-size-* classes (legacy keyword sizes) - map to px
      const sizeMatch = className.match(/ql-size-(\S+)/);
      if (sizeMatch) {
        const mappedSize = mapFontSize(sizeMatch[1]);
        if (mappedSize) formats.size = mappedSize;
      }
      
      if (Object.keys(formats).length > 0) {
        return delta.compose(new Delta().retain(delta.length(), formats));
      }
      return delta;
    }],
    
    // Match <td> table cells with fonts/formatting
    ['TD', createCellMatcher(Quill)],
    
    // Match <th> table headers with fonts/formatting
    ['TH', createCellMatcher(Quill)],
    
    // Match <img> tags - preserve width/height and alignment
    ['IMG', function(node, delta) {
      // Images are handled by Quill's image blot, but we need to ensure
      // width/height styles are preserved. Quill will preserve the image
      // element as-is, so we just need to make sure the styles are in the HTML.
      // This matcher doesn't modify the delta, but ensures the node keeps its styles.
      return delta;
    }],
    
    // Match <video> tags - preserve width/height and alignment
    ['VIDEO', function(node, delta) {
      // Similar to images - preserve styles
      return delta;
    }],
    
    // Match <iframe> tags - preserve width/height and alignment
    ['IFRAME', function(node, delta) {
      // Similar to images - preserve styles
      return delta;
    }]
  ];
}

/**
 * Create a cell matcher for TD/TH elements
 * @param {Object} Quill - Quill constructor
 * @returns {Function} Matcher function
 */
function createCellMatcher(Quill) {
  const Delta = Quill.import('delta');
  
  return function(node, delta) {
    const formats = {};
    const className = node.className || '';
    const style = node.style;
    
    // Check for ql-font-* classes
    const fontMatch = className.match(/ql-font-(\S+)/);
    if (fontMatch) {
      formats.font = fontMatch[1];
    }
    
    // Check for ql-size-* classes
    const sizeMatch = className.match(/ql-size-(\S+)/);
    if (sizeMatch) {
      formats.size = sizeMatch[1];
    }
    
    // Parse inline font-family
    if (style.fontFamily) {
      const font = mapFontFamily(style.fontFamily);
      if (font) formats.font = font;
    }
    
    // Parse inline font-size
    if (style.fontSize) {
      const size = mapFontSize(style.fontSize);
      if (size) formats.size = size;
    }

    // Parse inline font-weight → weight format (snapped to dropdown options)
    if (style.fontWeight) {
      const mappedWeight = mapFontWeight(style.fontWeight);
      if (mappedWeight) formats.weight = mappedWeight;
    }

    // Parse inline color
    if (style.color) {
      const hexColor = rgbToHex(style.color);
      if (hexColor) formats.color = hexColor;
    }
    
    // Parse inline background color
    if (style.backgroundColor) {
      const hexBg = rgbToHex(style.backgroundColor);
      if (hexBg) formats.background = hexBg;
    }
    
    if (Object.keys(formats).length > 0) {
      return delta.compose(new Delta().retain(delta.length(), formats));
    }
    return delta;
  };
}

/**
 * Initialize Quill editor with all modules and configurations
 * @param {Object} Quill - Quill constructor
 * @param {Object} QuillTableBetter - Table Better module
 * @param {string} selector - Editor container selector
 * @returns {Object} Quill editor instance
 */
/**
 * Make `defaultSize` the active default in the size dropdown and for new text.
 * When the cursor is at a collapsed (no-selection) location that has no explicit
 * size, applies the default size to the cursor only - it does NOT reformat
 * existing/selected text, so pasted content keeps its own sizes.
 * @param {Object} editor - Quill instance
 * @param {Object} Quill - Quill constructor (for sources)
 * @param {string} defaultSize - e.g. '14px'
 */
export function enforceDefaultSize(editor, Quill, defaultSize) {
  if (!defaultSize) return;

  const applyDefault = (range) => {
    if (!range || range.length !== 0) return; // only a collapsed cursor
    const formats = editor.getFormat(range);
    if (formats.size === undefined) {
      // API source so the toolbar picker updates to show the default selected
      editor.format('size', defaultSize, Quill.sources.API);
    }
  };

  editor.on('selection-change', (range) => applyDefault(range));
  // Apply for the initial cursor position (no-op until the editor is focused)
  applyDefault(editor.getSelection());
}

export function initializeQuill(Quill, QuillTableBetter, selector = '#editor') {
  // Register modules
  registerQuillModules(Quill, QuillTableBetter);
  
  // Create clipboard matchers
  const clipboardMatchers = createClipboardMatchers(Quill);
  
  // Initialize Quill
  const editor = new Quill(selector, {
    theme: 'snow',
    placeholder: 'Start writing your story...',
    modules: {
      toolbar: TOOLBAR_OPTIONS,
      table: false,
      'table-better': {
        language: 'en_US',
        menus: ['column', 'row', 'merge', 'table', 'cell', 'wrap', 'copy', 'delete'],
        toolbarTable: true
      },
      keyboard: {
        bindings: QuillTableBetter.keyboardBindings
      },
      clipboard: {
        matchers: clipboardMatchers
      },
      history: {
        delay: 1000,
        maxStack: 100,
        userOnly: true
      }
    }
  });

  // Make the default size the active selection in the dropdown / for new text
  enforceDefaultSize(editor, Quill, DEFAULT_SIZE);

  return editor;
}

