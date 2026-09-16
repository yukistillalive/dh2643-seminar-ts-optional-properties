// ─────────────────────────────────────────────────────────────────────────
// MODEL
//
// The data shape and the pure rules for turning raw interaction points into
// a ShapeInput. No DOM, no canvas, nothing about rendering lives here.
//
// The whole point: ONE interface describes everything the user can draw,
// but which fields are actually present depends on HOW they interacted.
// A single click needs no size. A drag needs one. A brush stroke needs a
// path instead of a size. Optional properties (`?`) let one type honestly
// describe several different "shapes" of data.
// ─────────────────────────────────────────────────────────────────────────

export interface Point {
  x: number;
  y: number;
}

export interface ShapeInput {
  x: number; // always present — the initial press point
  y: number; // always present

  width?: number; // present only when a rectangle was DRAGGED to size
  height?: number; // present only when a rectangle was DRAGGED to size

  points?: Point[]; // present only for a brush stroke

  color?: string; // present only if the user touched the color picker
}

export const DEFAULT_SIZE = 60;
export const DRAG_THRESHOLD = 4; // px of movement before a press becomes a drag

export function isDrag(start: Point, end: Point): boolean {
  return Math.abs(end.x - start.x) >= DRAG_THRESHOLD || Math.abs(end.y - start.y) >= DRAG_THRESHOLD;
}

// A CLICK: default-sized rectangle, width/height left absent entirely.
export function makeClickRect(start: Point): ShapeInput {
  return { x: start.x, y: start.y };
}

// A DRAG: width/height are set from how far the user dragged.
export function makeDragRect(start: Point, end: Point): ShapeInput {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };
}

// A BRUSH STROKE: x/y are the FIRST point, points carries the whole path.
// No width/height ever appear here — they simply don't apply.
export function makeStroke(points: Point[]): ShapeInput {
  return { x: points[0].x, y: points[0].y, points };
}

// Only attach `color` if the user actually touched the picker — otherwise
// leave the property absent entirely, rather than always sending a value.
export function withColor(input: ShapeInput, color: string | undefined): ShapeInput {
  return color === undefined ? input : { ...input, color };
}

// ─────────────────────────────────────────────────────────────────────────
// BONUS / "what comes next": optional properties don't stop nonsense.
//
// Because width, height, and points are ALL optional, TypeScript happily
// accepts an object that is simultaneously "a sized rectangle" AND
// "a brush stroke" — which makes no sense as a drawing instruction:
//
//   const nonsense: ShapeInput = {
//     x: 10, y: 10,
//     width: 50, height: 50,     // looks like a rect...
//     points: [{ x: 10, y: 10 }], // ...but also a stroke?!
//   };
//
// CanvasView.draw() (in view.ts) would silently just treat it as a stroke
// (points is checked first) and ignore width/height — a bug hiding in
// plain sight, and the compiler never complained.
//
// Optional properties are for "this field may or may not be filled in
// on the SAME kind of thing" (a rect that may or may not have a custom
// color). They are the wrong tool when presence means "this is a
// DIFFERENT kind of thing entirely". For that you want a discriminated
// union instead:
//
//   type ShapeInput =
//     | { kind: "rect"; x: number; y: number; width: number; height: number; color?: string }
//     | { kind: "stroke"; x: number; y: number; points: Point[]; color?: string };
//
// With a `kind` tag, TypeScript would narrow the type for you inside an
// `if (input.kind === "rect")` check and make the nonsense object above
// impossible to construct. We don't refactor to that here — just naming
// it as the natural next step once optional properties stop being enough.
// ─────────────────────────────────────────────────────────────────────────
