import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import fetch from "node-fetch";
import FormData from "form-data";
import ffmpegPath from "ffmpeg-static";

// Analyze video posture by extracting frames
export const analyzeVideoPosture = async (videoPath) => {
  const outputDir = path.join("uploads", "frames_" + Date.now());
  fs.mkdirSync(outputDir, { recursive: true }); // Safely recursive creation

  const outputPattern = path.join(outputDir, "frame-%03d.jpg");

  return new Promise((resolve, reject) => {
    console.log("Running ffmpeg:", ffmpegPath);
    console.log("Video path:", videoPath);
    console.log("Output pattern:", outputPattern);

    execFile(
      ffmpegPath,
      ["-i", videoPath, "-vf", "fps=1", outputPattern],
      async (error) => {
        if (error) {
          console.error("❌ FFmpeg error:", error);
          return reject(error);
        }

        try {
          const frameFiles = fs
            .readdirSync(outputDir)
            .filter((f) => f.endsWith(".jpg"));

          const framePromises = frameFiles.map(async (file) => {
            const framePath = path.join(outputDir, file);
            const postureResult = await analyzeFramePosturePython(framePath);
            return {
              frame: file,
              ...postureResult,
              framePath,
            };
          });

          const results = await Promise.all(framePromises);
          const summary = generateSummary(results);

          // Cleanup
          fs.unlinkSync(videoPath);
          fs.rmSync(outputDir, { recursive: true, force: true });

          resolve({
            summary,
            frames: results,
          });
        } catch (cleanupErr) {
          console.error("❌ Post-processing error:", cleanupErr);
          reject(cleanupErr);
        }
      }
    );
  });
};

// Analyze a single frame via Flask Python API
export async function analyzeFramePosturePython(imagePath) {
  const form = new FormData();
  form.append("file", fs.createReadStream(imagePath));

  try {
    const response = await fetch("https://7723c1d66568.ngrok-free.app/analyze", {
      method: "POST",
      body: form,
      headers: form.getHeaders(),
    });

    const text = await response.text();

    try {
      return JSON.parse(text);
    } catch (jsonErr) {
      console.error("❌ JSON parse error:", jsonErr);
      console.error("Raw response from Python backend:", text);
      return {
        badPosture: false,
        feedback: "Invalid JSON from analyzer",
      };
    }
  } catch (error) {
    console.error("❌ Fetch error:", error);
    return {
      badPosture: false,
      feedback: "Error connecting to analyzer API",
    };
  }
}

// Summary helper
function generateSummary(results) {
  const badFrames = results.filter((r) => r.badPosture).length;
  return {
    totalFrames: results.length,
    badFrames,
    badPostureRate: `${((badFrames / results.length) * 100).toFixed(1)}%`,
  };
}