def calculate_confidence_score(emotion_label, cpm, error_rate, is_inactive):
    """
    Calculates a 'Confidence Score' ranging from 0.0 to 1.0 based on real-time factors
    from the programmer's coding environment.
    
    Formula Components:
    -------------------
    1. Base Default Modifier (0.50):
       Starts right in the middle assuming neutral behavior.
       
    2. Emotion Modifier (Range: -0.20 to +0.20):
       Emotions like 'happy' inherently boost score, while 'stressed' or 'angry' 
       significantly drop the confidence metric.
       
    3. Typing Speed Modifier (Range: 0.0 to +0.25):
       Normalized assuming a max comfortable speed of 300 CPM 
       (the faster you're writing, the more likely you clearly know what you're doing).
       
    4. Error Rate Modifier (Range: 0.0 to -0.35):
       For a 100% bug/compilation failure rate, confidence drops by -0.35.
       
    5. Inactivity Disciplinary Drop (-0.20):
       Triggered sharply if there's >10s (configurable downstream) of idling with no logic.
       
    Returns: Float bounded explicitly between 0.0 and 1.0. 
    (Where 1.0 = highly confident/capable, and 0.0 = completely stuck)
    """
    score = 0.50  
    
    # 1. EMOTION LOGIC (-/+ weighting based on human expression)
    emotion = emotion_label.lower()
    emotion_weights = {
        'happy': 0.20,
        'neutral': 0.05,
        'surprise': 0.0,
        'sad': -0.10,
        'angry': -0.20,
        'stress': -0.20,
        'stressed': -0.20,
        'confused': -0.20,
        'fear': -0.20,
        'disgust': -0.10
    }
    score += emotion_weights.get(emotion, 0.0)
    
    # 2. TYPING SPEED LOGIC (CPM proportional curve capped horizontally)
    cpm_normalized = min(cpm / 300.0, 1.0)
    score += (cpm_normalized * 0.25)
    
    # 3. COMPILATION FAILURE LOGIC (error_rate comes through ErrorTracker metric)
    score -= (error_rate * 0.35)
    
    # 4. INACTIVITY LOGIC (-0.2 if stuck on a single line of logic)
    if is_inactive:
        score -= 0.20
        
    # CLAMP BETWEEN MAX [0.0 - 1.0] LIMITS AND RETURN
    return max(0.0, min(1.0, score))


if __name__ == "__main__":
    print("--- Confidence Score Formula Tests ---")
    
    score1 = calculate_confidence_score("happy", cpm=250, error_rate=0.0, is_inactive=False)
    print(f"Scenario 1: Confident Developer (Happy + 250 CPM + 0 Errors + Active)")
    print(f"Confidence Outcome: {score1:.2f} / 1.00\n")

    score2 = calculate_confidence_score("stressed", cpm=20, error_rate=0.8, is_inactive=False)
    print(f"Scenario 2: Struggling Developer (Stressed + 20 CPM + 80% Error Rate + Active)")
    print(f"Confidence Outcome: {score2:.2f} / 1.00\n")

    score3 = calculate_confidence_score("confused", cpm=0, error_rate=0.5, is_inactive=True)
    print(f"Scenario 3: Stuck Developer (Confused + 0 CPM + 50% Error Rate + Inactive)")
    print(f"Confidence Outcome: {score3:.2f} / 1.00\n")
