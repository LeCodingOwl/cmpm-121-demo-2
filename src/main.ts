import "./style.css";

const app: HTMLDivElement = document.querySelector("#app")!;

const gameName = "Sketchy App";

document.title = gameName;

const header = document.createElement("h1");
header.innerHTML = gameName;
app.append(header);

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
app.append(canvas);

const ctx = canvas.getContext("2d")!;

const lines: { x: number; y: number }[][] = [];
const redoLines: { x: number; y: number }[][] = [];
let currentLine: { x: number; y: number }[] | null = null;

const drawingChanged = new Event("drawing-changed", {});

const start = 0;
const offset = 1;

const cursor = { active: false, x: 0, y: 0 };

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  currentLine = [];
  lines.push(currentLine);
  redoLines.splice(start, redoLines.length);
  currentLine.push({ x: cursor.x, y: cursor.y });

  canvas.dispatchEvent(drawingChanged);
});

canvas.addEventListener("mousemove", (e) => {
  if (cursor.active) {
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    currentLine!.push({ x: cursor.x, y: cursor.y });
    canvas.dispatchEvent(drawingChanged);
  }
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;

  currentLine = null;
  canvas.dispatchEvent(drawingChanged);
});

canvas.addEventListener("drawing-changed", () => {
  redraw();
});

function redraw() {
  ctx.clearRect(start, start, canvas.width, canvas.height);

  for (const line of lines) {
    if (line.length > offset) {
      ctx.beginPath();
      const { x, y } = line[start];
      ctx.moveTo(x, y);

      for (const { x, y } of line) {
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
}

app.append(document.createElement("br"));

const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
app.append(clearButton);

clearButton.addEventListener("click", () => {
  lines.splice(0, lines.length);
  canvas.dispatchEvent(drawingChanged);
});

const undoButton = document.createElement("button");
undoButton.innerHTML = "undo";
app.append(undoButton);

undoButton.addEventListener("click", () => {
  if (lines.length > 0) {
    redoLines.push(lines.pop()!);
    canvas.dispatchEvent(drawingChanged);
  }
});

const redoButton = document.createElement("button");
redoButton.innerHTML = "redo";
app.append(redoButton);

redoButton.addEventListener("click", () => {
  if (redoLines.length > 0) {
    lines.push(redoLines.pop()!);
    canvas.dispatchEvent(drawingChanged);
  }
});
