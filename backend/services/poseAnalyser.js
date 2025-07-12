import { execFile } from "child_process";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

// Path to ffmpeg executable
const ffmpegPath = "ffmpeg";

// Main function to analyze video posture
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
      async (error, stdout, stderr) => {
        if (error) {
          console.error("FFmpeg error:", error);
          return reject(error);
        }

        try {
          // Read all extracted .jpg frames
          const frameFiles = fs
            .readdirSync(outputDir)
            .filter((f) => f.endsWith(".jpg"));

          // Parallel processing of  with promise.all

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

          // Delete video file and extracted 
          
          fs.unlinkSync(videoPath);
          fs.rmSync(outputDir, { recursive: true, force: true });
          
          // Return results

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

// Generate Summary
function generateSummary(results) {
  const badFrames = results.filter((r) => r.badPosture).length;
  return {
    totalFrames: results.length,
    badFrames,
    badPostureRate: `${((badFrames / results.length) * 100).toFixed(1)}%`,
  };
}

// Sends frame to Python script for real MediaPipe-based analysis
export async function analyzeFramePosturePython(imagePath) {
  return new Promise((resolve, reject) => {
    const fullImagePath = path.resolve(imagePath);
    const detectorScript = path.resolve("python/pose_detector.py");
    const python = spawn("python", [detectorScript, fullImagePath]);

    let data = "";
    let error = "";

    python.stdout.on("data", (chunk) => {
      data += chunk.toString();
      console.log("PYTHON STDOUT:", chunk.toString());
    });

    python.stderr.on("data", (chunk) => {
      error += chunk.toString();
      console.error("PYTHON STDERR:", chunk.toString());
    });

    python.on("close", (code) => {
      if (code !== 0) {
        console.error("Python error:", error);
        return resolve({
          badPosture: false,
          feedback: "Pose analysis failed",
        });
      }

      try {
        const parsed = JSON.parse(data);
        resolve(parsed);
      } catch (err) {
        console.error("JSON parse error:", err);
        resolve({
          badPosture: false,
          feedback: "Invalid response from analyzer",
        });
      }
    });
  });
}