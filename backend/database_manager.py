import sqlite3
import datetime
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "metrics.db")

class DatabaseManager:
    def __init__(self):
        """Initializes SQLite connection and creates telemetry tables."""
        # check_same_thread=False allows Flask to use the same connection across requests safely for simple inserts
        self.conn = sqlite3.connect(DB_PATH, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row # Return dict-like objects
        self.create_tables()

    def create_tables(self):
        cursor = self.conn.cursor()
        # Users table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE,
                password_hash TEXT,
                full_name TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Telemetry for time-series logging (emotions, confidence)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS telemetry (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                session_id TEXT,
                user_id INTEGER,
                problem_id TEXT,
                emotion TEXT,
                confidence REAL,
                cpm REAL,
                error_rate REAL,
                is_confused BOOLEAN,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        # Logs problem run completions/attempts
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS completions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                session_id TEXT,
                user_id INTEGER,
                problem_id TEXT,
                success BOOLEAN,
                duration REAL DEFAULT 0,
                difficulty TEXT DEFAULT 'easy',
                tags TEXT DEFAULT '[]',
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        # Migrations for existing DBs
        try: cursor.execute("ALTER TABLE telemetry ADD COLUMN user_id INTEGER")
        except: pass
        try: cursor.execute("ALTER TABLE completions ADD COLUMN user_id INTEGER")
        except: pass
        try: cursor.execute("ALTER TABLE completions ADD COLUMN difficulty TEXT DEFAULT 'easy'")
        except: pass
        try: cursor.execute("ALTER TABLE completions ADD COLUMN tags TEXT DEFAULT '[]'")
        except: pass
        
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

    def log_telemetry(self, session_id, problem_id, emotion, confidence, cpm, error_rate, is_confused, user_id=None):
        cursor = self.conn.cursor()
        cursor.execute('''
            INSERT INTO telemetry (session_id, user_id, problem_id, emotion, confidence, cpm, error_rate, is_confused)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (session_id, user_id, problem_id, emotion, confidence, cpm, error_rate, is_confused))
        self.conn.commit()

    def log_completion(self, session_id, problem_id, success, duration=0, difficulty="easy", tags=None, user_id=None):
        if tags is None: tags = []
        import json
        tags_json = json.dumps(tags)
        cursor = self.conn.cursor()
        cursor.execute('''
            INSERT INTO completions (session_id, user_id, problem_id, success, duration, difficulty, tags)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (session_id, user_id, problem_id, success, duration, difficulty, tags_json))
        self.conn.commit()

    def get_analytics(self, user_id=None):
        try:
            cursor = self.conn.cursor()
            where_user = "WHERE user_id = ?" if user_id is not None else "WHERE 1=1"
            params = (user_id,) if user_id is not None else ()
            
            # 1. Emotion distribution
            cursor.execute(f"SELECT emotion, COUNT(*) FROM telemetry {where_user} GROUP BY emotion", params)
            emotion_dist = dict(cursor.fetchall())
            
            # 2. Confidence over time
            cursor.execute(f"SELECT timestamp, confidence FROM telemetry {where_user} ORDER BY timestamp DESC LIMIT 60", params)
            conf_rows = cursor.fetchall()[::-1]
            
            # 3. Completion rates & Stats
            cursor.execute(f"SELECT success, COUNT(*) FROM completions {where_user} GROUP BY success", params)
            from typing import Any, cast
            completion_data = cast(Any, dict(cursor.fetchall()))
            
            # 4. Total Solved
            cursor.execute(f"SELECT COUNT(DISTINCT problem_id) FROM completions {where_user} AND success = 1", params)
            total_solved = cursor.fetchone()[0] or 0
            
            # 5. Average Time
            cursor.execute(f"SELECT AVG(duration) FROM completions {where_user} AND success = 1", params)
            avg_time = cursor.fetchone()[0] or 0
            
            # 6. Confusion duration
            cursor.execute(f"SELECT COUNT(*) FROM telemetry {where_user} AND is_confused = 1", params)
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

            # Streak and Difficulty stats
            cursor.execute(f"SELECT difficulty, success FROM completions {where_user} ORDER BY timestamp DESC", params)
            completion_history = cursor.fetchall()
            
            streak = 0
            for _, success in completion_history:
                if success: streak += 1
                else: break
            
            # Strong/Weak Points (Difficulty success rates)
            cursor.execute(f"""
                SELECT difficulty, 
                       SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) * 1.0 / COUNT(*) as rate
                FROM completions 
                {where_user}
                GROUP BY difficulty
            """, params)
            diff_rates = dict(cursor.fetchall())
            
            # Strong/Weak Topics (Tag success rates)
            cursor.execute(f"SELECT tags, success FROM completions {where_user} AND tags IS NOT NULL AND tags != '[]'", params)
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
    # --- User Management ---
    def create_user(self, username, password_hash, full_name=""):
        try:
            cursor = self.conn.cursor()
            cursor.execute('''
                INSERT INTO users (username, password_hash, full_name)
                VALUES (?, ?, ?)
            ''', (username, password_hash, full_name))
            self.conn.commit()
            return cursor.lastrowid
        except sqlite3.IntegrityError:
            return None # Username taken

    def get_user_by_username(self, username):
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
        row = cursor.fetchone()
        return dict(row) if row else None

    def get_user_by_id(self, user_id):
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        return dict(row) if row else None
