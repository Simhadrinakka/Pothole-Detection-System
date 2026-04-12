import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import cv2
import numpy as np
from ultralytics import YOLO
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, ".."))

# Folders
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
OUTPUT_FOLDER = os.path.join(BASE_DIR, "outputs")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# Load trained model (IMPORTANT PATH)
MODEL_PATH = os.path.join(PROJECT_ROOT, "runs", "detect", "runs", "detect", "train", "weights", "best.pt")
model = YOLO(MODEL_PATH)


@app.route("/")
def home():
    return jsonify({"status": "ok", "message": "Backend is running!"})


def build_heatmap_image(image_path, boxes_xyxy, output_path):
    """Create and save a heatmap overlay for the detected pothole regions."""

    image = cv2.imread(image_path)
    if image is None:
        raise ValueError("Unable to read the uploaded image")

    height, width = image.shape[:2]

    heatmap = np.zeros((height, width), dtype=np.float32)

    # ✅ FIXED: Proper indentation (inside function)
    if boxes_xyxy is not None and len(boxes_xyxy) > 0:
        for box in boxes_xyxy:
            x1, y1, x2, y2 = [int(value) for value in box]

            x1 = max(0, min(x1, width - 1))
            y1 = max(0, min(y1, height - 1))
            x2 = max(0, min(x2, width))
            y2 = max(0, min(y2, height))

            if x2 > x1 and y2 > y1:
                cx = (x1 + x2) // 2
                cy = (y1 + y2) // 2
                radius = max((x2 - x1), (y2 - y1)) // 2

                for y in range(max(0, cy - radius), min(height, cy + radius)):
                    for x in range(max(0, cx - radius), min(width, cx + radius)):
                        distance = np.sqrt((x - cx)**2 + (y - cy)**2)

                        if distance < radius:
                            heatmap[y, x] += (1 - distance / radius)

    # Normalize
    max_intensity = float(np.max(heatmap))
    if max_intensity > 0:
        normalized_heatmap = np.uint8((heatmap / max_intensity) * 255)
    else:
        normalized_heatmap = np.zeros((height, width), dtype=np.uint8)

    # Color map
    color_heatmap = cv2.applyColorMap(normalized_heatmap, cv2.COLORMAP_JET)

    # Blend
    blended_heatmap = cv2.addWeighted(image, 0.4, color_heatmap, 0.6, 0)

    # Save
    if not cv2.imwrite(output_path, blended_heatmap):
        raise ValueError("Failed to save heatmap")

    return output_path


@app.route("/predict", methods=["POST"])
def predict():
    try:
        if "image" not in request.files:
            return jsonify({"error": "No image uploaded"}), 400

        file = request.files["image"]

        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400

        filename = secure_filename(file.filename)
        input_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(input_path)

        # Run prediction
        results = model(input_path, conf=0.2)

        # Count potholes
        count = len(results[0].boxes)

        # Average confidence
        confidences = results[0].boxes.conf
        if len(confidences) > 0:
            accuracy = float(confidences.mean()) * 100
        else:
            accuracy = 0.0

        # Save output image with boxes
        output_filename = "detected_" + filename
        output_path = os.path.join(OUTPUT_FOLDER, output_filename)
        results[0].save(filename=output_path)

        # Generate the heatmap from YOLO bounding boxes and save it alongside the detection image.
        heatmap_filename = "heatmap_" + filename
        heatmap_path = os.path.join(OUTPUT_FOLDER, heatmap_filename)
        boxes_xyxy = results[0].boxes.xyxy.cpu().numpy() if results[0].boxes is not None else np.empty((0, 4))
        build_heatmap_image(input_path, boxes_xyxy, heatmap_path)

        return jsonify({
            "count": int(count),
            "accuracy": round(accuracy, 2),
            "image_url": f"{request.host_url.rstrip('/')}/output/{output_filename}",
            "heatmap_url": f"{request.host_url.rstrip('/')}/output/{heatmap_filename}"
        })
    except Exception as exc:
        return jsonify({"error": f"Prediction failed: {str(exc)}"}), 500


@app.route("/output/<filename>")
def output_file(filename):
    return send_from_directory(OUTPUT_FOLDER, filename)


if __name__ == "__main__":
    app.run(debug=True)