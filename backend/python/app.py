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
        
        image_file = request.files.get('file') or request.files.get('frame')
        if image_file is None:
            return jsonify({'error': 'No image or frame uploaded'}), 400

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