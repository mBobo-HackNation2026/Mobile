/** Wylicza postęp scrolla 0–1 z eventów ScrollView. */
export function computeScrollProgress(params: {
  offsetY: number;
  contentHeight: number;
  viewportHeight: number;
}): number {
  const { offsetY, contentHeight, viewportHeight } = params;
  const travel = contentHeight - viewportHeight;
  if (travel <= 1) return 0;
  return Math.min(1, Math.max(0, offsetY / travel));
}
