from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import os
import ast  # Safer alternative to eval

app = Flask(__name__)

# CORS setup – production-ready and precise
CORS(app, resources={r"/*": {"origins": "https://posture-etection-app.vercel.app"}})

@app.route('/analyze', methods=['POST'])
def analyze_pose():
    try:
        print(">> Incoming /analyze request")
        print("Request.files:", request.files)
        print("Request.content_type:", request.content_type)

        # Accept both 'file' and 'frame' keys
        image_file = request.files.get('file') or request.files.get('frame')
        if image_file is None:
            print(">> No file or frame found in request")
            return jsonify({'error': 'No image uploaded'}), 400

        # Save image to temporary file
        temp_path = 'temp_input.jpg'
        image_file.save(temp_path)
        print(">> Image saved to:", temp_path)

        # Run pose detection script
        result = subprocess.run(
            ['python', 'pose_detector.py', temp_path],
            capture_output=True,
            text=True
        )

        print(">> Subprocess STDOUT:", result.stdout)
        print(">> Subprocess STDERR:", result.stderr)

        # Clean up temp file
        os.remove(temp_path)

        if result.returncode != 0:
            return jsonify({
                'error': 'Pose analysis failed',
                'stderr': result.stderr
            }), 500

        # Parse JSON safely
        output = ast.literal_eval(result.stdout.strip())
        return jsonify(output)

    except Exception as e:
        print(">> Exception occurred:", str(e))
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)