/** A key pressed while typing (in a text box, a text area such as "Report a problem", a menu or anything editable):
 *  the window's one-key shortcuts leave it alone. */
export function typing(e: KeyboardEvent): boolean {
  const t = e.target as Element | null;
  return !!t?.closest?.("input, textarea, select, [contenteditable]:not([contenteditable=false])");
}
