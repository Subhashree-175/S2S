import { useEffect, useRef, useState } from "react";
import {
Upload,
ImagePlus,
Box,
Sparkles,
Download,
RotateCcw,
Maximize2,
X,
ArrowRight,
Cuboid,
Pencil,
Eraser,
Undo2,
Redo2,
Trash2,
WandSparkles,
} from "lucide-react";
import api from "../services/api";

export default function Dashboard() {
const inputRef = useRef(null);
const canvasRef = useRef(null);
const drawingRef = useRef(false);
const historyRef = useRef([]);
const historyIndexRef = useRef(-1);
const previewRef = useRef(null);

const [activeTab, setActiveTab] = useState("upload");
const [file, setFile] = useState(null);
const [preview, setPreview] = useState(null);
const [dragging, setDragging] = useState(false);
const [tool, setTool] = useState("pencil");
const [brushSize, setBrushSize] = useState(4);
const [historyVersion, setHistoryVersion] = useState(0);
const [isGenerating, setIsGenerating] = useState(false);

// Initialize drawing canvas
useEffect(() => {
if (activeTab !== "draw") return;


const canvas = canvasRef.current;
if (!canvas) return;

canvas.width = 900;
canvas.height = 600;

const ctx = canvas.getContext("2d");
ctx.fillStyle = "#ffffff";
ctx.fillRect(0, 0, canvas.width, canvas.height);

historyRef.current = [];
historyIndexRef.current = -1;

saveHistory();


}, [activeTab]);

// Clean up image preview URL
useEffect(() => {
return () => {
if (previewRef.current) {
URL.revokeObjectURL(previewRef.current);
}
};
}, []);

// Save drawing history
const saveHistory = () => {
const canvas = canvasRef.current;
if (!canvas) return;

const snapshot = canvas.toDataURL("image/png");

historyRef.current = historyRef.current.slice(
  0,
  historyIndexRef.current + 1
);

historyRef.current.push(snapshot);
historyIndexRef.current = historyRef.current.length - 1;

setHistoryVersion((v) => v + 1);


};

// Restore canvas state
const restoreCanvas = (data) => {
const canvas = canvasRef.current;
if (!canvas) return;


const ctx = canvas.getContext("2d");
const img = new Image();

img.onload = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
};

img.src = data;


};

// Undo
const undo = () => {
if (historyIndexRef.current <= 0) return;


historyIndexRef.current--;

restoreCanvas(historyRef.current[historyIndexRef.current]);
setHistoryVersion((v) => v + 1);


};

// Redo
const redo = () => {
if (historyIndexRef.current >= historyRef.current.length - 1) return;

historyIndexRef.current++;

restoreCanvas(historyRef.current[historyIndexRef.current]);
setHistoryVersion((v) => v + 1);


};

// Clear canvas
const clearCanvas = () => {
const canvas = canvasRef.current;
if (!canvas) return;


const ctx = canvas.getContext("2d");

ctx.fillStyle = "#ffffff";
ctx.fillRect(0, 0, canvas.width, canvas.height);

saveHistory();


};

// Get pointer coordinates
const getCoordinates = (e) => {
const canvas = canvasRef.current;
const rect = canvas.getBoundingClientRect();


return {
  x: (e.clientX - rect.left) * (canvas.width / rect.width),
  y: (e.clientY - rect.top) * (canvas.height / rect.height),
};


};

// Start drawing
const startDrawing = (e) => {
const canvas = canvasRef.current;
if (!canvas) return;

drawingRef.current = true;
canvas.setPointerCapture(e.pointerId);

const ctx = canvas.getContext("2d");
const { x, y } = getCoordinates(e);

ctx.beginPath();
ctx.moveTo(x, y);


};

// Draw
const draw = (e) => {
if (!drawingRef.current) return;


const canvas = canvasRef.current;
const ctx = canvas.getContext("2d");

const { x, y } = getCoordinates(e);

ctx.lineWidth = brushSize;
ctx.lineCap = "round";
ctx.lineJoin = "round";

ctx.strokeStyle = tool === "eraser" ? "#ffffff" : "#171729";

ctx.lineTo(x, y);
ctx.stroke();


};

// Stop drawing
const stopDrawing = () => {
if (!drawingRef.current) return;


drawingRef.current = false;
saveHistory();


};

// Upload image validation
const handleFile = (selectedFile) => {
if (!selectedFile) return;


const allowedTypes = [
  "image/png",
  "image/jpeg",
  "image/webp",
];

if (!allowedTypes.includes(selectedFile.type)) {
  alert("Please upload a PNG, JPG or WEBP image.");
  return;
}

if (selectedFile.size > 10 * 1024 * 1024) {
  alert("Image size must be less than 10 MB.");
  return;
}

if (previewRef.current) {
  URL.revokeObjectURL(previewRef.current);
}

const imageURL = URL.createObjectURL(selectedFile);

previewRef.current = imageURL;

setFile(selectedFile);
setPreview(imageURL);


};

// Remove uploaded image
const removeFile = () => {
if (previewRef.current) {
URL.revokeObjectURL(previewRef.current);
previewRef.current = null;
}


setFile(null);
setPreview(null);

if (inputRef.current) {
  inputRef.current.value = "";
}


};

// Drag and drop
const handleDrop = (e) => {
e.preventDefault();
setDragging(false);

handleFile(e.dataTransfer.files[0]);


};

// Get sketch as PNG
const getSketchFile = () => {
if (activeTab === "upload") {
return Promise.resolve(file);
}


return new Promise((resolve) => {
  canvasRef.current.toBlob((blob) => {
    if (!blob) {
      resolve(null);
      return;
    }

    resolve(
      new File([blob], "my-sketch.png", {
        type: "image/png",
      })
    );
  }, "image/png");
});


};

// Generate model placeholder
const generateModel = async () => {
  const sketchFile = await getSketchFile();

  if (!sketchFile) {
    alert("Please provide a valid sketch.");
    return;
  }

  const formData = new FormData();
  formData.append("file", sketchFile);

  try {
    setIsGenerating(true);

    const response = await api.post("/generate", formData);

    console.log("Backend response:", response.data);

    alert("Sketch uploaded successfully!");
  } catch (error) {
    console.error("Upload error:", error);

    alert(
      error.response?.data?.detail ||
      "Unable to upload sketch. Please try again."
    );
  } finally {
    setIsGenerating(false);
  }
};

const canGenerate =
activeTab === "upload" ? Boolean(file) : true;

const canUndo = historyIndexRef.current > 0;

const canRedo =
historyIndexRef.current < historyRef.current.length - 1;

return ( <div className="relative min-h-screen overflow-hidden bg-[#080812] text-white">


  {/* Ambient glowing circles */}
  <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-purple-700/25 blur-[130px]" />

  <div className="pointer-events-none absolute -right-40 top-72 h-112.5 w-112.5 rounded-full bg-blue-700/20 blur-[140px]" />

  <div className="pointer-events-none absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-violet-600/20 blur-[120px]" />

  {/* Header */}
  <header className="relative z-10 flex min-h-19 flex-wrap items-center justify-between gap-4 border-b border-white/[0.07] bg-[#0b0b18]/70 px-5 py-3 backdrop-blur-2xl sm:px-8 lg:px-12">

    <div className="flex items-center gap-3">
      <div className="grid h-11 w-11 place-items-center rounded-xl border border-violet-400/20 bg-linear-to-br from-violet-600/40 to-blue-600/30 text-violet-200 shadow-lg shadow-violet-900/30">
        <Cuboid size={25} />
      </div>

      <div>
        <h1 className="text-lg font-bold tracking-tight sm:text-xl">
          Sketch2<span className="text-violet-400">Shape</span>
        </h1>

        <p className="text-[9px] tracking-[2px] text-gray-500">
          AI CREATION STUDIO
        </p>
      </div>
    </div>

    <div className="flex items-center gap-3 sm:gap-5">
      <div className="hidden items-center gap-2 text-[10px] tracking-widest text-gray-400 sm:flex">
        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
        AI WORKSPACE
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-violet-400/20 bg-violet-500/10 px-3 py-2 text-xs text-violet-200">
        <Sparkles size={15} />
        2D <ArrowRight size={13} /> 3D
      </div>
    </div>
  </header>

  {/* Main */}
  <main className="relative z-10 mx-auto w-full max-w-[1600px] px-4 pb-8 pt-9 sm:px-7 sm:pt-12 lg:px-12 lg:pt-14">

    {/* Introduction */}
    <section className="mb-9 sm:mb-11">

      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-2 text-[9px] font-semibold tracking-[1.5px] text-violet-300 sm:text-[10px]">
        <WandSparkles size={14} />
        NEXT GENERATION 3D CREATION
      </div>

      <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl">
        Turn your imagination
        <br />
        into{" "}
        <span className="bg-linear-to-r from-violet-400 via-purple-300 to-blue-400 bg-clip-text text-transparent">
          3D reality.
        </span>
      </h2>

      <p className="mt-4 max-w-xl text-xs leading-6 text-gray-400 sm:text-sm">
        Upload an existing drawing or sketch directly on the canvas.
        Let AI transform your imagination into a 3D model.
      </p>
    </section>

    {/* Main Grid */}
    <section className="grid min-w-0 grid-cols-1 items-stretch gap-5 xl:grid-cols-[0.88fr_1.35fr] xl:gap-6">

      {/* Upload / Draw Panel */}
      <div className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-[#201a35]/90 to-[#101426]/95 p-4 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:rounded-3xl sm:p-6">

        {/* Panel heading */}
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-violet-400/20 bg-violet-500/15 text-violet-300">
            <ImagePlus size={21} />
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-semibold sm:text-base">
              Create your sketch
            </h3>

            <p className="mt-1 text-[10px] text-gray-400 sm:text-xs">
              Choose your preferred input method
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 grid grid-cols-2 gap-3 rounded-xl border border-white/6 bg-black/30 p-1.5">

          <button
            onClick={() => setActiveTab("upload")}
            className={`flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-lg border px-2 text-xs font-medium transition-all duration-200 sm:text-sm ${
              activeTab === "upload"
                ? "border-violet-400/30 bg-linear-to-r from-violet-600/30 to-blue-600/20 text-violet-200 shadow-lg shadow-violet-900/20"
                : "border-transparent text-gray-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Upload size={16} />
            Upload Image
          </button>

          <button
            onClick={() => setActiveTab("draw")}
            className={`flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-lg border px-2 text-xs font-medium transition-all duration-200 sm:text-sm ${
              activeTab === "draw"
                ? "border-violet-400/30 bg-linear-to-r from-violet-600/30 to-blue-600/20 text-violet-200 shadow-lg shadow-violet-900/20"
                : "border-transparent text-gray-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Pencil size={16} />
            Draw Sketch
          </button>
        </div>

        {/* Upload section */}
        {activeTab === "upload" && (
          <>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`relative mt-5 flex min-h-67.5 w-full min-w-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed transition-all duration-300 sm:min-h-77.5 ${
                dragging
                  ? "border-violet-400 bg-violet-500/10"
                  : "border-violet-400/30 bg-black/20 hover:border-violet-400/70 hover:bg-violet-500/5"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                onChange={(e) => handleFile(e.target.files[0])}
              />

              {preview ? (
                <div className="relative flex h-full min-h-67.5 w-full items-center justify-center p-4 sm:min-h-77.5">
                  <img
                    src={preview}
                    alt="Uploaded sketch"
                    className="max-h-70 max-w-full rounded-xl object-contain"
                  />

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile();
                    }}
                    className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-black/80 text-white hover:bg-red-500/20 hover:text-red-300"
                    aria-label="Remove uploaded image"
                  >
                    <X size={18} />
                  </button>

                  <div className="absolute bottom-3 left-3 right-3 truncate rounded-lg bg-black/75 px-3 py-2 text-xs text-gray-200">
                    {file?.name}
                  </div>
                </div>
              ) : (
                <div className="px-4 py-8 text-center">
                  <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl border border-violet-400/20 bg-linear-to-br from-violet-500/20 to-blue-500/10 text-violet-300 shadow-[0_0_35px_rgba(139,92,246,0.12)]">
                    <Upload size={28} />
                  </div>

                  <h4 className="text-sm font-semibold sm:text-base">
                    Drop your sketch here
                  </h4>

                  <p className="mt-2 text-xs text-gray-400">
                    or click to browse your files
                  </p>

                  <span className="mt-5 inline-flex items-center gap-2 rounded-xl border border-violet-400/30 bg-violet-500/15 px-5 py-3 text-xs font-medium text-violet-200 transition hover:bg-violet-500/25">
                    <ImagePlus size={16} />
                    Browse Files
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap justify-between gap-2 text-[10px] text-gray-500">
              <span>PNG · JPG · WEBP</span>
              <span>Maximum size: 10 MB</span>
            </div>
          </>
        )}

        {/* Drawing section */}
        {activeTab === "draw" && (
          <>
            {/* Toolbar */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setTool("pencil")}
                  className={`flex min-h-10 items-center gap-2 rounded-xl border px-3 text-xs font-medium transition ${
                    tool === "pencil"
                      ? "border-violet-400/50 bg-violet-500/20 text-violet-200"
                      : "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  <Pencil size={16} />
                  Pencil
                </button>

                <button
                  onClick={() => setTool("eraser")}
                  className={`flex min-h-10 items-center gap-2 rounded-xl border px-3 text-xs font-medium transition ${
                    tool === "eraser"
                      ? "border-violet-400/50 bg-violet-500/20 text-violet-200"
                      : "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  <Eraser size={16} />
                  Eraser
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={undo}
                  disabled={!canUndo}
                  title="Undo"
                  className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-gray-300 transition hover:bg-violet-500/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Undo2 size={17} />
                </button>

                <button
                  onClick={redo}
                  disabled={!canRedo}
                  title="Redo"
                  className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-gray-300 transition hover:bg-violet-500/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Redo2 size={17} />
                </button>

                <button
                  onClick={clearCanvas}
                  title="Clear canvas"
                  className="grid h-10 w-10 place-items-center rounded-xl border border-red-400/20 bg-red-500/10 text-red-400 transition hover:bg-red-500/20"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>

            {/* Brush size */}
            <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 sm:p-4">
              <div className="mb-3 flex items-center justify-between">
                <label
                  htmlFor="brush-size"
                  className="text-xs text-gray-400"
                >
                  Brush size
                </label>

                <span className="text-xs font-semibold text-violet-300">
                  {brushSize}px
                </span>
              </div>

              <input
                id="brush-size"
                type="range"
                min="1"
                max="20"
                value={brushSize}
                onChange={(e) =>
                  setBrushSize(Number(e.target.value))
                }
                className="h-1.5 w-full cursor-pointer accent-violet-500"
              />
            </div>

            {/* Drawing canvas */}
            <div className="mt-4 w-full min-w-0 overflow-hidden rounded-xl border border-violet-400/20 bg-white">
              <canvas
                ref={canvasRef}
                onPointerDown={startDrawing}
                onPointerMove={draw}
                onPointerUp={stopDrawing}
                onPointerCancel={stopDrawing}
                className="block aspect-3/2 h-auto w-full cursor-crosshair touch-none"
              />
            </div>

            <div className="mt-3 flex flex-wrap justify-between gap-2 text-[10px] text-gray-500">
              <span>Draw your object above</span>
              <span>White background · PNG export</span>
            </div>
          </>
        )}

        {/* Generate button */}
        <button
          onClick={generateModel}
          disabled={!canGenerate || isGenerating}
          className="mt-6 flex min-h-13 w-full items-center justify-center gap-3 rounded-xl bg-linear-to-r from-violet-600 via-indigo-600 to-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-violet-700/30 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
        >
          {isGenerating ? (
            <RotateCcw size={19} className="animate-spin" />
          ) : (
            <Sparkles size={19} />
          )}

          {isGenerating ? "Preparing Sketch..." : "Generate 3D Model"}

          {!isGenerating && <ArrowRight size={18} />}
        </button>

        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-gray-500">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Your sketch is ready for AI processing
        </div>
      </div>

      {/* 3D Preview Panel */}
      <div className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-[#19182e]/90 to-[#0b1020]/95 p-4 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:rounded-3xl sm:p-6">

        <div className="flex flex-wrap items-center justify-between gap-3">

          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-blue-400/20 bg-blue-500/10 text-blue-300">
              <Box size={21} />
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-semibold sm:text-base">
                3D Model Preview
              </h3>

              <p className="mt-1 text-[10px] text-gray-400 sm:text-xs">
                Your generated model will appear here
              </p>
            </div>
          </div>

          <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[9px] tracking-wider text-gray-400">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            PREVIEW
          </span>
        </div>

        {/* 3D Canvas Placeholder */}
        <div className="relative mt-5 flex min-h-90 flex-1 items-center justify-center overflow-hidden rounded-2xl border border-white/[0.07] bg-[radial-gradient(ellipse_at_center,#202143_0%,#111426_50%,#090b18_100%)] sm:min-h-110">

          {/* Grid */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(167,139,250,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.25) 1px, transparent 1px)",
              backgroundSize: "45px 45px",
              maskImage:
                "radial-gradient(ellipse at center, black, transparent 75%)",
            }}
          />

          {/* Center glow */}
          <div className="pointer-events-none absolute h-56 w-56 rounded-full bg-violet-600/20 blur-[90px]" />

          {/* Empty state */}
          <div className="relative z-10 px-5 text-center">

            <div className="relative mx-auto mb-7 grid h-28 w-28 place-items-center rounded-[30px] border border-violet-400/20 bg-linear-to-br from-violet-500/15 to-blue-500/10 text-violet-300 shadow-[0_0_50px_rgba(124,58,237,0.15)]">
              <Cuboid size={55} strokeWidth={1.1} />

              <div className="absolute -inset-3 rounded-full border border-violet-400/10" />
            </div>

            <h4 className="text-base font-semibold sm:text-lg">
              Your 3D model awaits
            </h4>

            <p className="mx-auto mt-3 max-w-xs text-xs leading-6 text-gray-400">
              Upload or draw a sketch to generate your first 3D masterpiece.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {["GLB", "3D ASSET", "AI GENERATED"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-lg border border-violet-400/15 bg-violet-500/10 px-3 py-2 text-[9px] tracking-wider text-violet-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Viewer controls placeholder */}
          <div className="absolute right-3 top-3 flex gap-2">
            <button
              title="Reset view"
              disabled
              className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-black/30 text-gray-400 opacity-50"
            >
              <RotateCcw size={17} />
            </button>

            <button
              title="Fullscreen"
              disabled
              className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-black/30 text-gray-400 opacity-50"
            >
              <Maximize2 size={17} />
            </button>
          </div>

          {/* Canvas footer */}
          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap justify-between gap-2 text-[8px] tracking-wider text-gray-500 sm:text-[9px]">
            <span>DRAG TO ROTATE</span>
            <span>SCROLL TO ZOOM</span>
          </div>
        </div>

        {/* Viewer footer */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">

          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="h-2 w-2 rounded-full bg-gray-500" />
            Waiting for generation
          </div>

          <button
            disabled
            className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-violet-400/20 bg-violet-500/10 px-4 text-xs font-medium text-violet-300 opacity-50"
          >
            <Download size={16} />
            Download GLB
          </button>
        </div>
      </div>
    </section>

    {/* Footer */}
    <footer className="mt-9 flex flex-wrap justify-between gap-3 border-t border-white/[0.07] pt-5 text-[9px] tracking-[1.3px] text-gray-600">
      <span>SKETCH2SHAPE AI</span>
      <span>FROM 2D SKETCH TO 3D WORLD</span>
    </footer>
  </main>
</div>


);
}
