// ─────────────────────────────────────────────────────────────────────────
// VIEW
//
// Everything that touches the DOM/canvas: rendering a ShapeInput, logging
// it to the console, keeping the canvas sized to its container, and
// turning raw mouse events into canvas-relative points. The view knows
// nothing about drag-vs-click logic or interaction state — it just reports
// points and renders whatever it's told to.
// ─────────────────────────────────────────────────────────────────────────

import { DEFAULT_SIZE, type Point, type ShapeInput } from "./model";

export type Mode = "rect" | "brush";

export class CanvasView {
  private readonly ctx: CanvasRenderingContext2D;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly modeRadios: NodeListOf<HTMLInputElement>,
    private readonly colorInput: HTMLInputElement,
  ) {
    this.ctx = canvas.getContext("2d")!;
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  // Keep the canvas's drawing buffer matched to its displayed (CSS) size,
  // so the canvas stays responsive to the viewport instead of stretching a
  // fixed-resolution image. Resizing clears the canvas — fine for a demo
  // where each interaction is a fresh, independent shape.
  private resize(): void {
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
  }

  // ── outgoing: presenter subscribes to these raw interaction events ──

  onModeChange(handler: (mode: Mode) => void): void {
    for (const radio of this.modeRadios) {
      radio.addEventListener("change", () => {
        if (radio.checked) handler(radio.value as Mode);
      });
    }
  }

  onColorTouched(handler: (color: string) => void): void {
    this.colorInput.addEventListener("input", () => handler(this.colorInput.value));
  }

  onPress(handler: (p: Point) => void): void {
    this.canvas.addEventListener("mousedown", (e) => handler(this.toCanvasPoint(e)));
  }

  // Attached to `window`, not `canvas`: once a drag starts, the mouse can
  // leave the canvas bounds (easy near the edges) before it moves/releases,
  // and the canvas element would never see those events — leaving the
  // presenter's drag state stuck and nothing ever drawn/logged.
  onMove(handler: (p: Point) => void): void {
    window.addEventListener("mousemove", (e) => handler(this.toCanvasPoint(e)));
  }

  onRelease(handler: (p: Point) => void): void {
    window.addEventListener("mouseup", (e) => handler(this.toCanvasPoint(e)));
  }

  private toCanvasPoint(e: MouseEvent): Point {
    const rect = this.canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  // ── incoming: presenter tells the view what to render ──

  draw(input: ShapeInput): void {
    this.ctx.strokeStyle = input.color ?? "#3366ff"; // color is optional too — fall back to a default
    this.ctx.lineWidth = 2;

    if (input.points) {
      // Brush stroke: polyline through every recorded point.
      this.ctx.beginPath();
      this.ctx.moveTo(input.points[0].x, input.points[0].y);
      for (const p of input.points) this.ctx.lineTo(p.x, p.y);
      this.ctx.stroke();
      return;
    }

    // Rectangle path.
    //
    // DEMO TOGGLE: comment out these two "?? DEFAULT_SIZE" fallbacks to show
    // what "possibly undefined" actually means. With them removed:
    //   - a DRAGGED rect still works (width/height were really set)
    //   - a CLICKED rect breaks (width/height were never set -> undefined
    //     -> NaN math -> ctx.strokeRect draws nothing)
    const w = input.width ?? DEFAULT_SIZE;
    const h = input.height ?? DEFAULT_SIZE;

    // If you comment out the line below and instead read `input.width`
    // directly here, TypeScript itself will refuse to compile:
    //   this.ctx.strokeRect(input.x, input.y, input.width, input.height);
    //                                         ~~~~~~~~~~~~ ~~~~~~~~~~~~~
    //   error TS2345: Argument of type 'number | undefined' is not
    //   assignable to parameter of type 'number'.
    // That's the type system catching the exact bug the runtime toggle above
    // demonstrates — "possibly undefined" is not a runtime accident here,
    // it's written into the type.
    this.ctx.strokeRect(input.x, input.y, w, h);
  }

  // Logs the exact shape of the object each interaction produced — this is
  // the point of the whole demo, made visible in the console instead of on
  // the page: open devtools and watch which fields show up per interaction.
  logShape(input: ShapeInput): void {
    console.log(JSON.stringify(input, null, 2));
  }
}
