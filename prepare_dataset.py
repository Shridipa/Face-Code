import os
import cv2
import numpy as np
import urllib.request
import zipfile
import shutil
from sklearn.model_selection import train_test_split

DATASET_NAME = "fer2013"
RAW_DATA_PATH = "data/raw"
PROCESSED_DATA_PATH = "data/processed"

def download_and_extract_if_needed():
    # If using Kaggle fer2013 (msambare/fer2013) or similar structure.
    # In a real scenario, this step might require kaggle API keys.
    # For demonstration, we assume data/raw is populated or we mock it.
    
    if not os.path.exists(RAW_DATA_PATH):
        os.makedirs(RAW_DATA_PATH, exist_ok=True)
        print(f"Please ensure your FER2013 dataset images/folders are placed in {RAW_DATA_PATH}")
        print("For example: data/raw/train/angry/..., data/raw/test/angry/...")

def get_image_paths_and_labels(data_dir):
    image_paths = []
    labels = []
    label_names = sorted(os.listdir(data_dir))
    label_map = {name: idx for idx, name in enumerate(label_names) if os.path.isdir(os.path.join(data_dir, name))}
    
    for label_name, label_idx in label_map.items():
        class_dir = os.path.join(data_dir, label_name)
        for img_name in os.listdir(class_dir):
            if img_name.lower().endswith(('.png', '.jpg', '.jpeg')):
                image_paths.append(os.path.join(class_dir, img_name))
                labels.append(label_idx)
    
    return image_paths, labels, label_map

def preprocess_images(image_paths, target_size=(48, 48)):
    print(f"Loading and preprocessing {len(image_paths)} images...")
    images = []
    for path in image_paths:
        img = cv2.imread(path, cv2.IMREAD_GRAYSCALE)
        if img is not None:
            # Resize
            img_resized = cv2.resize(img, target_size)
            # Normalize pixel values
            img_normalized = img_resized.astype('float32') / 255.0
            images.append(img_normalized)
        else:
            print(f"Warning: Could not read {path}")
    return np.array(images)

def save_split_data(images, labels, output_dir, prefix):
    os.makedirs(output_dir, exist_ok=True)
    images_path = os.path.join(output_dir, f"{prefix}_images.npy")
    labels_path = os.path.join(output_dir, f"{prefix}_labels.npy")
    np.save(images_path, images)
    np.save(labels_path, labels)
    print(f"Saved {prefix} set: {images.shape[0]} samples to {output_dir}")

def main():
    download_and_extract_if_needed()
    
    # Check if raw data exists to process
    if not os.path.exists(RAW_DATA_PATH) or not os.listdir(RAW_DATA_PATH):
        print(f"Creating a small dummy set for demonstration in {RAW_DATA_PATH} since it's empty.")
        # Dummy data generation for verification purposes
        dummy_classes = ['angry', 'happy', 'sad']
        for c in dummy_classes:
            os.makedirs(os.path.join(RAW_DATA_PATH, c), exist_ok=True)
            for i in range(10): # 10 dummy images per class
                dummy_img = np.random.randint(0, 255, (48, 48), dtype=np.uint8)
                cv2.imwrite(os.path.join(RAW_DATA_PATH, c, f"dummy_{i}.png"), dummy_img)

    
    print("Collecting paths...")
    image_paths, labels, label_map = get_image_paths_and_labels(RAW_DATA_PATH)
    
    if not image_paths:
        print("No images found to process.")
        return
        
    print(f"Classes mapping: {label_map}")
    
    # Preprocess
    images = preprocess_images(image_paths, target_size=(48, 48))
    labels = np.array(labels)
    
    # Split: Train 70%, Val 15%, Test 15%
    print("Splitting datasets (70% Train, 15% Validation, 15% Test)...")
    X_train, X_temp, y_train, y_temp = train_test_split(images, labels, test_size=0.30, random_state=42, stratify=labels)
    X_val, X_test, y_val, y_test = train_test_split(X_temp, y_temp, test_size=0.50, random_state=42, stratify=y_temp)
    
    print(f"Train size: {X_train.shape[0]}")
    print(f"Validation size: {X_val.shape[0]}")
    print(f"Test size: {X_test.shape[0]}")
    
    # Save the splits
    save_split_data(X_train, y_train, PROCESSED_DATA_PATH, "train")
    save_split_data(X_val, y_val, PROCESSED_DATA_PATH, "val")
    save_split_data(X_test, y_test, PROCESSED_DATA_PATH, "test")
    
    print("Dataset preparation is complete.")

if __name__ == "__main__":
    main()
