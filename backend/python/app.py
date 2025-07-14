from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import os
import json
import traceback

app = Flask(__name__)

# CORS setup – allow only frontend origin
CORS(app, resources={r"/*": {"origins": "https://posture-etection-app.vercel.app"}})

@app.route('/analyze', methods=['POST'])
def analyze_pose():
    try:
        print(">> Incoming /analyze request")
        print("Request.files:", request.files)

        # Accept both 'file' and 'frame'
        image_file = request.files.get('file') or request.files.get('frame')
        if image_file is None:
            return jsonify({'error': 'No image uploaded'}), 400

        temp_path = 'temp_input.jpg'
        image_file.save(temp_path)

        result = subprocess.run(
            ['python', 'pose_detector.py', temp_path],
            capture_output=True,
            text=True
        )

        os.remove(temp_path)

        if result.returncode != 0:
            print(">> Error from pose_detector.py:", result.stderr)
            return jsonify({'error': 'Pose analysis failed', 'stderr': result.stderr}), 500

        output = json.loads(result.stdout.strip())
        return jsonify(output)

    except Exception as e:
        print(">> Exception in /analyze:", str(e))
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/analyze-video', methods=['POST'])
def analyze_video():
    try:
        print(">> Incoming /analyze-video request")

        video_file = request.files.get('file')
        if not video_file:
            return jsonify({'error': 'No video uploaded'}), 400

        video_path = 'temp_video.mp4'
        video_file.save(video_path)

        frame_dir = 'frames'
        os.makedirs(frame_dir, exist_ok=True)

        frame_pattern = os.path.join(frame_dir, 'frame-%03d.jpg')
        subprocess.run(['ffmpeg', '-i', video_path, '-vf', 'fps=1', frame_pattern], check=True)

        results = []
        for fname in sorted(os.listdir(frame_dir)):
            if fname.endswith('.jpg'):
                frame_path = os.path.join(frame_dir, fname)
                output = subprocess.run(
                    ['python', 'pose_detector.py', frame_path],
                    capture_output=True,
                    text=True
                )
                results.append(json.loads(output.stdout.strip()))

        # Cleanup
        os.remove(video_path)
        for f in os.listdir(frame_dir):
            os.remove(os.path.join(frame_dir, f))
        os.rmdir(frame_dir)

        # Summary
        bad_count = sum(1 for r in results if r.get('badPosture'))
        summary = {
            'totalFrames': len(results),
            'badFrames': bad_count,
            'badPostureRate': f"{(bad_count / len(results) * 100):.1f}%"
        }

        return jsonify({
            'summary': summary,
            'frames': results
        })

    except Exception as e:
        print(">> Exception in /analyze-video:", str(e))
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)