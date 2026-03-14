import cv2  # type: ignore
import time
import numpy as np  # type: ignore
from tensorflow.keras.models import load_model  # type: ignore

# Import our custom logic written natively for Phase 3!
from keystroke_logger import KeystrokeLogger  # type: ignore
from error_tracker import ErrorTracker  # type: ignore
from confidence_estimator import calculate_confidence_score  # type: ignore

MODEL_PATH = "emotion_model.h5"
EMOTION_LABELS = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral']
DUMMY_LABELS = ['angry', 'happy', 'sad']

def overlay_text(frame, text, pos, scale=0.7, color=(255, 255, 255), bg_color=(0, 0, 0)):
    # Helper func to add cleanly visible background rectangles for text readability
    font = cv2.FONT_HERSHEY_SIMPLEX
    thickness = 2
    text_size, _ = cv2.getTextSize(text, font, scale, thickness)
    (w, h) = text_size
    (x, y) = pos
    cv2.rectangle(frame, (x, y - h - 5), (x + w, y + 5), bg_color, -1)
    cv2.putText(frame, text, pos, font, scale, color, thickness, cv2.LINE_AA)

def main():
    print("Loading dependencies and models...")
    
    # 1. Start Loggers
    key_logger = KeystrokeLogger(inactivity_threshold=10.0)
    tracker = ErrorTracker()
    
    # Simulated execution logic for the demo (normally triggered by actual coding)
    # Give them 2 failures and 1 success to start
    tracker.log_execution("Problem_1", success=False)
    tracker.log_execution("Problem_1", success=False)
    tracker.log_execution("Problem_1", success=True)
    
    # 2. Load the NN Models
    try:
        model = load_model(MODEL_PATH)
    except Exception as e:
        print(f"Error loading model: {e}")
        return

    
    
    cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    face_cascade = cv2.CascadeClassifier(cascade_path)

    # 3. Fire up Stream
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Camera off.")
        return

    print("--- LIVE FEED STARTED - Press 'q' to quit ---")

    while True:
        ret, frame = cap.read()
        if not ret: break

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.1, 5, minSize=(30, 30))
        
        # Real-time state metrics from Loggers
        cpm = key_logger.get_cpm()
        error_rate = tracker.get_error_rate("Problem_1")
        is_inactive = key_logger.is_inactive()
        emotion_str = "neutral"  # Default if no face found

        for (x, y, w, h) in faces:
            roi_gray = gray[y:y+h, x:x+w]
            resized = cv2.resize(roi_gray, (48, 48))
            reshaped = np.reshape(resized / 255.0, (1, 48, 48, 1))

            prediction = model.predict(reshaped, verbose=0)
            max_index = int(np.argmax(prediction))
            idx = int(max_index)
            if prediction.shape[1] == 3:
                emotion_str = DUMMY_LABELS[idx] if idx < len(DUMMY_LABELS) else "Unknown"
            else:
                emotion_str = EMOTION_LABELS[idx] if idx < len(EMOTION_LABELS) else "Unknown"

            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
            cv2.putText(frame, emotion_str, (x, y - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

        # 4. Integrate Phase 3 Confidence Function
        confidence = calculate_confidence_score(emotion_str, cpm, error_rate, is_inactive)
        
        # UI Overlays
        overlay_text(frame, f"Emotion Phase: {emotion_str.upper()}", (20, 40), bg_color=(80, 0, 0))
        overlay_text(frame, f"Typing Speed: {int(cpm)} CPM", (20, 80), color=(0, 255, 0) if cpm > 0 else (200, 200, 200))
        overlay_text(frame, f"Inactivity Flag: {'YES' if is_inactive else 'NO'}", (20, 120), color=(0, 0, 255) if is_inactive else (0, 255, 0))
        overlay_text(frame, f"Compilation Errors: {error_rate:.0%}", (20, 160))
        
        # Render the Real-Time Confidence Score Box
        conf_color = (0, int(255*confidence), int(255*(1-confidence))) # Maps green (1) -> red (0)
        overlay_text(frame, f">> ENGAGEMENT SCORE: {confidence:.2f} / 1.0", (20, 220), scale=0.9, color=conf_color, bg_color=(20, 20, 20))

        cv2.imshow('FaceCode Assessment Dashboard', frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    # Cleanup
    key_logger.stop()
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
