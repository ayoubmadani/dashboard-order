const EDGE_THRESHOLD = 60;
const SCROLL_SPEED = 14;

// Auto-scrolls `scrollContainer` while a drag/resize gesture's pointer stays
// near its top/bottom edge, so dragging past the visible viewport keeps
// working instead of getting stuck against an edge with no visual feedback.
// Call `updateY(clientY)` on every pointermove to keep the tracked position
// current between animation frames, and `stop()` on pointerup.
export function startEdgeAutoScroll(scrollContainer) {
  if (!scrollContainer) return { updateY: () => {}, stop: () => {} };

  let clientY = null;
  let frame = null;

  const tick = () => {
    if (clientY != null) {
      const rect = scrollContainer.getBoundingClientRect();
      if (clientY > rect.bottom - EDGE_THRESHOLD) {
        scrollContainer.scrollTop += SCROLL_SPEED;
      } else if (clientY < rect.top + EDGE_THRESHOLD) {
        scrollContainer.scrollTop -= SCROLL_SPEED;
      }
    }
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);

  return {
    updateY: (y) => {
      clientY = y;
    },
    stop: () => {
      if (frame) cancelAnimationFrame(frame);
    },
  };
}
