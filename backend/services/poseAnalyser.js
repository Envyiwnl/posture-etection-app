import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import fetch from "node-fetch";
import FormData from "form-data";

// Path to ffmpeg executable
const ffmpegPath = "ffmpeg";

// Analyze video posture by extracting frames
export const analyzeVideoPosture = async (videoPath) => {
  const outputDir = path.join("uploads", "frames_" + Date.now());
  fs.mkdirSync(outputDir);

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
          console.error("FFmpeg error:", error);
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

          fs.unlinkSync(videoPath);
          fs.rmSync(outputDir, { recursive: true, force: true });

          resolve({
            summary,
            frames: results,
          });
        } catch (cleanupErr) {
          console.error("Post-processing or cleanup error:", cleanupErr);
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
    const response = await fetch("https://posture-python-app.onrender.com/analyze", {
      method: "POST",
      body: form,
    });

    if (!response.ok) {
      throw new Error("Python API error");
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Fetch error:", error);
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