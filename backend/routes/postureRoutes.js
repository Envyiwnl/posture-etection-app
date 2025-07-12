import express from "express";
import { upload } from '../middleware/multerConfig.js';
import { analyzePosture } from '../controllers/postureController.js';
import { analyzeFrame } from '../controllers/webcamController.js';

const router = express.Router();

//post api route for posture analysis
router.post('/analyze', upload.single('video'),analyzePosture);

// post for live webcam Feed
router.post('/analyze-frame', upload.single('frame'), analyzeFrame);

export default router;