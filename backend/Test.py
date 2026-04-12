from ultralytics import YOLO
import os


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, ".."))

# Load trained model
model = YOLO(os.path.join(PROJECT_ROOT, "runs", "detect", "runs", "detect", "train", "weights", "best.pt"))

# Run prediction on test images
results = model(os.path.join(BASE_DIR, "pothole_dataset", "test", "images"), save=True, conf=0.2)

# Count potholes in first image result
count = len(results[0].boxes)

# Calculate average confidence
confidences = results[0].boxes.conf

if len(confidences) > 0:
    accuracy = float(confidences.mean()) * 100
else:
    accuracy = 0

print("Potholes detected:", count)
print("Average confidence:", round(accuracy, 2), "%")