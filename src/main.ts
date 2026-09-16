// ─────────────────────────────────────────────────────────────────────────
// BOOTSTRAP — wire the DOM up to a View and a Presenter. See model.ts,
// view.ts, presenter.ts for the actual Model-View-Presenter split.
// ─────────────────────────────────────────────────────────────────────────

import { Presenter } from "./presenter";
import { CanvasView } from "./view";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const colorInput = document.getElementById("color") as HTMLInputElement;
const modeRadios = document.querySelectorAll<HTMLInputElement>('input[name="mode"]');

const view = new CanvasView(canvas, modeRadios, colorInput);
new Presenter(view);
