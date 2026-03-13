
import json
from database_manager import DatabaseManager

def seed_db():
    db = DatabaseManager()
    
    # Load existing problems 
    with open("coding_problems.json", "r") as f:
        problems_data = json.load(f)

    print("Seeding database with questions...")
    
    for difficulty, questions in problems_data.items():
        for q in questions:
            q_id = q.get('id')
            title = q.get('title')
            text = q.get('description')
            hints = json.dumps(q.get('hints', []))
            
            db.add_question(q_id, title, text, difficulty.lower(), hints)
            print(f"Added: {title} ({difficulty})")

    # Add some additional LinkedIn-style questions manually
    extra_questions = [
        {
            "id": "li_easy_1",
            "title": "Reverse Words in a String",
            "description": "Given an input string, reverse the string word by word.",
            "difficulty": "easy",
            "hints": ["Try splitting the string by whitespace.", "Use a stack or reverse the array."]
        },
        {
            "id": "li_med_1",
            "title": "Search in Rotated Sorted Array",
            "description": "Given a sorted array that is rotated at some pivot, search for a specific target.",
            "difficulty": "medium",
            "hints": ["Use binary search.", "Identify which half of the array is sorted."]
        },
        {
            "id": "li_hard_1",
            "title": "LRU Cache",
            "description": "Design and implement a data structure for Least Recently Used (LRU) cache.",
            "difficulty": "hard",
            "hints": ["Use a doubly linked list and a hash map.", "O(1) time complexity for get and put."]
        }
    ]

    for q in extra_questions:
        db.add_question(q['id'], q['title'], q['description'], q['difficulty'], json.dumps(q['hints']))
        print(f"Added extra: {q['title']} ({q['difficulty']})")

    print("Database seeding complete.")

if __name__ == "__main__":
    seed_db()
