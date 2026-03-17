import asyncio
import sys
import os

# Add backend to path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from leetcode_fetcher import fetch_question_content
from code_executor import run_tests

async def test_flow():
    print("--- Testing Fetcher ---")
    slug = "two-sum"
    data = await fetch_question_content(slug)
    print(f"Snippets found: {[s['langSlug'] for s in data.get('codeSnippets', [])]}")
    print(f"Sample Test Case: {data.get('sampleTestCase')}")
    
    print("\n--- Testing Python Executor ---")
    python_code = """
class Solution:
    def twoSum(self, nums, target):
        prevMap = {}
        for i, n in enumerate(nums):
            diff = target - n
            if diff in prevMap:
                return [prevMap[diff], i]
            prevMap[n] = i
"""
    results = run_tests(slug, python_code, "python")
    print(f"Python Success: {results['success']}")
    print(f"Python Output: {results['output']}")
    print(f"Markers: {results.get('line_markers')}")

    print("\n--- Testing JS Executor ---")
    js_code = """
/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    const prevMap = {};
    for (let i = 0; i < nums.length; i++) {
        const diff = target - nums[i];
        if (diff in prevMap) {
            return [prevMap[diff], i];
        }
        prevMap[nums[i]] = i;
    }
};
"""
    results = run_tests(slug, js_code, language="javascript")
    print(f"JS Success: {results['success']}")
    print(f"JS Output: {results['output']}")
    print(f"Markers: {results.get('line_markers')}")

if __name__ == "__main__":
    with open("test_results.txt", "w", encoding="utf-8") as f:
        sys.stdout = f
        asyncio.run(test_flow())

