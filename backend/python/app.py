from flask import Flask, request, jsonify
import subprocess
import os
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/analyze', methods=['POST'])
def analyze_pose():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image uploaded'}), 400

        image_file = request.files['image']
        temp_path = os.path.join('temp_input.jpg')
        image_file.save(temp_path)

        # Call your existing pose_detector.py script
        result = subprocess.run(
            ['python', 'pose_detector.py', temp_path],
            capture_output=True,
            text=True
        )

        os.remove(temp_path)

        if result.returncode != 0:
            return jsonify({'error': 'Pose analysis failed', 'stderr': result.stderr}), 500

        return jsonify(result=eval(result.stdout.strip()))

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)