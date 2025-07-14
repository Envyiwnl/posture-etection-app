import { useState, useRef, useEffect } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import { AiOutlineCheckCircle, AiOutlineCloseCircle } from "react-icons/ai";

const PostureApp = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [outputVisible, setOutputVisible] = useState(false);
  const [videoAnalysis, setVideoAnalysis] = useState(null);
  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamFeedback, setWebcamFeedback] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef(null);
  const webcamRef = useRef(null);
  const fileInputRef = useRef();
  const frameInterval = useRef(null);

// starts sending one frame every 1 second

  useEffect(() => {
    if (webcamActive) {
      frameInterval.current = setInterval(captureAndAnalyzeFrame, 1000);
    } else {
      clearInterval(frameInterval.current);
    }
    return () => clearInterval(frameInterval.current);
  }, [webcamActive]);

// Converts images into Binary large objects and sends to the python script
  
  const captureAndAnalyzeFrame = async () => {
    if (!webcamRef.current || !canvasRef.current) return;

    const video = webcamRef.current.video;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      async (blob) => {
        if (!blob) return;

        const formData = new FormData();
        formData.append("file", blob, "webcam_frame.jpg");

        try {
          const res = await axios.post(
            "https://7723c1d66568.ngrok-free.app/analyze",
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          );
          setWebcamFeedback(res.data);
          console.log("Webcam backend feedback:", res.data);
        } catch (err) {
          console.error("Webcam frame analysis error:", err);
        }
      },
      "image/jpeg",
      0.95
    );
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setVideoAnalysis(null);
      setWebcamActive(false);
      setOutputVisible(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setVideoAnalysis(null);
      setWebcamActive(false);
      setOutputVisible(false);
    }
  };

  const uploadVideo = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await axios.post(
        "https://7723c1d66568.ngrok-free.app/analyze-video",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setVideoAnalysis(res.data.result);
      setOutputVisible(true);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setIsProcessing(false);
    }
  };
// Filters good and bad frames based on keywords like good, bent, or bad.

  const selectFrames = (frames) => {
    const good = frames.filter(
      (f) =>
        Array.isArray(f.feedback) &&
        f.feedback.every((msg) => msg.toLowerCase().includes("good"))
    );
    const bad = frames.filter(
      (f) =>
        Array.isArray(f.feedback) &&
        f.feedback.some(
          (msg) =>
            msg.toLowerCase().includes("bent") ||
            msg.toLowerCase().includes("bad")
        )
    );

    const standingGood = good.find(
      (f) =>
        Array.isArray(f.feedback) &&
        f.feedback.some((msg) => msg.toLowerCase().includes("back"))
    );
    const standingBad = bad.find(
      (f) =>
        Array.isArray(f.feedback) &&
        f.feedback.some((msg) => msg.toLowerCase().includes("back bent"))
    );

    const selected = [];
    if (standingGood) selected.push(standingGood);
    if (standingBad) selected.push(standingBad);

    selected.push(...good.filter((f) => f !== standingGood).slice(0, 2));
    selected.push(...bad.filter((f) => f !== standingBad).slice(0, 1));

    return selected.slice(0, 5);
  };

  return (
    <div className="flex flex-col items-center gap-6 p-16 text-center">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="w-[250px] h-[200px] md:w-[600px] md:h-[500px] border-4 border-dashed rounded-lg flex items-center justify-center cursor-pointer relative"
        onClick={() => {
          if (!webcamActive) fileInputRef.current.click();
        }}
      >
        {webcamActive ? (  // Conditional rendering based on webcam active or Video upload
          <>
            <Webcam
              audio={false}
              ref={webcamRef}
              className="w-full h-full object-cover rounded-md"
              mirrored
              videoConstraints={{
                width: 1280,
                height: 720,
                facingMode: "user",
              }}
            />
            <canvas
              ref={canvasRef}
              width="640"
              height="480"
              style={{ display: "none" }}
            />
          </>
        ) : (
          <>
            <span className="text-5xl font-bold text-gray-400">+</span>
            <input
              type="file"
              accept="video/*"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
            />
          </>
        )}
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => {
            setWebcamActive((prev) => !prev);
            setSelectedFile(null);
            setVideoAnalysis(null);
            setOutputVisible(true);
          }}
          className={`px-4 py-2 rounded text-white ${
            webcamActive
              ? "bg-red-500 hover:bg-red-600"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {webcamActive ? "Turn off Webcam" : "Turn on Webcam"}
        </button>

        <button
          onClick={uploadVideo}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
          disabled={!selectedFile || isProcessing}
        >
          {isProcessing ? "Processing..." : "Upload Video"}
        </button>
      </div>

      {outputVisible && (
        <div className="mt-8 w-full max-w-2xl">
          {webcamActive && ( // Feedback from backend
            <div className="border p-4 rounded shadow bg-gray-100 text-left mb-4">
              <h3 className="text-lg font-semibold mb-2">
                Live Webcam Posture Feedback
              </h3>
              {webcamFeedback ? (
                <ul className="mt-3 list-disc list-inside">
                  {Array.isArray(webcamFeedback.feedback) ? (
                    webcamFeedback.feedback.map((msg, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        {msg.toLowerCase().includes("good") ? (
                          <AiOutlineCheckCircle className="text-green-500" />
                        ) : (
                          <AiOutlineCloseCircle className="text-red-500" />
                        )}
                        {msg}
                      </li>
                    ))
                  ) : (
                    <li>{webcamFeedback.feedback}</li>
                  )}
                </ul>
              ) : (
                <p className="text-gray-500 italic">
                  Waiting for posture feedback...
                </p>
              )}
            </div>
          )}

          {!webcamActive && isProcessing && (
            <div className="text-gray-600 italic text-center p-4">
              Analyzing video, please wait...
            </div>
          )}

          {!webcamActive && videoAnalysis && ( //based on rule-based feedback show user realtime analysis
            <div className="border p-4 rounded shadow bg-gray-100 text-left">
              <h3 className="text-lg font-semibold mb-2">
                Video Analysis Summary
              </h3>
              <p>
                <strong>Total Frames:</strong>{" "}
                {videoAnalysis.summary.totalFrames}
              </p>
              <p>
                <strong>Bad Posture Frames:</strong>{" "}
                {videoAnalysis.summary.badFrames}
              </p>
              <p>
                <strong>Bad Posture Rate:</strong>{" "}
                {videoAnalysis.summary.badPostureRate}
              </p>
              <div className="mt-4 flex items-center gap-2 text-lg font-semibold">
                {parseFloat(videoAnalysis.summary.badPostureRate) < 50 ? (
                  <>
                    <AiOutlineCheckCircle className="text-green-500" />
                    <span className="text-green-600">Good Posture</span>
                  </>
                ) : (
                  <>
                    <AiOutlineCloseCircle className="text-red-500" />
                    <span className="text-red-600">Bad Posture</span>
                  </>
                )}
              </div>
              <ul className="mt-3 list-disc list-inside">
                {selectFrames(videoAnalysis.frames).map((frame, idx) => (
                  <li key={idx} className="mb-2">
                    <strong>Frame {frame.frame}:</strong>
                    <ul className="ml-4 mt-1">
                      {Array.isArray(frame.feedback) ? (
                        frame.feedback.map((msg, i) => (
                          <li key={i} className="flex items-center gap-2">
                            {msg.toLowerCase().includes("good") ? (
                              <AiOutlineCheckCircle className="text-green-500" />
                            ) : (
                              <AiOutlineCloseCircle className="text-red-500" />
                            )}
                            {msg}
                          </li>
                        ))
                      ) : (
                        <li>{frame.feedback}</li>
                      )}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PostureApp;
