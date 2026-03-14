import time
import threading
from pynput import keyboard

class KeystrokeLogger:
    def __init__(self, inactivity_threshold=10.0):
        self.key_count = 0
        self.start_time = time.time()
        self.last_key_time = time.time()
        self.inactivity_threshold = inactivity_threshold
        self.is_active = True
        
        # Start background keyboard listener thread
        self.listener = keyboard.Listener(on_press=self.on_press)
        self.listener.start()

    def on_press(self, key):
        """Callback fired on every keystroke."""
        self.key_count += 1
        self.last_key_time = time.time()

    def get_cpm(self):
        """Calculates Characters Per Minute (CPM) since start."""
        elapsed_minutes = (time.time() - self.start_time) / 60.0
        if elapsed_minutes > 0:
            return self.key_count / elapsed_minutes
        return 0.0

    def is_inactive(self):
        """Returns True if no keystrokes have been tracked beyond the threshold threshold."""
        return (time.time() - self.last_key_time) > self.inactivity_threshold
        
    def stop(self):
        """Stops the underlying asynchronous key listener."""
        self.is_active = False
        self.listener.stop()

if __name__ == "__main__":
    print("Starting Keystroke Logger Demo...")
    print("Type anywhere. The script will calculate your CPM and warn you after 10 seconds of no typing.")
    print("Press Ctrl+C in this terminal to quit.")
    
    logger = KeystrokeLogger()
    try:
        while True:
            time.sleep(1)
            cpm = logger.get_cpm()
            inactive = logger.is_inactive()
            
            # Print over the same line for readability
            status = "INACTIVE (>10s)" if inactive else "ACTIVE          "
            print(f"\rTyping Speed: {cpm:.2f} CPM | Status: {status}", end="", flush=True)
            
    except KeyboardInterrupt:
        logger.stop()
        print("\n\nLogger arbitrarily stopped.")
