from flask import Flask, request, jsonify
import subprocess
import os
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/analyze', methods=['POST'])
def analyze_pose():
    try:
        print("Request files:", request.files)
        print("Request content-type:", request.content_type)

        # Accept both 'frame' (from webcam) and 'file' (from video processing)
        image_file = request.files.get('frame') or request.files.get('file')

        if not image_file:
            return jsonify({'error': 'No file uploaded'}), 400

        temp_path = 'temp_input.jpg'
        image_file.save(temp_path)

        result = subprocess.run(
            ['python', 'pose_detector.py', temp_path],
            capture_output=True,
            text=True
        )

        os.remove(temp_path)

        if result.returncode != 0:
            return jsonify({
                'error': 'Pose analysis failed',
                'stderr': result.stderr
            }), 500

        return jsonify(eval(result.stdout.strip()))

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)