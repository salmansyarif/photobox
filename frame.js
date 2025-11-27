import { useState, useRef, useEffect } from 'react';

export default function FramePage() {
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const previewCanvasRef = useRef(null);

  // Frame images (ganti dengan path foto frame Anda)
  const frames = [
    {
      id: 1,
      name: 'Frame 1',
      image: '/frame1.png' // Ganti dengan path frame Anda
    },
    {
      id: 2,
      name: 'Frame 2',
      image: '/frame2.png' // Ganti dengan path frame Anda
    }
  ];

  // Start camera automatically
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      alert('Tidak dapat mengakses kamera. Pastikan Anda memberikan izin kamera.');
      console.error(err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  // Capture photo with frame overlay
  const capturePhoto = () => {
    if (!selectedFrame) {
      alert('Pilih frame terlebih dahulu!');
      return;
    }

    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      // Draw video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Draw frame overlay
      const frameImg = new Image();
      frameImg.src = frames.find(f => f.id === selectedFrame)?.image;
      frameImg.onload = () => {
        ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/png');
        setCapturedImage(imageData);
        setShowPreview(true);
        stopCamera();
      };
    }
  };

  // Download photo
  const downloadPhoto = () => {
    if (capturedImage) {
      const link = document.createElement('a');
      link.download = `photo-frame-${Date.now()}.png`;
      link.href = capturedImage;
      link.click();
      setShowPreview(false);
      setCapturedImage(null);
      startCamera();
    }
  };

  // Retake photo
  const retakePhoto = () => {
    setCapturedImage(null);
    setShowPreview(false);
    startCamera();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800 dark:text-white">
          Foto dengan Frame
        </h1>

        {/* Preview Modal */}
        {showPreview && capturedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-auto">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 text-center">
                Preview Foto
              </h2>
              
              <div className="flex justify-center mb-6">
                <img 
                  src={capturedImage} 
                  alt="Preview" 
                  className="max-w-full h-auto rounded-lg shadow-2xl"
                />
              </div>

              <div className="flex gap-4 justify-center flex-wrap">
                <button
                  onClick={downloadPhoto}
                  className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  💾 Download Foto
                </button>
                <button
                  onClick={retakePhoto}
                  className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  🔄 Foto Ulang
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Camera Section */}
        {!showPreview && (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 mb-8">
              <div className="flex justify-center mb-6">
                <div className="text-center w-full relative">
                  <div className="relative inline-block">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="rounded-lg max-w-full shadow-xl"
                    />
                    {selectedFrame && (
                      <img
                        src={frames.find(f => f.id === selectedFrame)?.image}
                        alt="Frame overlay"
                        className="absolute top-0 left-0 w-full h-full pointer-events-none"
                      />
                    )}
                  </div>
                  
                  <div className="mt-6">
                    <button
                      onClick={capturePhoto}
                      disabled={!selectedFrame}
                      className={`px-8 py-3 rounded-lg font-semibold text-white transition-all ${
                        selectedFrame 
                          ? 'bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl' 
                          : 'bg-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {selectedFrame ? '📸 Ambil Foto' : 'Pilih Frame Terlebih Dahulu'}
                    </button>
                  </div>
                </div>
              </div>

              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>

            {/* Frame Selection Cards */}
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-white">
              Pilih Frame
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {frames.map((frame) => (
                <div
                  key={frame.id}
                  onClick={() => setSelectedFrame(frame.id)}
                  className={`bg-white dark:bg-gray-800 rounded-xl p-6 cursor-pointer transition-all transform hover:scale-105 ${
                    selectedFrame === frame.id
                      ? 'ring-4 ring-blue-500 shadow-2xl'
                      : 'shadow-lg hover:shadow-xl'
                  }`}
                >
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                      {frame.name}
                    </h3>
                    {selectedFrame === frame.id && (
                      <span className="inline-block px-3 py-1 bg-blue-500 text-white text-sm rounded-full">
                        ✓ Terpilih
                      </span>
                    )}
                  </div>
                  
                  {/* Frame Preview */}
                  <div className="flex justify-center">
                    <div className="relative w-full max-w-xs">
                      <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                      <img
                        src={frame.image}
                        alt={frame.name}
                        className="absolute top-0 left-0 w-full h-full object-cover rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}