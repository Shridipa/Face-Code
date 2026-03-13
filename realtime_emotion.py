import cv2
import numpy as np
import tensorflow as tf

from tensorflow.keras.models import load_model

MODEL_PATH = "emotion_model.h5"

def main():
    print(f"Loading custom emotion model from {MODEL_PATH}...")
    try:
        model = load_model(MODEL_PATH)
        print("Model loaded successfully.")
    except Exception as e:
        print(f"Failed to load custom model from {MODEL_PATH}: {e}")
        print("Please train your model using 'python train_model.py' first.")
        return

    # Typical FER2013 label mappings or the custom subset
    # Map aligns with directories output by prepare_dataset.py alphabetically.
    # Adjust this subset map according to what you collected in data/raw!
    emotion_labels = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral']
    
    # Try fetching a known label dictionary explicitly if dummy data was built...
    # For dummy data from phase 1, it's just index 0=angry, 1=happy, 2=sad
    dummy_labels = ['angry', 'happy', 'sad']

    # Load the Haar cascade for face recognition
    cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    face_cascade = cv2.CascadeClassifier(cascade_path)

    # Open webcam stream
    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("Error: webcam not found or cannot be opened.")
        return

    print("Webcam stream started. Press 'q' to quit.")

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Failed to capture frame stream.")
            break

        # Convert to grayscale for Haar cascades + CNN which expects greyscale input (48x48x1)
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        faces = face_cascade.detectMultiScale(
            gray, 
            scaleFactor=1.1, 
            minNeighbors=5, 
            minSize=(30, 30)
        )

        for (x, y, w, h) in faces:
            # Crop to isolated face region of interest (ROI)
            roi_gray = gray[y:y+h, x:x+w]
            
            # Preprocess the ROI for prediction (resize and normalize identically to training!)
            resized = cv2.resize(roi_gray, (48, 48))
            normalized = resized / 255.0
            reshaped = np.reshape(normalized, (1, 48, 48, 1))
            
            # Predict emotion probabilities using the custom model
            prediction = model.predict(reshaped, verbose=0)
            max_index = int(np.argmax(prediction))
            
            # Fallback label string assignment
            # Incase dummy labels were trained instead of the 7 general
            if prediction.shape[1] == 3:
                emotion = dummy_labels[max_index]
            else:
                if max_index < len(emotion_labels):
                    emotion = emotion_labels[max_index]
                else:
                    emotion = f"Unknown ({max_index})"

            # Render Rectangle and textual probability
            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
            cv2.putText(
                frame, 
                emotion, 
                (x, y - 10), 
                cv2.FONT_HERSHEY_SIMPLEX, 
                0.9, 
                (255, 0, 0), 
                2,
                cv2.LINE_AA
            )

        # Show Output stream interactively
        cv2.imshow('Real-time Emotion Recognition', frame)

        # Allow quit handler
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    # Garbage Collect
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
