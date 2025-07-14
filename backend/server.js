import express from "express";
import cors from 'cors';
import postureRoutes from './routes/postureRoutes.js';
import fs from 'fs';

const app = express ();
const PORT = process.env.PORT || 5000;


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