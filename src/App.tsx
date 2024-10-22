import React, { useState, useRef, useCallback } from 'react';
import { Video, StopCircle, PlayCircle, PictureInPicture2, Download, Camera, CameraOff } from 'lucide-react';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [showWebcam, setShowWebcam] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const webcamRef = useRef<HTMLVideoElement>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      if (webcamRef.current) {
        webcamRef.current.srcObject = stream;
        webcamStreamRef.current = stream;
      }
      setShowWebcam(true);
    } catch (err) {
      console.error("Error accessing webcam:", err);
    }
  };

  const stopWebcam = () => {
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach(track => track.stop());
      webcamStreamRef.current = null;
    }
    if (webcamRef.current) {
      webcamRef.current.srcObject = null;
    }
    setShowWebcam(false);
  };

  const toggleWebcam = () => {
    if (showWebcam) {
      stopWebcam();
    } else {
      startWebcam();
    }
  };

  const startRecording = useCallback(async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
        },
        audio: true,
      });

      let finalStream = displayStream;

      // If webcam is active, combine streams
      if (webcamStreamRef.current) {
        const tracks = [...displayStream.getTracks(), ...webcamStreamRef.current.getTracks()];
        finalStream = new MediaStream(tracks);
      }

      const mediaRecorder = new MediaRecorder(finalStream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const tracks = finalStream.getTracks();
        tracks.forEach(track => track.stop());
        setRecordedChunks(chunks);
      };

      if (videoRef.current) {
        videoRef.current.srcObject = finalStream;
      }

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error starting screen recording:", err);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const togglePiP = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (videoRef.current) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.error("Error toggling PiP:", err);
    }
  };

  const downloadRecording = () => {
    if (recordedChunks.length === 0) return;
    
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style.display = 'none';
    a.href = url;
    a.download = `screen-recording-${new Date().toISOString()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-2">
            <Video className="w-8 h-8" />
            Screen Recorder Pro
          </h1>
          <p className="text-gray-300">Record your screen with webcam and Picture-in-Picture support</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 shadow-xl mb-8">
          <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              autoPlay
              muted
              playsInline
            />
            {showWebcam && (
              <div className="absolute bottom-4 right-4 w-48 h-36 bg-black rounded-lg overflow-hidden shadow-lg border-2 border-blue-500">
                <video
                  ref={webcamRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  playsInline
                />
              </div>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-colors ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isRecording ? (
                <>
                  <StopCircle className="w-5 h-5" />
                  Stop Recording
                </>
              ) : (
                <>
                  <PlayCircle className="w-5 h-5" />
                  Start Recording
                </>
              )}
            </button>

            <button
              onClick={toggleWebcam}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-colors ${
                showWebcam
                  ? 'bg-yellow-600 hover:bg-yellow-700'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {showWebcam ? (
                <>
                  <CameraOff className="w-5 h-5" />
                  Disable Webcam
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5" />
                  Enable Webcam
                </>
              )}
            </button>

            <button
              onClick={togglePiP}
              className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold bg-purple-600 hover:bg-purple-700 transition-colors"
              disabled={!videoRef.current?.srcObject}
            >
              <PictureInPicture2 className="w-5 h-5" />
              Toggle PiP
            </button>

            {recordedChunks.length > 0 && (
              <button
                onClick={downloadRecording}
                className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold bg-green-600 hover:bg-green-700 transition-colors"
              >
                <Download className="w-5 h-5" />
                Download
              </button>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-4">Features</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>Screen recording with audio</li>
              <li>Webcam overlay support</li>
              <li>Picture-in-Picture mode</li>
              <li>Download recordings in WebM format</li>
              <li>Adjustable webcam position</li>
            </ul>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-4">Browser Support</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>Chrome: Full support for all features</li>
              <li>Edge: Full support for all features</li>
              <li>Safari: Supports recording and webcam (requires permission)</li>
              <li>Firefox: Limited PiP support, other features work</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;