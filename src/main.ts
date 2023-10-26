import "./style.css";

// setting app elements
const app: HTMLDivElement = document.querySelector("#app")!;

const gameName = "Sketchy App";

document.title = gameName;

const header = document.createElement("h1");
header.innerHTML = gameName;
app.append(header);

// create the canvas
const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.style.cursor = "none";
app.append(canvas);

// create the classes
class Tool {
  context: CanvasRenderingContext2D;
  button: HTMLButtonElement;
  constructor(context: CanvasRenderingContext2D) {
    this.context = context;
    this.button = document.createElement("button");
  }
}

class Sticker extends Tool {
  size: number;
  name: string;
  constructor(context: CanvasRenderingContext2D, size: number, name: string) {
    super(context);
    this.size = size;
    this.name = name;
  }
}

class Marker extends Tool {
  lineWidth: number;
  constructor(context: CanvasRenderingContext2D, lineWidth: number) {
    super(context);
    this.lineWidth = lineWidth;
    this.context.strokeStyle = "black";
  }
}

class LineCommand {
  points: { x: number; y: number }[];
  marker: Marker;
  constructor(x: number, y: number, marker: Marker) {
    this.points = [{ x, y }];
    this.marker = marker;
  }
  display(context: CanvasRenderingContext2D) {
    context.lineWidth = this.marker.lineWidth;
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
  marker: Marker;
  constructor(x: number, y: number, marker: Marker) {
    this.x = x;
    this.y = y;
    this.marker = marker;
  }

  display(context: CanvasRenderingContext2D) {
    const magnitude = 8;
    const xOffset = 4;
    const yOffset = 2;
    context.font = `${this.marker.lineWidth * magnitude}px monospace`;
    context.fillText(
      "*",
      this.x - (this.marker.lineWidth * magnitude) / xOffset,
      this.y + (this.marker.lineWidth * magnitude) / yOffset
    );
  }
}

class StickerCommand {
  points: { x: number; y: number }[];
  sticker: Sticker;
  constructor(x: number, y: number, sticker: Sticker) {
    this.points = [{ x, y }];
    this.sticker = sticker;
  }
  display(context: CanvasRenderingContext2D) {
    const offset = 1;
    const magnitude = 8;
    const { x, y } = this.points[this.points.length - offset];
    context.font = `${this.sticker.size * magnitude}px monospace`;
    context.fillText(this.sticker.name, x, y);
  }
  drag(x: number, y: number) {
    this.points.push({ x, y });
  }
}

class StickerPreviewCommand {
  x: number;
  y: number;
  sticker: Sticker;
  constructor(x: number, y: number, sticker: Sticker) {
    this.x = x;
    this.y = y;
    this.sticker = sticker;
  }
  display(context: CanvasRenderingContext2D) {
    const magnitude = 8;
    const xOffset = 4;
    const yOffset = 2;
    context.font = `${this.sticker.size * magnitude}px monospace`;
    context.fillText(
      this.sticker.name,
      this.x - magnitude / xOffset,
      this.y + magnitude / yOffset
    );
  }
}

const start = 0;
const stickerSize = 4;
const thin = 2;
const thick = 4;

// Get canvas context
const ctx = canvas.getContext("2d")!;

const thinMarker = new Marker(ctx, thin);
const thickMarker = new Marker(ctx, thick);

let currentMarker: Marker | null = thinMarker;
let currentSticker: Sticker | null = null;

const commands: (LineCommand | StickerCommand)[] = [];
const redoCommands: (LineCommand | StickerCommand)[] = [];

// Sticker buttons & create sticker buttons
const stickerButtons: Sticker[] = [
  new Sticker(ctx, stickerSize, "🐱"),
  new Sticker(ctx, stickerSize, "🐾"),
  new Sticker(ctx, stickerSize, "🐈"),
];

// This stores the cursor command
let cursorCommand: LinePreviewCommand | StickerPreviewCommand | null = null;

const bus = new EventTarget();

function notify(name: string) {
  bus.dispatchEvent(new Event(name));
}

canvas.addEventListener("mouseout", () => {
  cursorCommand = null;
  notify("tool-moved");
});

canvas.addEventListener("mouseenter", (e) => {
  if (currentMarker) {
    cursorCommand = new LinePreviewCommand(e.offsetX, e.offsetY, currentMarker);
    notify("tool-moved");
  } else if (currentSticker) {
    cursorCommand = new StickerPreviewCommand(
      e.offsetX,
      e.offsetY,
      currentSticker
    );
    notify("tool-moved");
  }
});

canvas.addEventListener("mousemove", (e) => {
  const leftButton = 1;
  if (currentMarker) {
    cursorCommand = new LinePreviewCommand(e.offsetX, e.offsetY, currentMarker);
  } else if (currentSticker) {
    cursorCommand = new StickerPreviewCommand(
      e.offsetX,
      e.offsetY,
      currentSticker
    );
  }
  notify("tool-moved");

  if (e.buttons == leftButton) {
    cursorCommand = null;
    if (currentMarker) {
      currentLineCommand!.points.push({ x: e.offsetX, y: e.offsetY });
    } else if (currentSticker) {
      currentLineCommand!.points.push({ x: e.offsetX, y: e.offsetY });
    }
    notify("drawing-changed");
  }
});

canvas.addEventListener("mousedown", (e) => {
  cursorCommand = null;
  if (currentMarker) {
    currentLineCommand = new LineCommand(e.offsetX, e.offsetY, currentMarker);
    commands.push(currentLineCommand);
  }
  if (currentSticker) {
    currentLineCommand = new StickerCommand(
      e.offsetX,
      e.offsetY,
      currentSticker
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

thickMarker.button.innerHTML = "thick";
app.append(thickMarker.button);

thickMarker.button.addEventListener("click", changeToThickMaker);

function changeToThickMaker() {
  currentMarker = thickMarker;
  currentSticker = null;
  notify("tool-changed");
}

thinMarker.button.innerHTML = "thin";
app.append(thinMarker.button);

thinMarker.button.addEventListener("click", changeToThinMaker);

function changeToThinMaker() {
  currentMarker = thinMarker;
  currentSticker = null;
  notify("tool-changed");
}

stickerButtons.forEach(function (sticker: Sticker) {
  addStickerButton(sticker);
});

// Implementing Custom sticker
const customStickerButton = document.createElement("button");
customStickerButton.innerHTML = "Custom Sticker";
app.append(customStickerButton);

customStickerButton.addEventListener("click", showCustomStickerPrompt);

function showCustomStickerPrompt() {
  const offset = 1;
  const customStickerText = window.prompt("Enter your custom sticker:");

  stickerButtons.push(new Sticker(ctx, stickerSize, customStickerText!));
  addStickerButton(stickerButtons[stickerButtons.length - offset]);
}

// Redraws the canvas when the drawing has changed
function redraw() {
  ctx.clearRect(start, start, canvas.width, canvas.height);

  commands.forEach((cmd) => cmd.display(ctx));

  if (cursorCommand) {
    cursorCommand.display(ctx);
  }
}

function changeTool() {
  stickerButtons.forEach(function (sticker) {
    sticker.button?.classList.remove("selectedTool");
  });
  thickMarker.button?.classList.remove("selectedTool");
  thinMarker.button?.classList.remove("selectedTool");
  if (currentSticker) {
    currentSticker?.button.classList.add("selectedTool");
  }
  if (currentMarker) {
    currentMarker?.button.classList.add("selectedTool");
  }
}

function addStickerButton(sticker: Sticker) {
  sticker.button.innerHTML = sticker.name;
  app.append(sticker.button);

  sticker.button.addEventListener("click", () => {
    currentSticker = sticker;
    currentMarker = null;
    notify("tool-changed");
  });
}

bus.addEventListener("drawing-changed", redraw);
bus.addEventListener("tool-moved", redraw);
bus.addEventListener("tool-changed", changeTool);

let currentLineCommand: LineCommand | StickerCommand | null = null;

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
