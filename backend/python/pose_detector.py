import sys
import json
import cv2
import mediapipe as mp
import math

"""Calculate angle between 3 points (a-b-c)"""
def calculate_angle(a, b, c):
    ba = [a[0] - b[0], a[1] - b[1]]
    bc = [c[0] - b[0], c[1] - b[1]]
    dot_product = ba[0]*bc[0] + ba[1]*bc[1]
    mag_ba = math.sqrt(ba[0]**2 + ba[1]**2)
    mag_bc = math.sqrt(bc[0]**2 + bc[1]**2)
    if mag_ba * mag_bc == 0:
        return 0
    angle = math.acos(dot_product / (mag_ba * mag_bc))
    return math.degrees(angle)
"""Rules for detecting bad posture"""
def is_back_bent(shoulder, hip, knee):
    angle = calculate_angle(shoulder, hip, knee)
    return angle, angle < 150

def is_neck_bent(ear, shoulder, hip):
    angle = calculate_angle(ear, shoulder, hip)
    return angle, angle < 150

def is_knee_over_toe(knee, toe):
    return knee[0] > toe[0]

"""Main function to evaluate posture"""

def analyze_posture(landmarks, width, height):
    def get_coords(name):
        lm = landmarks[mp.solutions.pose.PoseLandmark[name].value]
        return int(lm.x * width), int(lm.y * height), lm.visibility

    left_shoulder = get_coords('LEFT_SHOULDER')
    left_hip = get_coords('LEFT_HIP')
    left_knee = get_coords('LEFT_KNEE')
    left_ankle = get_coords('LEFT_ANKLE')
    left_ear = get_coords('LEFT_EAR')
    left_toe = get_coords('LEFT_FOOT_INDEX')

    visibilities = [left_shoulder[2], left_hip[2], left_knee[2], left_ear[2], left_toe[2], left_ankle[2]]
    if min(visibilities) < 0.2:
        return {
            "badPosture": False,
            "feedback": f"Low visibility: {[round(v, 2) for v in visibilities]}",
            "confidence": "Low"
        }

    feedback_list = []
    bad_posture = False

    # Standing posture
    back_angle, back_bent = is_back_bent(left_shoulder[:2], left_hip[:2], left_knee[:2])
    neck_angle, neck_bent = is_neck_bent(left_ear[:2], left_shoulder[:2], left_hip[:2])
    knee_toe_check = is_knee_over_toe(left_knee[:2], left_toe[:2])

    # Sitting posture
    sitting_angle = calculate_angle(left_hip[:2], left_knee[:2], left_ankle[:2])
    is_sitting = 80 <= sitting_angle <= 100

    posture_type = "Sitting" if is_sitting else "Standing"

    # Feedback collection
    if is_sitting:
        if 80 <= sitting_angle <= 100:
            feedback_list.append("Sitting posture detected: Good Sitting Posture")
        else:
            feedback_list.append(f"Sitting posture detected: Bad Sitting Posture (angle: {sitting_angle:.1f}°)")
            bad_posture = True
    else:
        if back_bent:
            feedback_list.append(f"Back bent: {back_angle:.1f}° (<150°)")
            bad_posture = True
        else:
            feedback_list.append(f"Back good: {back_angle:.1f}°")

        if neck_bent:
            feedback_list.append(f"Neck bent: {neck_angle:.1f}° (<150°)")
            bad_posture = True
        else:
            feedback_list.append(f"Neck good: {neck_angle:.1f}°")

        if knee_toe_check:
            feedback_list.append("Knee over toe detected")
            bad_posture = True
        else:
            feedback_list.append("Knee behind toe")

    return {
        "badPosture": bad_posture,
        "postureType": posture_type,
        "feedback": feedback_list,
        "angles": {
            "backAngle": round(back_angle, 1),
            "neckAngle": round(neck_angle, 1),
            "sittingKneeAngle": round(sitting_angle, 1)
        },
        "confidence": "High"
    }
    
    """Analysing Pose with MEdiaPipe """

def analyze_image_file(image_path, save_annotated=True):
    image = cv2.imread(image_path)
    if image is None:
        return { "badPosture": False, "feedback": "Image not found" }

    height, width, _ = image.shape
    mp_pose = mp.solutions.pose
    pose = mp_pose.Pose(static_image_mode=True)
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = pose.process(image_rgb)

    if not results.pose_landmarks:
        return { "badPosture": False, "feedback": "No landmarks found" }

    landmarks = results.pose_landmarks.landmark
    response = analyze_posture(landmarks, width, height)

    if save_annotated:
        mp_drawing = mp.solutions.drawing_utils
        annotated_image = image.copy()
        mp_drawing.draw_landmarks(
            annotated_image,
            results.pose_landmarks,
            mp_pose.POSE_CONNECTIONS
        )
        cv2.imwrite("annotated_output.jpg", annotated_image)

    return response

"""Entry point for single image file analysis"""

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({ "badPosture": False, "feedback": "No input image path" }))
        sys.exit(1)

    image_path = sys.argv[1]
    result = analyze_image_file(image_path)
    print(json.dumps(result))