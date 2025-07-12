import { analyzeFramePosturePython } from '../services/poseAnalyser.js';
import fs from 'fs';

export const analyzeFrame = async (req, res) => {
  try {
    const framePath = req.file.path;
    const result = await analyzeFramePosturePython(framePath);

    // Cleanup after analysis
    fs.unlinkSync(framePath);

    res.status(200).json({
      message: 'Frame analyzed',
      result,
    });
  } catch (error) {
    console.error('Webcam frame analysis failed', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};