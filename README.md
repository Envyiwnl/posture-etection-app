Posture Detection Web App

A full-stack rule-based posture detection system that analyzes user posture using webcam feed or uploaded videos. Built using **React**, **Node.js**, **Flask**, and **MediaPipe**, it provides real-time feedback on sitting and standing posture.

---

## 🚀 Features

- 🎥 Live **webcam posture detection** (real-time frame-by-frame analysis)
- 📹 **Video upload** support with batch frame analysis
- 🧠 Rule-based posture evaluation using keypoint geometry:
  - Back angle
  - Neck bend
  - Knee over toe alignment
- ✅ Good posture frames highlighted
- ❌ Bad posture frames flagged with feedback
- 📈 Summary report of analyzed video

---

## 🧱 Tech Stack

| Layer     | Technology                                 |
|-----------|--------------------------------------------|
| Frontend  | React, Tailwind CSS, Axios                 |
| Backend   | Node.js (Express), Python (Flask)          |
| CV Engine | Python, MediaPipe, OpenCV, FFmpeg          |
| Hosting   | Vercel (frontend), Ngrok/Flask (backends)  |

📂 Project Structure

postureapp/
├── frontend/ # React frontend
├── backend/
│ ├── server.js # Node.js Express server
│ ├── routes/ # API endpoints
│ ├── controllers/ # Upload and analysis logic
│ ├── services/ # Frame extractor & analyzer
│ └── python/ # Flask + pose_detector.py

## ⚙️ Setup Instructions

git clone https://github.com/Envyiwnl/posture-detection-app.git
cd postureapp

Frontend Setup

cd frontend
npm install
npm run dev

Backend Setup

cd backend
npm install
node server.js

cd backend/python
python -m venv venv
source venv/bin/activate    ## On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
## This handles the actual pose analysis using MediaPipe.


