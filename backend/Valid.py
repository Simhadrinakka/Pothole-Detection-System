from ultralytics import YOLO
import os


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, ".."))

# Load trained model
model = YOLO(os.path.join(PROJECT_ROOT, "runs", "detect", "runs", "detect", "train", "weights", "best.pt"))

# Validate model
results = model.val(data=os.path.join(BASE_DIR, "pothole_dataset", "data.yaml"))

print("Validation completed!")
print(results)