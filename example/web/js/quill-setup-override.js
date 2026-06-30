/**
 * Custom Quill Setup Override
 * ============================
 * 
 * This file extends the package's quill-setup.js to use custom configurations.
 * It imports the package setup functions and re-exports them with custom config.
 * 
 * Last updated: 2025-12-17
 */

// No need to import createClipboardMatchers - we create our own with custom font mapping

// Import custom configuration
import { FONT_WHITELIST, TOOLBAR_OPTIONS } from './config-override.js';
import { SIZE_WHITELIST, WEIGHT_WHITELIST, LINE_HEIGHT_WHITELIST, DEFAULT_SIZE } from '/assets/packages/quill_web_editor/web/js/config.js';
import { enforceDefaultSize } from '/assets/packages/quill_web_editor/web/js/quill-setup.js';

// Import custom utils (with Mulish font mapping)
import { mapFontFamily, rgbToHex, mapFontSize, mapFontWeight } from './utils-override.js';

/**
 * Register custom formats and modules with Quill (with custom font whitelist)
 */
export function registerQuillModules(Quill, QuillTableBetter) {
  // Register Table Better module
  Quill.register({
    'modules/table-better': QuillTableBetter
  }, true);

  // Register custom fonts with Mulish added
  const Font = Quill.import('formats/font');
  Font.whitelist = FONT_WHITELIST;
  Quill.register(Font, true);

  // Register px-based font sizes using the inline-style size attributor
  // so the dropdown shows real values (12px, 14px, ...) instead of keywords.
  const SizeStyle = Quill.import('attributors/style/size');
  SizeStyle.whitelist = SIZE_WHITELIST;
  Quill.register(SizeStyle, true);

  // Register the custom "weight" format (Normal / Semi Bold / Bold) backed by
  // inline font-weight. Independent of the bold button.
  const Parchment = Quill.import('parchment');
  const WeightStyle = new Parchment.StyleAttributor('weight', 'font-weight', {
    scope: Parchment.Scope.INLINE,
    whitelist: WEIGHT_WHITELIST.filter((w) => typeof w === 'string'),
  });
  Quill.register({ 'formats/weight': WeightStyle }, true);

  // Register the custom "lineheight" format (block-level line-height) used by
  // the line-height dropdown.
  const LineHeightStyle = new Parchment.StyleAttributor('lineheight', 'line-height', {
    scope: Parchment.Scope.BLOCK,
    whitelist: LINE_HEIGHT_WHITELIST.filter((h) => typeof h === 'string'),
  });
  Quill.register({ 'formats/lineheight': LineHeightStyle }, true);
}

/**
 * Create clipboard matchers with custom font mapping
 */
function createClipboardMatchers(Quill) {
  const Delta = Quill.import('delta');
  
  // Import createCellMatcher helper from package
  // We'll create our own version that uses our custom mapFontFamily
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
      
      // Check for ql-size-* classes (legacy keyword sizes) - map to px
      const sizeMatch = className.match(/ql-size-(\S+)/);
      if (sizeMatch) {
        const mappedSize = mapFontSize(sizeMatch[1]);
        if (mappedSize) formats.size = mappedSize;
      }
      
      // Parse inline font-family (using our custom mapFontFamily)
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
  
  return [
    // Match any element with inline styles
    [Node.ELEMENT_NODE, function(node, delta) {
      const style = node.style;
      const formats = {};
      
      // Parse font-family (using our custom mapFontFamily)
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
      
      // Handle face attribute (font family) - using our custom mapFontFamily
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
    ['TH', createCellMatcher(Quill)]
  ];
}

/**
 * Initialize Quill editor with custom toolbar options
 */
export function initializeQuill(Quill, QuillTableBetter, selector = '#editor') {
  // Register modules with custom config
  registerQuillModules(Quill, QuillTableBetter);
  
  // Create clipboard matchers with custom font mapping
  const clipboardMatchers = createClipboardMatchers(Quill);
  
  // Initialize Quill with custom toolbar options
  const editor = new Quill(selector, {
    theme: 'snow',
    placeholder: 'Start writing your story...',
    modules: {
      toolbar: TOOLBAR_OPTIONS,  // Use custom toolbar with Mulish font
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

