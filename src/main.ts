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

class LinePreviewCommand {
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

class StickerCommand {
  points: { x: number; y: number }[];
  sticker: string;
  constructor(x: number, y: number, sticker: string) {
    this.points = [{ x, y }];
    this.sticker = sticker;
  }
  display(context: CanvasRenderingContext2D) {
    const offset = 1;
    const { x, y } = this.points[this.points.length - offset];
    context.fillText(this.sticker, x, y);
  }
  drag(x: number, y: number) {
    this.points.push({ x, y });
  }
}

class StickerPreviewCommand {
  x: number;
  y: number;
  sticker: string;
  constructor(x: number, y: number, sticker: string) {
    this.x = x;
    this.y = y;
    this.sticker = sticker;
  }
  display(context: CanvasRenderingContext2D) {
    const magnitude = 8;
    const xOffset = 4;
    const yOffset = 2;
    context.fillText(
      this.sticker,
      this.x - magnitude / xOffset,
      this.y + magnitude / yOffset
    );
  }
}

const start = 0;

const thin = 2;
const thick = 5;

const ctx = canvas.getContext("2d")!;

const thinMarker = new Marker(ctx, thin);
const thickMarker = new Marker(ctx, thick);

let currentMarker: Marker | null = thinMarker;
let currentTool: Sticker | null = null;

const commands: (LineCommand | StickerCommand)[] = [];
const redoCommands: (LineCommand | StickerCommand)[] = [];

const toolButtons: Sticker[] = [
  {
    name: "🐱",
    button: document.createElement("button"),
  },
  {
    name: "🐾",
    button: document.createElement("button"),
  },
  {
    name: "🐈‍",
    button: document.createElement("button"),
  },
];

interface Sticker {
  name: string;
  button: HTMLButtonElement;
}

let cursorCommand: LinePreviewCommand | StickerPreviewCommand | null = null;

const bus = new EventTarget();

function notify(name: string) {
  bus.dispatchEvent(new Event(name));
}

bus.addEventListener("drawing-changed", redraw);
bus.addEventListener("tool-moved", redraw);
bus.addEventListener("tool-changed", changeTool);

let currentLineCommand: LineCommand | StickerCommand | null = null;

canvas.addEventListener("mouseout", () => {
  cursorCommand = null;
  notify("tool-moved");
});

canvas.addEventListener("mouseenter", (e) => {
  if (currentMarker) {
    cursorCommand = new LinePreviewCommand(
      e.offsetX,
      e.offsetY,
      currentMarker.lineWidth
    );
    notify("tool-moved");
  }
});

canvas.addEventListener("mousemove", (e) => {
  const leftButton = 1;
  if (currentMarker) {
    cursorCommand = new LinePreviewCommand(
      e.offsetX,
      e.offsetY,
      currentMarker.lineWidth
    );
  } else if (currentTool) {
    cursorCommand = new StickerPreviewCommand(
      e.offsetX,
      e.offsetY,
      currentTool.name
    );
  }
  notify("tool-moved");

  if (e.buttons == leftButton) {
    cursorCommand = null;
    if (currentMarker) {
      currentLineCommand!.points.push({ x: e.offsetX, y: e.offsetY });
    } else if (currentTool) {
      currentLineCommand!.points.push({ x: e.offsetX, y: e.offsetY });
    }
    notify("drawing-changed");
  }
});

canvas.addEventListener("mousedown", (e) => {
  cursorCommand = null;
  if (currentMarker) {
    currentLineCommand = new LineCommand(
      e.offsetX,
      e.offsetY,
      currentMarker.lineWidth
    );
    commands.push(currentLineCommand);
  }
  if (currentTool) {
    currentLineCommand = new StickerCommand(
      e.offsetX,
      e.offsetY,
      currentTool.name
    );
    commands.push(currentLineCommand);
  }
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
  currentTool = null;
  notify("tool-changed");
  thickButton?.classList.add("selectedTool");
  thinButton?.classList.remove("selectedTool");
});

const thinButton = document.createElement("button");
thinButton.innerHTML = "thin";
app.append(thinButton);

thinButton.addEventListener("click", () => {
  currentMarker = thinMarker;
  currentTool = null;
  notify("tool-changed");
  thinButton?.classList.add("selectedTool");
  thickButton?.classList.remove("selectedTool");
});

function redraw() {
  ctx.clearRect(start, start, canvas.width, canvas.height);

  commands.forEach((cmd) => cmd.display(ctx));

  if (cursorCommand) {
    cursorCommand.display(ctx);
  }
}

function changeTool() {
  toolButtons.forEach(function (tool) {
    tool.button?.classList.remove("selectedTool");
  });
  currentTool?.button.classList.add("selectedTool");
  thickButton?.classList.remove("selectedTool");
  thinButton?.classList.remove("selectedTool");
}

toolButtons.forEach(function (tool) {
  tool.button.innerHTML = tool.name;
  app.append(tool.button);

  tool.button.addEventListener("click", () => {
    currentTool = tool;
    currentMarker = null;
    notify("tool-changed");
  });
});

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
