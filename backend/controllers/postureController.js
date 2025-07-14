import { analyzeVideoPosture } from "../services/poseAnalyser.js";

export const analyzePosture = async (req, res) => {
  try {
    if (!req.file) {
      console.error("❌ No file received");
      return res.status(400).json({ error: "No video file provided" });
    }

    console.log("✅ File received:", req.file.path);

    const result = await analyzeVideoPosture(req.file.path);

    res.status(200).json({
      message: 'analysis complete',
      result
    });
  } catch (error) {
    console.error('❌ Posture analysis failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};