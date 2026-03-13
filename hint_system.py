import time
import os

from adaptive_engine import AdaptiveEngine

class RuleBasedHintSystem:
    def __init__(self, adaptive_engine: AdaptiveEngine, confusion_threshold=60.0):
        """
        Manages the timing and dispensation of predefined contextual hints.
        """
        self.adaptive_engine = adaptive_engine
        self.confusion_threshold = confusion_threshold
        self.confusion_start_time = None
        self.hints_given_idx = 0

    def update_state(self, is_confused: bool, is_inactive: bool):
        """
        Called repeatedly in the main loop. Tracks how long the developer has
        been distinctly confused or inactive.
        """
        # If the model reads "confused", or if they haven't typed for >> 10s (is_inactive)
        if is_confused or is_inactive:
            if self.confusion_start_time is None:
                self.confusion_start_time = time.time()
                self.hints_given_idx = 0 # Reset hint counter for this confusion streak
        else:
            # They are visibly doing fine (e.g. happy/neutral + typing), reset the timer.
            self.confusion_start_time = None
            self.hints_given_idx = 0

    def check_for_hint(self, current_problem_id):
        """
        Checks if the confusion timer has exceeded the threshold. 
        If so, fetches the next contextual hint from the database for the active problem.
        """
        if self.confusion_start_time is None:
            return None # Not confused

        elapsed = time.time() - self.confusion_start_time
        if elapsed > self.confusion_threshold:
            
            # Reset timeline so it takes another 60s for the next hint
            self.confusion_start_time = time.time() 
            
            return self._fetch_next_hint(current_problem_id)
        
        return None

    def _fetch_next_hint(self, problem_id):
        """Queries the JSON adaptive engine DB specifically for the next hint string."""
        # Find the problem in the DB
        for level, problems in self.adaptive_engine.problems.items():
            for prob in problems:
                if prob["id"] == problem_id:
                    hints = prob.get("hints", [])
                    if self.hints_given_idx < len(hints):
                        hint = hints[self.hints_given_idx]
                        self.hints_given_idx += 1
                        return hint
                    else:
                        return "You've exhausted all predefined hints for this problem! Consider generating an LLM hint."
        
        return "No contextual hints found for this problem ID."

if __name__ == "__main__":
    print("--- Rule-Based Hint System Demo ---")
    
    eng = AdaptiveEngine()
    hint_system = RuleBasedHintSystem(eng, confusion_threshold=2.0) # Set to 2 seconds for demo
    
    # Let's say the engine selected "easy_1"
    problem_id = "easy_1"
    
    print("User is doing fine...")
    hint_system.update_state(is_confused=False, is_inactive=False)
    time.sleep(1)
    
    print("\nUser just got confused! Waiting for threshold to cross...")
    hint_system.update_state(is_confused=True, is_inactive=True)
    
    # Wait for the threshold (2.0s)
    time.sleep(2.5)
    
    # The application polling the hint system:
    hint1 = hint_system.check_for_hint(problem_id)
    if hint1:
        print(f">> AUTOMATIC HINT TRIGGERED: {hint1}")
        
    # Wait for the threshold again (2.0s)
    time.sleep(2.5)
    hint2 = hint_system.check_for_hint(problem_id)
    if hint2:
         print(f">> AUTOMATIC HINT TRIGGERED: {hint2}")
