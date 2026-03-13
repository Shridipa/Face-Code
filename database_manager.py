import sqlite3
import datetime
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "metrics.db")

class DatabaseManager:
    def __init__(self):
        """Initializes SQLite connection and creates telemetry tables."""
        # check_same_thread=False allows Flask to use the same connection across requests safely for simple inserts
        self.conn = sqlite3.connect(DB_PATH, check_same_thread=False)
        self.create_tables()

    def create_tables(self):
        cursor = self.conn.cursor()
        # Telemetry for time-series logging (emotions, confidence)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS telemetry (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                session_id TEXT,
                problem_id TEXT,
                emotion TEXT,
                confidence REAL,
                cpm REAL,
                error_rate REAL,
                is_confused BOOLEAN
            )
        ''')
        # Logs problem run completions/attempts
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS completions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                session_id TEXT,
                problem_id TEXT,
                success BOOLEAN,
                duration REAL DEFAULT 0,
                difficulty TEXT DEFAULT 'easy'
            )
        ''')
        
        try:
            cursor.execute("ALTER TABLE completions ADD COLUMN difficulty TEXT DEFAULT 'easy'")
        except sqlite3.OperationalError:
            pass # Column already exists
            
        try:
            cursor.execute("ALTER TABLE completions ADD COLUMN tags TEXT DEFAULT '[]'")
        except sqlite3.OperationalError:
            pass # Column already exists
        
        # New table for LinkedIn-style interview questions
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS questions (
                id TEXT PRIMARY KEY,
                title TEXT,
                question_text TEXT,
                difficulty TEXT,
                hints TEXT
            )
        ''')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_difficulty ON questions(difficulty)')
        self.conn.commit()

    def log_telemetry(self, session_id, problem_id, emotion, confidence, cpm, error_rate, is_confused):
        cursor = self.conn.cursor()
        cursor.execute('''
            INSERT INTO telemetry (session_id, problem_id, emotion, confidence, cpm, error_rate, is_confused)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (session_id, problem_id, emotion, confidence, cpm, error_rate, is_confused))
        self.conn.commit()

    def log_completion(self, session_id, problem_id, success, duration=0, difficulty="easy", tags=None):
        if tags is None: tags = []
        import json
        tags_json = json.dumps(tags)
        cursor = self.conn.cursor()
        cursor.execute('''
            INSERT INTO completions (session_id, problem_id, success, duration, difficulty, tags)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (session_id, problem_id, success, duration, difficulty, tags_json))
        self.conn.commit()

    def get_analytics(self):
        try:
            cursor = self.conn.cursor()
            
            # 1. Emotion distribution
            cursor.execute("SELECT emotion, COUNT(*) FROM telemetry GROUP BY emotion")
            emotion_dist = dict(cursor.fetchall())
            
            # 2. Confidence over time
            cursor.execute("SELECT timestamp, confidence FROM telemetry ORDER BY timestamp DESC LIMIT 60")
            conf_rows = cursor.fetchall()[::-1]
            
            # 3. Completion rates & Stats
            cursor.execute("SELECT success, COUNT(*) FROM completions GROUP BY success")
            from typing import Any, cast
            completion_data = cast(Any, dict(cursor.fetchall()))
            
            # 4. Total Solved
            cursor.execute("SELECT COUNT(DISTINCT problem_id) FROM completions WHERE success = 1")
            total_solved = cursor.fetchone()[0] or 0
            
            # 5. Average Time
            cursor.execute("SELECT AVG(duration) FROM completions WHERE success = 1")
            avg_time = cursor.fetchone()[0] or 0
            
            # 6. Confusion duration
            cursor.execute("SELECT COUNT(*) FROM telemetry WHERE is_confused = 1")
            confusion_frames = cursor.fetchone()[0]
            
            # Safe date parsing
            labels = []
            values = []
            for row in conf_rows:
                try:
                    # SQLite CURRENT_TIMESTAMP is 'YYYY-MM-DD HH:MM:SS'
                    val = datetime.datetime.strptime(row[0], "%Y-%m-%d %H:%M:%S").strftime("%H:%M:%S")
                    labels.append(val)
                    values.append(row[1])
                except:
                    continue

            # 7. Streak and Difficulty stats
            cursor.execute("SELECT difficulty, success FROM completions ORDER BY timestamp DESC")
            completion_history = cursor.fetchall()
            
            streak = 0
            for _, success in completion_history:
                if success: streak += 1
                else: break
            
            # Strong/Weak Points (Difficulty success rates)
            cursor.execute("""
                SELECT difficulty, 
                       SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) * 1.0 / COUNT(*) as rate
                FROM completions 
                GROUP BY difficulty
            """)
            diff_rates = dict(cursor.fetchall())
            
            # Strong/Weak Topics (Tag success rates)
            cursor.execute("SELECT tags, success FROM completions WHERE tags IS NOT NULL AND tags != '[]'")
            tag_rows = cursor.fetchall()
            
            import json
            from typing import Dict, Any
            topic_stats: Dict[str, Any] = {}
            
            for tags_json, success in tag_rows:
                try:
                    tags = json.loads(tags_json)
                    if isinstance(tags, list):
                        for ts in tags:
                            t = str(ts)
                            if t not in topic_stats:
                                topic_stats[t] = {"attempts": 0, "successes": 0}
                            topic_stats[t]["attempts"] += 1  # type: ignore
                            if success:
                                topic_stats[t]["successes"] += 1  # type: ignore
                except:
                    pass
                    
            skills_by_topic: Dict[str, float] = {}
            for topic, stats in topic_stats.items():
                if stats["attempts"] > 0:
                    skills_by_topic[topic] = stats["successes"] / stats["attempts"]
            
            return {
                "emotion_distribution": emotion_dist,
                "confidence_trend": {
                    "labels": labels,
                    "values": values
                },
                "completions": {
                    "success": completion_data.get(1) or 0,
                    "failed": completion_data.get(0) or 0,
                    "total_solved": total_solved,
                    "avg_time": round(avg_time, 1),
                    "streak": streak,
                },
                "skills": diff_rates, # By diff
                "topics": skills_by_topic, # By specific topic
                "confusion_frames": confusion_frames
            }
        except Exception as e:
            print(f"[DatabaseManager] Error getting analytics: {e}")
            return {
                "emotion_distribution": {},
                "confidence_trend": {"labels": [], "values": []},
                "completions": {"success": 0, "failed": 0, "total_solved": 0, "avg_time": 0, "streak": 0},
                "skills": {},
                "confusion_frames": 0
            }

    def add_question(self, q_id, title, text, difficulty, hints="[]"):
        cursor = self.conn.cursor()
        cursor.execute('''
            INSERT OR REPLACE INTO questions (id, title, question_text, difficulty, hints)
            VALUES (?, ?, ?, ?, ?)
        ''', (q_id, title, text, difficulty, hints))
        self.conn.commit()

    def get_questions(self, difficulty=None, page=1, per_page=10):
        cursor = self.conn.cursor()
        offset = (page - 1) * per_page
        
        if difficulty:
            cursor.execute('''
                SELECT id, title, question_text, difficulty, hints 
                FROM questions 
                WHERE difficulty = ? 
                LIMIT ? OFFSET ?
            ''', (difficulty.lower(), per_page, offset))
        else:
            cursor.execute('''
                SELECT id, title, question_text, difficulty, hints 
                FROM questions 
                LIMIT ? OFFSET ?
            ''', (per_page, offset))
        
        rows = cursor.fetchall()
        return [
            {
                "id": r[0],
                "title": r[1],
                "description": r[2],
                "difficulty": r[3],
                "hints": r[4]
            } for r in rows
        ]
