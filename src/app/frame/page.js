"use client";
import { useState, useRef, useEffect } from "react";

export default function FramePage() {
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const frames = [
    { id: 1, name: "Frame Portrait", image: "/1.png", orientation: "portrait" },
    { id: 2, name: "Frame Landscape", image: "/2.png", orientation: "landscape" }
  ];

  useEffect(() => {
    startCamera();

    const handleVisibility = () => {
      if (document.hidden) stopCamera();
      else startCamera();
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stopCamera();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.log("Camera blocked.");
    }
  };

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach((track) => track.stop());
  };

  const capturePhoto = () => {
    if (!selectedFrame) return alert("Pilih frame terlebih dahulu!");

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const frame = frames.find((f) => f.id === selectedFrame);

    // ATUR ASPECT RATIO FIX TANPA GEPENG
    canvas.width = frame.orientation === "portrait" ? 720 : 1280;
    canvas.height = frame.orientation === "portrait" ? 1280 : 720;

    const ctx = canvas.getContext("2d");

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const frameImg = new Image();
    frameImg.src = frame.image;

    frameImg.onload = () => {
      ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL("image/png");
      setCapturedImage(imageData);
      setShowPreview(true);
      stopCamera();
    };
  };

  const downloadPhoto = () => {
    const link = document.createElement("a");
    link.download = `photo-${Date.now()}.png`;
    link.href = capturedImage;
    link.click();
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setShowPreview(false);
    startCamera();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 p-6 flex flex-col items-center text-white">
      <h1 className="text-3xl font-bold mb-4">Foto Dengan Frame</h1>

      {/* PREVIEW */}
      {showPreview && capturedImage ? (
  <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
    <div className="bg-white text-black p-4 rounded-xl max-w-sm w-full shadow-2xl">
      <img src={capturedImage} className="w-full rounded-lg mb-4" />

      <button
        onClick={downloadPhoto}
        className="w-full bg-green-600 py-2 rounded-lg font-bold mb-2"
      >
        Download
      </button>

      <button
        onClick={retakePhoto}
        className="w-full bg-blue-600 py-2 rounded-lg font-bold mb-2"
      >
        Foto Ulang
      </button>

      <button
        onClick={() => (window.location.href = "/")}
        className="w-full bg-gray-800 py-2 rounded-lg text-white font-bold"
      >
        Selesai
      </button>
    </div>
  </div>
) : null}


      {/* CAMERA */}
      {!showPreview && (
        <>
          <div className="bg-blue-800/40 backdrop-blur-md p-5 rounded-2xl shadow-xl w-full max-w-sm mb-4">

            {/* CAMERA ORIENTASI OTOMATIS */}
            <div
              className={`relative w-full overflow-hidden rounded-xl bg-black
                ${
                  selectedFrame
                    ? frames.find((f) => f.id === selectedFrame).orientation === "portrait"
                      ? "aspect-[3/4]"
                      : "aspect-video"
                    : "aspect-square"
                }
              `}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
              {selectedFrame && (
                <img
                  src={frames.find((f) => f.id === selectedFrame)?.image}
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                />
              )}
            </div>

            <button
              onClick={capturePhoto}
              disabled={!selectedFrame}
              className={`w-full py-3 mt-4 rounded-lg font-bold text-white shadow-lg transition-all ${
                selectedFrame
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-gray-500 cursor-not-allowed"
              }`}
            >
              Ambil Foto
            </button>
          </div>

          {/* HIDDEN CANVAS */}
          <canvas ref={canvasRef} className="hidden" />

          {/* FRAME LIST */}
          <h2 className="text-xl font-bold mb-3">Pilih Frame</h2>
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
            {frames.map((frame) => (
              <div
                key={frame.id}
                onClick={() => setSelectedFrame(frame.id)}
                className={`border rounded-xl p-2 cursor-pointer transition-all bg-white/10 backdrop-blur-md ${
                  selectedFrame === frame.id
                    ? "border-yellow-400 shadow-xl scale-105"
                    : "border-white/40"
                }`}
              >
                <p className="text-center text-sm mb-1 font-bold">{frame.name}</p>

                <div
                  className={`w-full overflow-hidden rounded-lg bg-black/30
                    ${
                      frame.orientation === "portrait"
                        ? "aspect-[3/4]"
                        : "aspect-video"
                    }
                  `}
                >
                  <img
                    src={frame.image}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
