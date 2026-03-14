import cv2

def main():
    # Load the pre-trained Haar Cascade classifier for face detection
    # cv2.data.haarcascades contains the path to the bundled harrcascades
    cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    face_cascade = cv2.CascadeClassifier(cascade_path)

    # Open a connection to the primary webcam (index 0)
    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("Error: Could not open the webcam. Please ensure a camera is connected.")
        return

    print("Successfully opened the webcam.")
    print("Press 'q' in the video window to quit.")

    while True:
        # Read a frame from the webcam
        ret, frame = cap.read()
        if not ret:
            print("Error: Failed to capture frame from webcam.")
            break

        # Convert the frame to grayscale, which is required by the Haar Cascade
        gray_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        # Detect faces in the frame
        # scaleFactor determines how much the image size is reduced at each image scale
        # minNeighbors determines how many neighbors each candidate rectangle should have to retain it
        faces = face_cascade.detectMultiScale(
            gray_frame, 
            scaleFactor=1.1, 
            minNeighbors=5, 
            minSize=(30, 30)
        )

        # Draw bounding boxes around detected faces
        for (x, y, w, h) in faces:
            # (0, 255, 0) is Green color for the bounding box
            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)

        # Display the resulting frame
        cv2.imshow('Real-time Face Detection', frame)

        # Break the loop if the user presses the 'q' key
        if cv2.waitKey(1) & 0xFF == ord('q'):
            print("Quitting face detection...")
            break

    # Release the webcam connection and close all OpenCV windows
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
