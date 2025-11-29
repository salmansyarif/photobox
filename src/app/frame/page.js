"use client";
import { useState, useRef, useEffect } from "react";

export default function FramePage() {
  // ================================
  // STATE UTAMA
  // ================================
  const [selectedFrame, setSelectedFrame] = useState(null); // Frame apa yang dipilih user
  const [stream, setStream] = useState(null);              // Stream kamera
  const [capturedImage, setCapturedImage] = useState(null); // Hasil foto final
  const [showPreview, setShowPreview] = useState(false);    // Menampilkan tampilan preview hasil foto
  const [landscapeStep, setLandscapeStep] = useState(0);    // Untuk foto landscape (2 kali pose)
  const [firstLandscapePhoto, setFirstLandscapePhoto] = useState(null); // Simpan foto pertama landscape
  const [countdown, setCountdown] = useState(null);         // Countdown 3..2..1

  // Refs kamera & canvas
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // ================================
  // DATA FRAME
  // ================================
  const frames = [
    { id: 1, name: "Frame Portrait", image: "/1.png", orientation: "portrait" },
    { id: 2, name: "Frame Landscape", image: "/2.png", orientation: "landscape" }
  ];

  // Frame yang sedang dipilih
  const currentFrame = frames.find((f) => f.id === selectedFrame);

  // ================================
  // START & STOP KAMERA
  // ================================
  useEffect(() => {
    startCamera();

    // Jika tab berpindah → kamera mati
    const handleVisibility = () =>
      document.hidden ? stopCamera() : startCamera();

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stopCamera();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  // Menyalakan kamera
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" }, // Kamera depan
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch {
      console.log("Kamera diblokir atau tidak tersedia");
    }
  };

  // Mematikan kamera
  const stopCamera = () =>
    stream && stream.getTracks().forEach((t) => t.stop());

  // ================================
  // COUNTDOWN 3..2..1
  // ================================
  const startCountdown = (callback) => {
    let count = 3;
    setCountdown(count);

    const interval = setInterval(() => {
      count--;

      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(interval);
        setCountdown(null);
        callback(); // Setelah selesai → ambil foto
      }
    }, 1000);
  };

  // ================================
  // FOTO PORTRAIT (1x)
  // ================================
  const capturePortrait = () => {
    if (!currentFrame || !videoRef.current || !canvasRef.current) return;

    // Ukuran final portrait 1080 x 1920
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = 1080;
    canvas.height = 1920;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Hitung scale agar video tidak gepeng
    const scaleX = canvas.width / video.videoWidth;
    const scaleY = canvas.height / video.videoHeight;
    const scale = Math.max(scaleX, scaleY);

    const w = video.videoWidth * scale;
    const h = video.videoHeight * scale;
    const x = (canvas.width - w) / 2;
    const y = (canvas.height - h) / 2;

    // Mirror (kiri–kanan)
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -x - w, y, w, h);
    ctx.restore();

    // Tambah FRAME
    const img = new Image();
    img.src = currentFrame.image;

    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      setCapturedImage(canvas.toDataURL("image/png"));
      setShowPreview(true);
      stopCamera(); // Matikan kamera setelah foto
    };
  };

  // ================================
  // FOTO LANDSCAPE (2x)
  // ================================
  const captureLandscape = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // 640 x 720 = ukuran setengah frame kiri/kanan
    const cw = 640;
    const ch = 720;

    canvas.width = cw;
    canvas.height = ch;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, cw, ch);

    const vw = video.videoWidth;
    const vh = video.videoHeight;

    // Bandingkan rasio kamera vs canvas
    const ratioV = vw / vh;
    const ratioC = cw / ch;

    let w, h, x, y;

    // Supaya video tidak gepeng waktu masuk canvas
    if (ratioV > ratioC) {
      h = ch;
      w = h * ratioV;
      x = (cw - w) / 2;
      y = 0;
    } else {
      w = cw;
      h = w / ratioV;
      x = 0;
      y = (ch - h) / 2;
    }

    // Mirror kamera
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -x - w, y, w, h);
    ctx.restore();

    const data = canvas.toDataURL("image/png");

    // Foto pertama (kiri)
    if (landscapeStep === 1) {
      setFirstLandscapePhoto(data);
      setLandscapeStep(2);
    }

    // Foto kedua (kanan)
    else if (landscapeStep === 2) {
      mergeLandscape(firstLandscapePhoto, data);
    }
  };

  // ================================
  // MENGGABUNG FOTO LANDSCAPE
  // ================================
  const mergeLandscape = (left, right) => {
    if (!canvasRef.current || !currentFrame) return;

    const canvas = canvasRef.current;
    canvas.width = 1280;
    canvas.height = 720;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const l = new Image();
    const r = new Image();

    l.src = left;
    r.src = right;

    // Render kiri
    l.onload = () => {
      ctx.drawImage(l, 0, 0, 640, 720);

      // Render kanan
      r.onload = () => {
        ctx.drawImage(r, 640, 0, 640, 720);

        // Tambahkan frame
        const f = new Image();
        f.src = currentFrame.image;

        f.onload = () => {
          ctx.drawImage(f, 0, 0, canvas.width, canvas.height);

          // Simpan hasil final
          setCapturedImage(canvas.toDataURL("image/png"));
          setShowPreview(true);

          // Reset
          setLandscapeStep(0);
          setFirstLandscapePhoto(null);
          stopCamera();
        };
      };
    };
  };

  // ================================
  // TOMBOL AMBIL FOTO
  // ================================
  const handleCapture = () => {
    if (!selectedFrame) return alert("Pilih frame terlebih dahulu!");

    // Portrait hanya 1 foto
    if (currentFrame.orientation === "portrait") {
      startCountdown(capturePortrait);
    }

    // Landscape 2 foto
    else if (landscapeStep === 0) {
      setLandscapeStep(1);
    } else {
      startCountdown(captureLandscape);
    }
  };

  // ================================
  // DOWNLOAD FOTO
  // ================================
  const handleDownload = () => {
    if (!capturedImage) return;

    const link = document.createElement("a");
    link.download = `foto-${Date.now()}.png`;
    link.href = capturedImage;
    link.click();
  };

  // ================================
  // FOTO ULANG
  // ================================
  const handleRetake = () => {
    setCapturedImage(null);
    setShowPreview(false);
    setLandscapeStep(0);
    setFirstLandscapePhoto(null);

    if (canvasRef.current) {
      canvasRef.current
        .getContext("2d")
        .clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    startCamera();
  };

  const handleCancel = () => {
    setLandscapeStep(0);
    setFirstLandscapePhoto(null);
  };

  // ================================
  // TEKS TOMBOL
  // ================================
  const buttonText = !selectedFrame
    ? "Pilih Frame Dulu"
    : currentFrame.orientation === "portrait"
    ? "Ambil Foto"
    : ["Mulai Ambil Foto (2x)", "📸 Foto 1 (Kiri)", "📸 Foto 2 (Kanan)"][
        landscapeStep
      ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 p-6 flex flex-col items-center text-white">
      <h1 className="text-3xl font-bold mb-4">Foto Dengan Frame</h1>

      {/* ================================ */}
      {/* PREVIEW HASIL FOTO */}
      {/* ================================ */}
      {showPreview && capturedImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-white text-black p-4 rounded-xl max-w-sm w-full shadow-2xl">
            <img
              src={capturedImage}
              className="w-full rounded-lg mb-4"
              alt="Hasil Foto"
            />

            <button
              onClick={handleDownload}
              className="w-full bg-green-600 py-2 rounded-lg font-bold mb-2 text-white hover:bg-green-700"
            >
              Download
            </button>

            <button
              onClick={handleRetake}
              className="w-full bg-blue-600 py-2 rounded-lg font-bold mb-2 text-white hover:bg-blue-700"
            >
              Foto Ulang
            </button>

            <button
              onClick={() => (window.location.href = "/")}
              className="w-full bg-gray-800 py-2 rounded-lg text-white font-bold hover:bg-gray-900"
            >
              Selesai
            </button>
          </div>
        </div>
      )}

      {/* ================================ */}
      {/* KAMERA */}
      {/* ================================ */}
      {!showPreview && (
        <>
          <div className="bg-blue-800/40 backdrop-blur-md p-5 rounded-2xl shadow-xl w-full max-w-lg mb-4">
            
            {/* TEXT PETUNJUK UNTUK LANDSCAPE */}
            {currentFrame?.orientation === "landscape" && landscapeStep > 0 && (
              <div className="mb-3 p-3 bg-yellow-500 text-black rounded-lg text-center font-bold">
                {landscapeStep === 1
                  ? "📸 POSE 1: Wajah otomatis masuk frame kiri!"
                  : "📸 POSE 2: Wajah otomatis masuk frame kanan!"}
                <div className="text-xs mt-1 font-normal">
                  Jangan geser! Tetap di tengah.
                </div>
              </div>
            )}

            {/* VIDEO + FRAME */}
            <div
              className={`relative w-full overflow-hidden rounded-xl bg-black ${
                currentFrame
                  ? currentFrame.orientation === "portrait"
                    ? "aspect-[3/4]"
                    : "aspect-video"
                  : "aspect-square"
              }`}
            >
              {/* Video Kamera */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                style={{ transform: "scaleX(-1)" }}
              />

              {/* Frame Overlay */}
              {currentFrame && (
                <img
                  src={currentFrame.image}
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  alt="Frame"
                />
              )}

              {/* Countdown */}
              {countdown && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
                  <div className="text-9xl font-bold text-white animate-ping">
                    {countdown}
                  </div>
                </div>
              )}
            </div>

            {/* Tombol Foto */}
            <button
              onClick={handleCapture}
              disabled={!selectedFrame || countdown}
              className={`w-full py-3 mt-4 rounded-lg font-bold text-white shadow-lg transition-all ${
                selectedFrame && !countdown
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-gray-500 cursor-not-allowed"
              }`}
            >
              {buttonText}
            </button>

            {/* Tombol Batal Landscape */}
            {landscapeStep > 0 && !countdown && (
              <button
                onClick={handleCancel}
                className="w-full py-2 mt-2 rounded-lg font-bold text-white bg-red-600 hover:bg-red-700"
              >
                Batal
              </button>
            )}

            {/* Progress Bar Landscape */}
            {landscapeStep > 0 &&
              currentFrame?.orientation === "landscape" && (
                <div className="mt-4 flex gap-2">
                  <div
                    className={`flex-1 h-2 rounded-full ${
                      landscapeStep >= 1 ? "bg-green-500" : "bg-gray-600"
                    }`}
                  />
                  <div
                    className={`flex-1 h-2 rounded-full ${
                      landscapeStep >= 2 ? "bg-green-500" : "bg-gray-600"
                    }`}
                  />
                </div>
              )}
          </div>

          {/* Canvas untuk edit foto */}
          <canvas ref={canvasRef} className="hidden" />

          {/* ================================ */}
          {/* PILIH FRAME */}
          {/* ================================ */}
          <h2 className="text-xl font-bold mb-3">Pilih Frame</h2>

          <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
            {frames.map((frame) => (
              <div
                key={frame.id}
                onClick={() => {
                  setSelectedFrame(frame.id);
                  setLandscapeStep(0);
                  setFirstLandscapePhoto(null);
                }}
                className={`border rounded-xl p-3 cursor-pointer transition-all bg-white/10 backdrop-blur-md
                  ${
                    selectedFrame === frame.id
                      ? "border-yellow-400 shadow-xl scale-105"
                      : "border-white/40"
                  }
                  ${frame.orientation === "portrait" ? "h-64" : "h-40"}
                `}
              >
                <p className="text-center text-sm mb-2 font-bold">
                  {frame.name}
                  {frame.orientation === "landscape" && " (2x)"}
                </p>

                <div
                  className={`w-full overflow-hidden rounded-lg bg-black/30 ${
                    frame.orientation === "portrait"
                      ? "aspect-[3/4]"
                      : "aspect-video"
                  }`}
                >
                  <img
                    src={frame.image}
                    className="w-full h-full object-cover"
                    alt={frame.name}
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
