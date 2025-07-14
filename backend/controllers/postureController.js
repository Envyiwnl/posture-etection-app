import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

export const analyzePosture = async (req, res) => {
  try {
    const videoPath = req.file.path;

    const form = new FormData();
    form.append('file', fs.createReadStream(videoPath));

    const flaskURL = 'https://7723c1d66568.ngrok-free.app/analyze-video';
    const response = await fetch(flaskURL, {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
    });

    const result = await response.json();

    fs.unlinkSync(videoPath); // delete temp video
    res.status(200).json({ message: 'analysis complete', result });
  } catch (error) {
    console.error('posture analysis failed', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};