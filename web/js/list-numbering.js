/**
 * Ordered List Numbering
 * ======================
 * Keeps numbered (ordered) lists continuous when they are interrupted by a
 * table.
 *
 * Why this is needed
 * ------------------
 * Quill renders ordered-list numbers with CSS counters. The counter `list-0`
 * is reset to 0 by the rule `.ql-editor p, h1..h6 { counter-set: list-0 ... }`.
 * When a table is inserted in the middle of a numbered list, Quill splits the
 * list into two separate `<ol>` elements, and the paragraphs inside the table
 * cells (`<p class="ql-table-block">`) trip that reset rule. The result is that
 * the list after the table restarts at 1 instead of continuing.
 *
 * The fix
 * -------
 * Walk the top-level blocks of the editor. Whenever an `<ol>` is separated from
 * a previous `<ol>` only by table(s), seed its `counter-reset` with the number
 * of ordered items seen so far so the numbering continues (3 -> 4, 5, ...).
 * Any other block (paragraph, heading, bullet list, ...) between two ordered
 * lists is treated as a genuine break and the numbering restarts naturally.
 */

/**
 * True when a top-level block is a table (or its alignment wrapper) and should
 * be treated as "transparent" - i.e. it does not break an ordered-list chain.
 * @param {Element} el
 * @returns {boolean}
 */
function isTableBlock(el) {
  if (el.tagName === 'TABLE') return true;
  const cl = el.classList;
  return !!cl && (cl.contains('ql-table-better') || cl.contains('ql-table-wrapper'));
}

/**
 * Apply continuous numbering to ordered lists that are split by tables.
 * Safe to call repeatedly - it is idempotent and recomputes from scratch.
 * @param {Element} root - The element whose direct children are the document
 *   blocks (the Quill `.ql-editor` root, or a preview container).
 */
export function applyOrderedListContinuation(root) {
  if (!root || !root.children) return;

  // Running count of top-level (non-indented) ordered items in the current
  // chain, and whether the previous relevant block kept a chain alive.
  let runningTop = 0;
  let chainActive = false;

  for (const el of Array.from(root.children)) {
    if (el.tagName === 'OL') {
      if (chainActive) {
        // Continue numbering from where the previous ordered list left off.
        el.style.counterReset = 'list-0 ' + runningTop;
      } else {
        // Fresh list - let Quill's default counters start it at 1.
        el.style.removeProperty('counter-reset');
        runningTop = 0;
      }

      // Count this list's top-level ordered items so a following list (after a
      // table) can keep counting. Nested items use their own counters.
      el.querySelectorAll(':scope > li[data-list="ordered"]').forEach((li) => {
        const indented = Array.from(li.classList).some((c) => /^ql-indent-/.test(c));
        if (!indented) runningTop++;
      });

      chainActive = true;
    } else if (isTableBlock(el)) {
      // Transparent: a table between two ordered lists keeps the chain alive.
    } else {
      // Any other block breaks the chain - the next list restarts at 1.
      chainActive = false;
      runningTop = 0;
    }
  }
}
