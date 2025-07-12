import { analyzeVideoPosture } from "../services/poseAnalyser.js";

export const analyzePosture = async (req, res)=> {
    try {
        const videoPath = req.file.path;

        const result = await analyzeVideoPosture(videoPath);

        res.status(200).json({
            message: 'analysis complete',
            result
        });
    } catch(error) {
        console.error('posture analysis failed', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};