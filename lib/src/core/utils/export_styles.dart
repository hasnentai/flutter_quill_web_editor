import 'font_registry.dart';

/// CSS styles for HTML export.
///
/// These styles are embedded in exported HTML documents to ensure
/// consistent rendering outside the editor.
abstract class ExportStyles {
  /// Complete CSS for standalone HTML export.
  ///
  /// Includes font classes from both package defaults and any custom
  /// fonts registered via [FontRegistry].
  static String get fullCss => '''
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Roboto', sans-serif;
  font-size: 14px;
  line-height: 1.8;
  color: #2c2825;
  background: #ffffff;
  padding: 0;
  margin: 0;
}

.ql-editor { 
  padding: 24px;
  max-width: 100%;
}

/* Typography */
.ql-editor h1 { font-size: 2.25rem; font-weight: 600; margin-bottom: 0.5em; }
.ql-editor h2 { font-size: 1.75rem; font-weight: 600; margin-bottom: 0.5em; }
.ql-editor h3 { font-size: 1.375rem; font-weight: 600; margin-bottom: 0.5em; }
.ql-editor h4 { font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5em; }
.ql-editor h5 { font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5em; }
.ql-editor h6 { font-size: 0.75rem; font-weight: 600; margin-bottom: 0.5em; }
.ql-editor p { margin-bottom: 1em; }
.ql-editor blockquote { border-left: 4px solid #c45d35; padding-left: 16px; margin: 24px 0; color: #6b6560; font-style: italic; }
.ql-editor pre { background: #f8f6f3; border-radius: 8px; padding: 16px; font-family: 'Roboto', monospace; font-size: 0.875rem; overflow-x: auto; }
.ql-editor a { color: #c45d35; text-decoration: underline; }
.ql-editor code { background: #f0f0f0; padding: 2px 4px; border-radius: 3px; font-family: 'Roboto', monospace; }

/* Custom @font-face declarations for self-hosted fonts */
${FontRegistry.instance.generateFontFaceCSS()}

/* Font family classes */
${FontRegistry.instance.generateFontClasses()}

/* Font size classes */
.ql-size-small { font-size: 0.75em; }
.ql-size-large { font-size: 1.5em; }
.ql-size-huge { font-size: 2.5em; }

/* Line height classes */
.ql-line-height-1 { line-height: 1; }
.ql-line-height-1-5 { line-height: 1.5; }
.ql-line-height-2 { line-height: 2; }
.ql-line-height-2-5 { line-height: 2.5; }
.ql-line-height-3 { line-height: 3; }

/* Text indent classes */
.ql-indent-1 { padding-left: 3em; }
.ql-indent-2 { padding-left: 6em; }
.ql-indent-3 { padding-left: 9em; }
.ql-indent-4 { padding-left: 12em; }
.ql-indent-5 { padding-left: 15em; }
.ql-indent-6 { padding-left: 18em; }
.ql-indent-7 { padding-left: 21em; }
.ql-indent-8 { padding-left: 24em; }

/* Table styles */
.ql-editor table { border-collapse: collapse; margin: 16px 0; box-sizing: border-box; }
.ql-editor table td, .ql-editor table th { 
  border: 1px solid #e5e0da; 
  min-width: 50px;
  vertical-align: top;
}
.ql-editor table td:not([style*="padding"]), .ql-editor table th:not([style*="padding"]) { 
  padding: 8px 16px; 
}
.ql-editor table.table-with-header tr:first-child td:not([style*="background"]),
.ql-editor table th:not([style*="background"]) { background: #f8f6f3; font-weight: 500; }
.ql-editor table td p { margin: 0; }
.ql-editor table colgroup, .ql-editor table col { display: table-column; }

/* Table alignment */
.ql-editor table.align-left { float: left; margin-right: 16px; margin-bottom: 8px; }
.ql-editor table.align-center { display: table; margin-left: auto; margin-right: auto; }
.ql-editor table.align-right { float: right; margin-left: 16px; margin-bottom: 8px; }

/* List styles */
.ql-editor ul, .ql-editor ol { padding-left: 24px; margin-bottom: 1em; }
.ql-editor li { margin-bottom: 0.5em; }
.ql-editor ul[data-checked="true"] > li::before { content: '☑'; margin-right: 8px; color: #c45d35; }
.ql-editor ul[data-checked="false"] > li::before { content: '☐'; margin-right: 8px; color: #c45d35; }

/* Media styles - inline width/height styles have highest specificity and will be preserved */
.ql-editor img { 
  max-width: 100%; 
  border-radius: 8px; 
  /* Note: Inline styles (style="width: 500px; height: 300px;") override CSS defaults */
}
.ql-editor iframe, .ql-editor video, .ql-editor .ql-video { 
  max-width: 100%; 
  display: block; 
  margin: 16px 0;
  border-radius: 8px;
}

/* Media alignment - must use !important to override inline styles */
.ql-editor img.align-left, 
.ql-editor iframe.align-left, 
.ql-editor video.align-left {
  float: left !important;
  margin-right: 16px !important;
  margin-left: 0 !important;
  margin-bottom: 8px;
  display: inline !important;
}
.ql-editor img.align-center, 
.ql-editor iframe.align-center, 
.ql-editor video.align-center {
  display: block !important;
  margin-left: auto !important;
  margin-right: auto !important;
  margin-top: 16px;
  margin-bottom: 16px;
  float: none !important;
}
.ql-editor img.align-right, 
.ql-editor iframe.align-right, 
.ql-editor video.align-right {
  float: right !important;
  margin-left: 16px !important;
  margin-right: 0 !important;
  margin-bottom: 8px;
  display: inline !important;
}

/* Override iframe default width for aligned items */
.ql-editor iframe.align-left,
.ql-editor iframe.align-right {
  width: auto;
  aspect-ratio: auto;
}

/* Print-specific styles to ensure media alignment and sizing is preserved */
@media print {
  /* Ensure inline width/height styles are respected in print */
  .ql-editor img[style*="width"] {
    /* Inline width has highest specificity, but ensure it's not overridden */
    max-width: 100% !important; /* Still respect page width */
  }
  /* Ensure alignment works correctly in print */
  .ql-editor img.align-left,
  .ql-editor iframe.align-left,
  .ql-editor video.align-left {
    float: left !important;
    display: inline !important;
    margin-right: 16px !important;
    margin-left: 0 !important;
  }
  .ql-editor img.align-center,
  .ql-editor iframe.align-center,
  .ql-editor video.align-center {
    display: block !important;
    margin-left: auto !important;
    margin-right: auto !important;
    float: none !important;
  }
  .ql-editor img.align-right,
  .ql-editor iframe.align-right,
  .ql-editor video.align-right {
    float: right !important;
    display: inline !important;
    margin-left: 16px !important;
    margin-right: 0 !important;
  }
  /* Ensure page breaks don't break alignment */
  .ql-editor img.align-left,
  .ql-editor img.align-right {
    page-break-inside: avoid;
  }
}

/* Text formatting */
sub { vertical-align: sub; font-size: smaller; }
sup { vertical-align: super; font-size: smaller; }
.ql-direction-rtl { direction: rtl; text-align: inherit; }

/* Text alignment */
.ql-align-center { text-align: center; }
.ql-align-right { text-align: right; }
.ql-align-justify { text-align: justify; }

/* Clear floats */
.ql-editor::after { content: ""; display: table; clear: both; }
.ql-editor p::after { content: ""; display: table; clear: both; }

/* Hide any remaining editor artifacts */
.ql-table-better-selected-td, .ql-table-better-selection-line, .ql-table-better-selection-block,
.ql-table-better-col-tool, .ql-table-better-row-tool, .ql-table-better-corner,
[class*="ql-table-better-select"], [class*="ql-table-better-tool"], temporary {
  display: none !important;
}
''';

  /// External stylesheets to include in export.
  ///
  /// Includes the Google Fonts URL with any custom fonts registered
  /// via [FontRegistry].
  static List<String> get externalStylesheets =>
      FontRegistry.instance.externalStylesheets;

  /// Generates complete HTML document from content.
  ///
  /// [content] - The HTML content to wrap.
  /// [title] - Optional document title.
  /// [defaultFont] - Optional default font value (e.g., 'mulish', 'roboto').
  ///   If provided, adds the corresponding font class to the editor wrapper.
  static String generateHtmlDocument(
    String content, {
    String? title,
    String? defaultFont,
  }) {
    final stylesheetLinks = externalStylesheets
        .map((url) => '<link href="$url" rel="stylesheet">')
        .join('\n  ');

    // Build the editor class with optional default font
    final editorClass = defaultFont != null && defaultFont.isNotEmpty
        ? 'ql-editor ql-font-$defaultFont'
        : 'ql-editor';

    return '''
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${title != null ? '<title>$title</title>' : ''}
  $stylesheetLinks
  <style>
$fullCss

/* Prevent FOUC - hide content until fonts load */
body {
  opacity: 0;
  transition: opacity 0.15s ease-in;
}
body.fonts-loaded {
  opacity: 1;
}
  </style>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      (document.fonts?.ready || Promise.resolve()).then(function() {
        document.body.classList.add('fonts-loaded');
      });
    });
  </script>
</head>
<body>
  <div class="$editorClass">$content</div>
</body>
</html>
''';
  }
}
