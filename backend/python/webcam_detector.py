import cv2
import mediapipe as mp
import math
from pose_detector import analyze_posture

"""Initialize MediaPipe pose"""

mp_pose = mp.solutions.pose
pose = mp_pose.Pose()
mp_drawing = mp.solutions.drawing_utils

"""Start capturing video from webcam"""

cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("❌ Could not open webcam.")
    exit()

print("✅ Webcam started. Press 'q' to quit.")

while True:
    ret, frame = cap.read()
    if not ret:
        print("⚠️ Failed to grab frame.")
        break

    """Convert frame to RGB"""

    image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = pose.process(image_rgb)

    if results.pose_landmarks:
        height, width, _ = frame.shape
        landmarks = results.pose_landmarks.landmark

        """posture analysis"""

        feedback = analyze_posture(landmarks, width, height)

        """Draw landmarks"""

        mp_drawing.draw_landmarks(
            frame,
            results.pose_landmarks,
            mp_pose.POSE_CONNECTIONS
        )

        """Display feedback text on screen"""
        y = 20
        for msg in feedback["feedback"]:
            cv2.putText(frame, msg, (10, y), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255 if feedback["badPosture"] else 0), 1, cv2.LINE_AA)
            y += 20

    cv2.imshow("Posture Detector", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

"""Cleanup"""

cap.release()
cv2.destroyAllWindows()