class ErrorTracker:
    def __init__(self):
        """
        Manages syntax/compilation or runtime errors mapped against individual coding problems.
        Provides lookup and aggregation functions.
        """
        self.problems = {}

    def log_execution(self, problem_id, success):
        """Logs an execution attempt and whether compilation/run succeeded."""
        # Initialize default metrics for an unseen problem
        if problem_id not in self.problems:
            self.problems[problem_id] = {'attempts': 0, 'errors': 0}
            
        data = self.problems[problem_id]
        data['attempts'] += 1
        
        # If compilation/build threw an error
        if not success:
            data['errors'] += 1
            print(f"[ErrorTracker] Evaluated Error logged for problem: '{problem_id}'. Total errors: {data['errors']}")
        else:
            print(f"[ErrorTracker] Clean Success logged for problem: '{problem_id}'. Total passing: {data['attempts'] - data['errors']}")

    def get_error_rate(self, problem_id):
        """Returns error rate spanning [0.0 to 1.0] for a designated problem."""
        if problem_id not in self.problems:
            return 0.0
            
        data = self.problems[problem_id]
        if data['attempts'] == 0:
            return 0.0
            
        # Float ratio of failed attempts out of total operations.
        return data['errors'] / data['attempts']

if __name__ == "__main__":
    tracker = ErrorTracker()
    print("Simulating submissions on 'Leetcode_Two_Sum'...")
    
    # 3 Failed compilations, 1 Success
    tracker.log_execution("Leetcode_Two_Sum", success=False)
    tracker.log_execution("Leetcode_Two_Sum", success=False) 
    tracker.log_execution("Leetcode_Two_Sum", success=False)
    tracker.log_execution("Leetcode_Two_Sum", success=True)  
    
    overall_rate = tracker.get_error_rate("Leetcode_Two_Sum")
    data = tracker.problems["Leetcode_Two_Sum"]
    
    print()
    print(f"Problem: 'Leetcode_Two_Sum' Error metrics:")
    print(f"Total Submissions: {data['attempts']}")
    print(f"Total Errors: {data['errors']}")
    print(f"Aggregate Final Error Rate: {overall_rate:.2%} ({overall_rate:0.2f})")
