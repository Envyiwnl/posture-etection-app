import express from "express";
import cors from 'cors';
import postureRoutes from '../backend/routes/postureRoutes.js';
import fs from 'fs';

const app = express ();
const PORT = 5000;

//Middleware used
app.use(cors({
  origin: 'http://localhost:5173'
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