from ultralytics import YOLO
import os


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, ".."))

def train_model():
    # Load YOLOv8 model (object detection)
    model = YOLO(os.path.join(BASE_DIR, "yolov8n.pt"))   # small + fast

    # Train model
    model.train(
        data=os.path.join(BASE_DIR, "pothole_dataset", "data.yaml"),
        epochs=50,
        imgsz=640,
        batch=16,
        project=os.path.join(PROJECT_ROOT, "runs", "detect"),
        name="train"
    )

    print("Training completed successfully!")

if __name__ == "__main__":
    train_model()
