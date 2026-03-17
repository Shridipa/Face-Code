import requests
import time

API_URL = "http://localhost:8001/api/run_code"

# Test 1: Python
payload_python = {
    "problem_id": "two-sum",
    "language": "python",
    "code": """class Solution:
    def twoSum(self, nums, target):
        return [0, 1]
    """,
    "description": "Output: [0, 1]"
}

# Test 2: Java
payload_java = {
    "problem_id": "two-sum",
    "language": "java",
    "code": """class Solution {
    public int[] twoSum(int[] nums, int target) {
        return new int[]{0, 1};
    }
}
    """,
    "description": "Output: [0, 1]"
}

# Test 3: C++
payload_cpp = {
    "problem_id": "two-sum",
    "language": "cpp",
    "code": """class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        return {0, 1};
    }
};
    """,
    "description": "Output: [0, 1]"
}

# Test 4: C
payload_c = {
    "problem_id": "two-sum",
    "language": "c",
    "code": """int* twoSum(int* nums, int numsSize, int target, int* returnSize) {
    int* ret = malloc(2 * sizeof(int));
    ret[0]=0; ret[1]=1;
    *returnSize = 2;
    return ret;
}
    """,
    "description": "Output: [0, 1]"
}


def test_language(name, payload):
    print(f"Testing {name}...")
    try:
        r = requests.post(API_URL, json=payload, timeout=10)
        res = r.json()
        print(f"Success: {res.get('success')}")
        print(f"Output:\n{res.get('output')}\n")
    except Exception as e:
        print(f"Error for {name}: {e}")

# Allow backend to start
time.sleep(2)
test_language("Python", payload_python)
test_language("Java", payload_java)
test_language("C++", payload_cpp)
test_language("C", payload_c)
