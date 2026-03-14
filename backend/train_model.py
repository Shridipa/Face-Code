import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.utils import to_categorical

# Required configurations
DATA_DIR = "data/processed"
MODEL_PATH = "emotion_model.h5"

def load_data(prefix):
    """Load preprocessed Numpy datasets by prefix (e.g. 'train', 'val')"""
    images_path = os.path.join(DATA_DIR, f"{prefix}_images.npy")
    labels_path = os.path.join(DATA_DIR, f"{prefix}_labels.npy")
    
    if os.path.exists(images_path) and os.path.exists(labels_path):
        X = np.load(images_path)
        y = np.load(labels_path)
        # Reshape data for CNN input: shape (samples, 48, 48, 1)
        X = X.reshape(-1, 48, 48, 1)
        return X, y
    else:
        return None, None

def build_cnn_model(num_classes):
    """Build a Convolutional Neural Network (CNN) architecture using Keras"""
    model = Sequential([
        # First Convolutional Block
        Conv2D(32, (3, 3), padding='same', activation='relu', input_shape=(48, 48, 1)),
        Conv2D(32, (3, 3), padding='same', activation='relu'),
        MaxPooling2D(pool_size=(2, 2)),
        Dropout(0.25),
        
        # Second Convolutional Block
        Conv2D(64, (3, 3), padding='same', activation='relu'),
        Conv2D(64, (3, 3), padding='same', activation='relu'),
        MaxPooling2D(pool_size=(2, 2)),
        Dropout(0.25),
        
        # Third Convolutional Block
        Conv2D(128, (3, 3), padding='same', activation='relu'),
        Conv2D(128, (3, 3), padding='same', activation='relu'),
        MaxPooling2D(pool_size=(2, 2)),
        Dropout(0.25),
        
        # Flattening and Dense Layers
        Flatten(),
        Dense(512, activation='relu'),
        Dropout(0.5),
        # Output layer with generic softmax distribution
        Dense(num_classes, activation='softmax')
    ])
    
    # Compile the model specifying optimizer, loss function and metrics
    model.compile(optimizer=Adam(learning_rate=0.0005),
                  loss='categorical_crossentropy',
                  metrics=['accuracy'])
    
    return model

def main():
    print("Loading prepared datasets...")
    X_train, y_train = load_data('train')
    X_val, y_val = load_data('val')
    
    if X_train is None or X_val is None:
        print(f"Error: Training data not found in {DATA_DIR}.")
        print("Please ensure you have run prepare_dataset.py successfully.")
        return
        
    num_classes = len(np.unique(y_train))
    print(f"Classes detected in the dataset: {num_classes}")
    
    # FER2013 data uses integer classes. Convert to Categorical (One-Hot) forms
    y_train = to_categorical(y_train, num_classes)
    y_val = to_categorical(y_val, num_classes)
    
    print("Building and Compiling Emotion Classification CNN Model...")
    model = build_cnn_model(num_classes)
    model.summary()
    
    print("Initiating training sequence...")
    # Using small epochs just to ensure the script builds the .h5 safely!
    epochs = 10
    batch_size = 64
    
    try:
        history = model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val),
            epochs=epochs,
            batch_size=batch_size,
            verbose=1
        )
        
        print(f"Saving compiled model to -> {MODEL_PATH}")
        model.save(MODEL_PATH)
        print("Model training complete and successfully saved out.")
    except Exception as e:
        print(f"An error occurred during training/saving: {e}")

if __name__ == "__main__":
    main()
