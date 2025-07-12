import express from "express";
import cors from 'cors';
import postureRoutes from '../backend/routes/postureRoutes.js';
import fs from 'fs';
import { exec } from 'child_process';

const app = express ();
const PORT = process.env.PORT || 5000;

exec('pip install -r backend/python/requirements.txt', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error installing Python dependencies: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Python stderr: ${stderr}`);
    return;
  }
  console.log(`Python dependencies installed:\n${stdout}`);
});

//Middleware used
const allowedOrigins = [
  'http://localhost:5173',
  'https://posture-etection-app.vercel.app',
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json());
app.use('/uploads',express.static('uploads'));

//routes used
app.use('/api/posture', postureRoutes);

//Checks for uploads folder
const uploadPath = './uploads';

if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath);
}

app.listen(PORT, ()=> {
    console.log(`Server running at http://localhost:${PORT}`);
})