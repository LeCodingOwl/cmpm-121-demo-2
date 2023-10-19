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
canvas.style.cursor = "none";
app.append(canvas);

class Marker {
  lineWidth: number;
  context: CanvasRenderingContext2D;
  constructor(context: CanvasRenderingContext2D, lineWidth: number) {
    this.context = context;
    this.context.strokeStyle = "black";
    this.lineWidth = lineWidth;
  }
}

class LineCommand {
  points: { x: number; y: number }[];
  thickness: number;
  constructor(x: number, y: number, thickness: number) {
    this.points = [{ x, y }];
    this.thickness = thickness;
  }
  display(context: CanvasRenderingContext2D) {
    context.lineWidth = this.thickness;
    context.beginPath();
    const { x, y } = this.points[start];
    context.moveTo(x, y);

    for (const { x, y } of this.points) {
      context.lineTo(x, y);
    }
    context.stroke();
  }
  drag(x: number, y: number) {
    this.points.push({ x, y });
  }
}

class CursorCommand {
  x: number;
  y: number;
  thickness: number;
  constructor(x: number, y: number, thickness: number) {
    this.x = x;
    this.y = y;
    this.thickness = thickness;
  }

  display(context: CanvasRenderingContext2D) {
    const magnitude = 8;
    const xOffset = 4;
    const yOffset = 2;
    context.font = "${this.thickness * magnitude}px monospace";
    context.fillText(
      "*",
      this.x - (this.thickness * magnitude) / xOffset,
      this.y + (this.thickness * magnitude) / yOffset
    );
  }
}

const start = 0;

const thin = 2;
const thick = 5;

const ctx = canvas.getContext("2d")!;

const thinMarker = new Marker(ctx, thin);
const thickMarker = new Marker(ctx, thick);
let currentMarker = thinMarker;

const commands: LineCommand[] = [];
const redoCommands: LineCommand[] = [];
const bus = new EventTarget();

let cursorCommand: CursorCommand | null = null;

function notify(name: string) {
  bus.dispatchEvent(new Event(name));
}

bus.addEventListener("drawing-changed", redraw);
bus.addEventListener("tool-moved", redraw);

let currentLineCommand: LineCommand | null = null;

canvas.addEventListener("mouseout", () => {
  cursorCommand = null;
  notify("tool-moved");
});

canvas.addEventListener("mouseenter", (e) => {
  cursorCommand = new CursorCommand(
    e.offsetX,
    e.offsetY,
    currentMarker.lineWidth
  );
  notify("tool-moved");
});

canvas.addEventListener("mousemove", (e) => {
  const leftButton = 1;
  cursorCommand = new CursorCommand(
    e.offsetX,
    e.offsetY,
    currentMarker.lineWidth
  );
  notify("tool-moved");
  if (e.buttons == leftButton) {
    cursorCommand = null;
    currentLineCommand!.points.push({ x: e.offsetX, y: e.offsetY });
    notify("drawing-changed");
  }
});

canvas.addEventListener("mousedown", (e) => {
  cursorCommand = null;
  currentLineCommand = new LineCommand(
    e.offsetX,
    e.offsetY,
    currentMarker.lineWidth
  );
  commands.push(currentLineCommand);
  redoCommands.splice(start, redoCommands.length);
  notify("drawing-changedd");
});

canvas.addEventListener("mouseup", () => {
  currentLineCommand = null;
  notify("drawing-changed");
});

app.append(document.createElement("br"));
const thickButton = document.createElement("button");
thickButton.innerHTML = "thick";
app.append(thickButton);

thickButton.addEventListener("click", () => {
  currentMarker = thickMarker;
  thickButton?.classList.add("selectedTool");
  thinButton?.classList.remove("selectedTool");
});

const thinButton = document.createElement("button");
thinButton.innerHTML = "thin";
app.append(thinButton);

thinButton.addEventListener("click", () => {
  currentMarker = thinMarker;
  thinButton?.classList.add("selectedTool");
  thickButton?.classList.remove("selectedTool");
});

function redraw() {
  ctx.clearRect(start, start, canvas.width, canvas.height);

  commands.forEach((cmd) => cmd.display(currentMarker.context));

  if (cursorCommand) {
    cursorCommand.display(currentMarker.context);
  }
}

app.append(document.createElement("br"));

const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
app.append(clearButton);

clearButton.addEventListener("click", () => {
  commands.splice(start, commands.length);
  notify("drawing-changed");
});

const undoButton = document.createElement("button");
undoButton.innerHTML = "undo";
app.append(undoButton);

undoButton.addEventListener("click", () => {
  if (commands.length) {
    redoCommands.push(commands.pop()!);
    notify("drawing-changed");
  }
});

const redoButton = document.createElement("button");
redoButton.innerHTML = "redo";
app.append(redoButton);

redoButton.addEventListener("click", () => {
  if (redoCommands.length) {
    commands.push(redoCommands.pop()!);
    notify("drawing-changed");
  }
});
