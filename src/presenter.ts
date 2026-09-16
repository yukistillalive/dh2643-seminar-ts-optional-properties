// ─────────────────────────────────────────────────────────────────────────
// PRESENTER
//
// Owns interaction state (are we dragging? which mode? what points has the
// brush collected?) and decides, on release, which ShapeInput to build —
// then hands it to the view to draw and log. No DOM APIs are touched
// directly here; everything goes through the CanvasView's callback API.
// ─────────────────────────────────────────────────────────────────────────

import { isDrag, makeClickRect, makeDragRect, makeStroke, withColor, type Point } from "@/model";
import type { CanvasView, Mode } from "@/view";

export class Presenter {
  private mode: Mode = "rect";
  private dragging = false;
  private start: Point = { x: 0, y: 0 };
  private brushPoints: Point[] = [];

  // "Was the color picker touched?" — presence of `color` in the built
  // ShapeInput should reflect a real user choice, not just the picker's
  // default value. `undefined` means "never touched".
  private color: string | undefined;

  constructor(private readonly view: CanvasView) {
    view.onModeChange((mode) => (this.mode = mode));
    view.onColorTouched((color) => (this.color = color));
    view.onPress((p) => this.handlePress(p));
    view.onMove((p) => this.handleMove(p));
    view.onRelease((p) => this.handleRelease(p));
  }

  private handlePress(p: Point): void {
    this.dragging = true;
    this.start = p;
    this.brushPoints = [p];
  }

  private handleMove(p: Point): void {
    if (!this.dragging) return;
    if (this.mode === "brush") this.brushPoints.push(p);
  }

  private handleRelease(end: Point): void {
    if (!this.dragging) return;
    this.dragging = false;

    const shape =
      this.mode === "brush"
        ? makeStroke(this.brushPoints)
        : isDrag(this.start, end)
          ? makeDragRect(this.start, end)
          : makeClickRect(this.start);

    const input = withColor(shape, this.color);
    this.view.draw(input);
    this.view.logShape(input);
  }
}
