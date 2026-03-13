import json
import random
import os

DB_FILENAME = "coding_problems.json"

class AdaptiveEngine:
    def __init__(self):
        """Initializes the adaptive engine, creating a dummy database of problems if none exists."""
        self.db_path = os.path.join(os.path.dirname(__file__), DB_FILENAME)
        self.levels = ["Easy", "Medium", "Hard"]
        self.current_difficulty = "Easy"
        self._ensure_database_exists()
        self.problems = self._load_problems()
        self.current_problem = None

    def _ensure_database_exists(self):
        """Generates a dummy database of coding problems if not present."""
        if not os.path.exists(self.db_path):
            sample_data = {
                "Easy": [
                    {
                        "id": "easy_1",
                        "title": "Two Sum",
                        "description": "Given an array of integers, return indices of the two numbers such that they add up to a specific target.",
                        "hints": ["Can you use a hash map to store complements?", "Brute force is O(n^2), can you do O(n)?"]
                    },
                    {
                        "id": "easy_2",
                        "title": "Reverse Integer",
                        "description": "Given a signed 32-bit integer x, return x with its digits reversed.",
                        "hints": ["Handle negative numbers separately.", "Watch out for integer overflow!"]
                    }
                ],
                "Medium": [
                    {
                        "id": "med_1",
                        "title": "Longest Substring Without Repeating",
                        "description": "Given a string s, find the length of the longest substring without repeating characters.",
                        "hints": ["Try using a sliding window approach.", "A set can help track characters in the current window."]
                    },
                    {
                        "id": "med_2",
                        "title": "Container With Most Water",
                        "description": "Given n non-negative integers a1, a2, ..., an , where each represents a point at coordinate (i, ai). Find two lines, which, together with the x-axis forms a container, such that the container contains the most water.",
                        "hints": ["Use two pointers starting at both ends.", "Always move the pointer pointing to the shorter line."]
                    }
                ],
                "Hard": [
                    {
                        "id": "hard_1",
                        "title": "Median of Two Sorted Arrays",
                        "description": "Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.",
                        "hints": ["Can you solve it in O(log(m+n)) time?", "Try binary search on the smaller array."]
                    },
                    {
                        "id": "hard_2",
                        "title": "Regular Expression Matching",
                        "description": "Given an input string s and a pattern p, implement regular expression matching with support for '.' and '*'.",
                        "hints": ["Dynamic programming is your friend here.", "Consider edge cases with leading '*'."]
                    }
                ]
            }
            with open(self.db_path, "w") as f:
                json.dump(sample_data, f, indent=4)
            print(f"[AdaptiveEngine] Created sample database at {self.db_path}")

    def _load_problems(self):
        """Loads problems from the JSON database."""
        with open(self.db_path, "r") as f:
            return json.load(f)

    def adjust_difficulty(self, confidence_score):
        """
        Adjusts the current difficulty level based on the given confidence score.
        score > 0.7: Increase difficulty
        score < 0.3: Decrease difficulty or provide hints (decreases difficulty here, hint logic handled elsewhere usually)
        """
        current_index = self.levels.index(self.current_difficulty)
        old_difficulty = self.current_difficulty

        if confidence_score > 0.7:
            # Increase difficulty if not already at max
            if current_index < len(self.levels) - 1:
                self.current_difficulty = self.levels[current_index + 1]
                print(f"[AdaptiveEngine] Confidence ({confidence_score:.2f}) > 0.7. Leveling UP: {old_difficulty} -> {self.current_difficulty}")
            else:
                print(f"[AdaptiveEngine] Confidence ({confidence_score:.2f}) > 0.7. Already at max difficulty ({self.current_difficulty}).")
                
        elif confidence_score < 0.3:
            # Decrease difficulty if not already at min
            if current_index > 0:
                self.current_difficulty = self.levels[current_index - 1]
                print(f"[AdaptiveEngine] Confidence ({confidence_score:.2f}) < 0.3. Leveling DOWN: {old_difficulty} -> {self.current_difficulty}")
            else:
                print(f"[AdaptiveEngine] Confidence ({confidence_score:.2f}) < 0.3. Struggling at min difficulty ({self.current_difficulty}). System suggests hints.")
        else:
             print(f"[AdaptiveEngine] Confidence ({confidence_score:.2f}) is stable (0.3 - 0.7). Maintaining current level: {self.current_difficulty}")
             
        return self.current_difficulty


    def select_problem(self, confidence_score):
        """
        Dynamically selects a problem based on the current confidence score.
        First, it updates the internal difficulty level.
        Then, it selects a random problem from that difficulty tier.
        If struggling (< 0.3) and already at lowest diff or just generally struggling, it attaches hints proactively.
        """
        # 1. Evaluate rules and set the new difficulty tier
        target_difficulty = self.adjust_difficulty(confidence_score)
        
        # 2. Grab the subset of problems for that tier
        available_problems = self.problems.get(target_difficulty, [])
        if not available_problems:
             return {"error": f"No problems found for difficulty {target_difficulty}"}
             
        # 3. Randomly select one (avoiding the immediate last one if possible, though simple choice here)
        selected = random.choice(available_problems)
        self.current_problem = selected
        
        # 4. Attach proactive hints if confidence is critically low (< 0.3)
        response = {
            "id": selected["id"],
            "title": selected["title"],
            "difficulty": target_difficulty,
            "description": selected["description"]
        }
        
        if confidence_score < 0.3:
             print(f"[AdaptiveEngine] Student is struggling. Attaching a hint proactively.")
             # Give them the first available hint
             if "hints" in selected and len(selected["hints"]) > 0:
                 response["suggested_hint"] = selected["hints"][0]
                 
        return response

if __name__ == "__main__":
    print("--- Testing Adaptive Engine ---")
    engine = AdaptiveEngine()
    
    # Simulate a user doing really well
    print("\nScenario 1: High Confidence (0.85)")
    prob1 = engine.select_problem(0.85)
    print(json.dumps(prob1, indent=2))
    
    # Simulate user being stable
    print("\nScenario 2: Stable/Neutral (0.50)")
    prob2 = engine.select_problem(0.50)
    print(json.dumps(prob2, indent=2))
    
    # Simulate user struggling immensely
    print("\nScenario 3: Crashing Confidence (0.15)")
    prob3 = engine.select_problem(0.15)
    print(json.dumps(prob3, indent=2))
