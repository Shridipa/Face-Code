"""
code_executor.py — Sandboxed Python & JavaScript code runner for FaceCode.

Runs user-submitted code in a subprocess with a timeout.
- Hardcoded test cases for common problems (keyed by titleSlug)
- Dynamic extraction from LeetCode HTML <pre> example blocks as fallback
- Returns line_number in each failed result so Monaco can place inline markers
- Supports language = "python" | "javascript"
"""

import json
import re
import shutil
import subprocess
import sys
import textwrap
import time
import tempfile
import os
from html.parser import HTMLParser

# ──────────────────────────────────────────────────────────
# TEST CASE REGISTRY
# Each entry: { "label": str, "call": str, "expected": str }
# Python call style uses print(), JS call style uses console.log()
# ──────────────────────────────────────────────────────────
PYTHON_TEST_CASES: dict = {
    # Two Sum  (LeetCode #1)
    "two-sum": [
        {"label": "[2,7,11,15], target=9",  "call": "s = Solution()\nprint(sorted(s.twoSum([2,7,11,15], 9)))",  "expected": "[0, 1]"},
        {"label": "[3,2,4], target=6",       "call": "s = Solution()\nprint(sorted(s.twoSum([3,2,4], 6)))",       "expected": "[1, 2]"},
        {"label": "[3,3], target=6",          "call": "s = Solution()\nprint(sorted(s.twoSum([3,3], 6)))",          "expected": "[0, 1]"},
    ],
    "easy_1": [
        {"label": "[2,7,11,15], target=9",  "call": "print(sorted(twoSum([2,7,11,15], 9)))",  "expected": "[0, 1]"},
        {"label": "[3,2,4], target=6",       "call": "print(sorted(twoSum([3,2,4], 6)))",       "expected": "[1, 2]"},
    ],

    # Reverse Integer  (LeetCode #7)
    "reverse-integer": [
        {"label": "x=123",  "call": "print(reverse(123))",   "expected": "321"},
        {"label": "x=-123", "call": "print(reverse(-123))",  "expected": "-321"},
        {"label": "x=120",  "call": "print(reverse(120))",   "expected": "21"},
        {"label": "x=0",    "call": "print(reverse(0))",     "expected": "0"},
    ],
    "easy_2": [
        {"label": "x=123",  "call": "print(reverse(123))",   "expected": "321"},
        {"label": "x=-123", "call": "print(reverse(-123))",  "expected": "-321"},
    ],

    # Longest Substring Without Repeating Characters  (LeetCode #3)
    "longest-substring-without-repeating-characters": [
        {"label": 's="abcabcbb"', "call": 'print(lengthOfLongestSubstring("abcabcbb"))', "expected": "3"},
        {"label": 's="bbbbb"',    "call": 'print(lengthOfLongestSubstring("bbbbb"))',    "expected": "1"},
        {"label": 's="pwwkew"',   "call": 'print(lengthOfLongestSubstring("pwwkew"))',   "expected": "3"},
    ],
    "med_1": [
        {"label": 's="abcabcbb"', "call": 'print(lengthOfLongestSubstring("abcabcbb"))', "expected": "3"},
        {"label": 's="bbbbb"',    "call": 'print(lengthOfLongestSubstring("bbbbb"))',    "expected": "1"},
    ],

    # Container With Most Water  (LeetCode #11)
    "container-with-most-water": [
        {"label": "[1,8,6,2,5,4,8,3,7]", "call": "print(maxArea([1,8,6,2,5,4,8,3,7]))", "expected": "49"},
        {"label": "[1,1]",               "call": "print(maxArea([1,1]))",               "expected": "1"},
    ],
    "med_2": [
        {"label": "[1,8,6,2,5,4,8,3,7]", "call": "print(maxArea([1,8,6,2,5,4,8,3,7]))", "expected": "49"},
    ],

    # Median of Two Sorted Arrays  (LeetCode #4)
    "median-of-two-sorted-arrays": [
        {"label": "nums1=[1,3], nums2=[2]",   "call": "print(findMedianSortedArrays([1,3],[2]))",   "expected": "2.0"},
        {"label": "nums1=[1,2], nums2=[3,4]", "call": "print(findMedianSortedArrays([1,2],[3,4]))", "expected": "2.5"},
    ],
    "hard_1": [
        {"label": "nums1=[1,3], nums2=[2]", "call": "print(findMedianSortedArrays([1,3],[2]))", "expected": "2.0"},
    ],

    # Palindrome Number (LeetCode #9)
    "palindrome-number": [
        {"label": "x=121",  "call": "print(isPalindrome(121))",  "expected": "True"},
        {"label": "x=-121", "call": "print(isPalindrome(-121))", "expected": "False"},
        {"label": "x=10",   "call": "print(isPalindrome(10))",   "expected": "False"},
    ],

    # Valid Parentheses (LeetCode #20)
    "valid-parentheses": [
        {"label": 's="()"',    "call": 'print(isValid("()"))',    "expected": "True"},
        {"label": 's="()[]{}"',"call": 'print(isValid("()[]{}"))', "expected": "True"},
        {"label": 's="(]"',    "call": 'print(isValid("(]"))',    "expected": "False"},
    ],

    # Merge Two Sorted Lists (LeetCode #21)
    "merge-two-sorted-lists": [
        {"label": "l1=[1,2,4] l2=[1,3,4]",
         "call": "class ListNode:\n    def __init__(self,v=0,n=None): self.val=v; self.next=n\ndef to_list(node):\n    r=[]\n    while node: r.append(node.val); node=node.next\n    return r\ndef mk(arr):\n    h=ListNode(0); c=h\n    for v in arr: c.next=ListNode(v); c=c.next\n    return h.next\nprint(to_list(mergeTwoLists(mk([1,2,4]),mk([1,3,4]))))",
         "expected": "[1, 1, 2, 3, 4, 4]"},
    ],

    # Climbing Stairs (LeetCode #70)
    "climbing-stairs": [
        {"label": "n=2", "call": "print(climbStairs(2))", "expected": "2"},
        {"label": "n=3", "call": "print(climbStairs(3))", "expected": "3"},
        {"label": "n=5", "call": "print(climbStairs(5))", "expected": "8"},
    ],

    # Best Time to Buy and Sell Stock (LeetCode #121)
    "best-time-to-buy-and-sell-stock": [
        {"label": "prices=[7,1,5,3,6,4]", "call": "print(maxProfit([7,1,5,3,6,4]))", "expected": "5"},
        {"label": "prices=[7,6,4,3,1]",   "call": "print(maxProfit([7,6,4,3,1]))",   "expected": "0"},
    ],

    # Maximum Subarray (LeetCode #53)
    "maximum-subarray": [
        {"label": "nums=[-2,1,-3,4,-1,2,1,-5,4]", "call": "print(maxSubArray([-2,1,-3,4,-1,2,1,-5,4]))", "expected": "6"},
        {"label": "nums=[1]",                       "call": "print(maxSubArray([1]))",                       "expected": "1"},
    ],
}

# JavaScript test cases use console.log() and JSON.stringify for complex outputs
JS_TEST_CASES: dict = {
    "two-sum": [
        {"label": "[2,7,11,15], target=9",  "call": "console.log(JSON.stringify(twoSum([2,7,11,15], 9).sort((a,b)=>a-b)))", "expected": "[0,1]"},
        {"label": "[3,2,4], target=6",       "call": "console.log(JSON.stringify(twoSum([3,2,4], 6).sort((a,b)=>a-b)))",     "expected": "[1,2]"},
        {"label": "[3,3], target=6",          "call": "console.log(JSON.stringify(twoSum([3,3], 6).sort((a,b)=>a-b)))",        "expected": "[0,1]"},
    ],
    "palindrome-number": [
        {"label": "x=121",  "call": "console.log(isPalindrome(121))",  "expected": "true"},
        {"label": "x=-121", "call": "console.log(isPalindrome(-121))", "expected": "false"},
        {"label": "x=10",   "call": "console.log(isPalindrome(10))",   "expected": "false"},
    ],
    "valid-parentheses": [
        {"label": 's="()"',    "call": 'console.log(isValid("()"))',    "expected": "true"},
        {"label": 's="()[]{}"',"call": 'console.log(isValid("()[]{}"))', "expected": "true"},
        {"label": 's="(]"',    "call": 'console.log(isValid("(]"))',    "expected": "false"},
    ],
    "climbing-stairs": [
        {"label": "n=2", "call": "console.log(climbStairs(2))", "expected": "2"},
        {"label": "n=3", "call": "console.log(climbStairs(3))", "expected": "3"},
        {"label": "n=5", "call": "console.log(climbStairs(5))", "expected": "8"},
    ],
    "best-time-to-buy-and-sell-stock": [
        {"label": "prices=[7,1,5,3,6,4]", "call": "console.log(maxProfit([7,1,5,3,6,4]))", "expected": "5"},
        {"label": "prices=[7,6,4,3,1]",   "call": "console.log(maxProfit([7,6,4,3,1]))",   "expected": "0"},
    ],
    "maximum-subarray": [
        {"label": "nums=[-2,1,-3,4,-1,2,1,-5,4]", "call": "console.log(maxSubArray([-2,1,-3,4,-1,2,1,-5,4]))", "expected": "6"},
        {"label": "nums=[1]",                       "call": "console.log(maxSubArray([1]))",                      "expected": "1"},
    ],
    "reverse-integer": [
        {"label": "x=123",  "call": "console.log(reverse(123))",   "expected": "321"},
        {"label": "x=-123", "call": "console.log(reverse(-123))",  "expected": "-321"},
        {"label": "x=120",  "call": "console.log(reverse(120))",   "expected": "21"},
    ],
    "longest-substring-without-repeating-characters": [
        {"label": 's="abcabcbb"', "call": 'console.log(lengthOfLongestSubstring("abcabcbb"))', "expected": "3"},
        {"label": 's="bbbbb"',    "call": 'console.log(lengthOfLongestSubstring("bbbbb"))',    "expected": "1"},
        {"label": 's="pwwkew"',   "call": 'console.log(lengthOfLongestSubstring("pwwkew"))',   "expected": "3"},
    ],
}

# C test cases use printf()
C_TEST_CASES: dict = {
    "two-sum": [
        {"label": "[2,7,11,15], target=9",  "call": "int a[]={2,7,11,15}; int* r = twoSum(a, 4, 9, (int[]){0}); printf(\"[%d,%d]\", r[0], r[1]);", "expected": "[0,1]"},
    ],
    "reverse-integer": [
        {"label": "x=123",  "call": "printf(\"%d\", reverse(123));",  "expected": "321"},
        {"label": "x=-123", "call": "printf(\"%d\", reverse(-123));", "expected": "-321"},
    ],
    "palindrome-number": [
        {"label": "x=121",  "call": "printf(\"%s\", isPalindrome(121) ? \"true\" : \"false\");", "expected": "true"},
    ]
}

# C++ test cases use __print helper
CPP_TEST_CASES: dict = {
    "two-sum": [
        {"label": "[2,7,11,15], target=9",  "call": "Solution s; vector<int> n={2,7,11,15}; vector<int> r = s.twoSum(n, 9); sort(r.begin(), r.end()); __print(r);", "expected": "[0,1]"},
        {"label": "[3,2,4], target=6",       "call": "Solution s; vector<int> n={3,2,4}; vector<int> r = s.twoSum(n, 6); sort(r.begin(), r.end()); __print(r);",     "expected": "[1,2]"},
    ],
    "palindrome-number": [
        {"label": "x=121",  "call": "Solution s; __print(s.isPalindrome(121) ? \"true\" : \"false\");",  "expected": "true"},
        {"label": "x=-121", "call": "Solution s; __print(s.isPalindrome(-121) ? \"true\" : \"false\");", "expected": "false"},
    ],
    "reverse-integer": [
        {"label": "x=123",  "call": "Solution s; __print(s.reverse(123));", "expected": "321"},
    ]
}

# Java test cases use __print helper
JAVA_TEST_CASES: dict = {
    "two-sum": [
        {"label": "[2,7,11,15], target=9",  "call": "Solution s = new Solution(); int[] r = s.twoSum(new int[]{2,7,11,15}, 9); Arrays.sort(r); __print(r);", "expected": "[0,1]"},
        {"label": "[3,2,4], target=6",       "call": "Solution s = new Solution(); int[] r = s.twoSum(new int[]{3,2,4}, 6); Arrays.sort(r); __print(r);",     "expected": "[1,2]"},
    ],
    "palindrome-number": [
        {"label": "x=121",  "call": "Solution s = new Solution(); __print(s.isPalindrome(121));",  "expected": "true"},
    ]
}


TIMEOUT_SECONDS = 5


# ─────────────────────────────────────────────────────────────────────────────
# HTML EXAMPLE EXTRACTOR  (stdlib only — no beautifulsoup4 needed for basics)
# ─────────────────────────────────────────────────────────────────────────────

class _TextExtractor(HTMLParser):
    """Minimal HTML → plain text (no external deps)."""
    def __init__(self):
        super().__init__()
        self.result: list = []
        self._skip = False

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"):
            self._skip = True
        if tag == "br":
            self.result.append("\n")

    def handle_endtag(self, tag):
        if tag in ("script", "style"):
            self._skip = False
        if tag in ("p", "div", "pre", "li"):
            self.result.append("\n")

    def handle_data(self, data):
        if not self._skip:
            self.result.append(data)

    def get_text(self) -> str:
        return "".join(self.result)


def _html_to_text(html: str) -> str:
    p = _TextExtractor()
    p.feed(html)
    return p.get_text()


def extract_examples(description_html: str) -> list:
    """
    Parse Input/Output pairs from LeetCode-style HTML.
    LeetCode wraps examples in <pre> blocks with lines like:
        Input: nums = [2,7,11,15], target = 9
        Output: [0,1]
    Returns list of {"input_text": str, "output_text": str}
    """
    if not description_html:
        return []

    text = _html_to_text(description_html)

    # Split on "Example N:" section markers
    sections = re.split(r'Example\s+\d+\s*[:\-]?', text, flags=re.IGNORECASE)

    examples = []
    for sec in sections[1:]:
        inp_m = re.search(
            r'Input\s*:\s*(.+?)(?=Output\s*:|Explanation\s*:|Example\s+\d|$)',
            sec, re.DOTALL | re.IGNORECASE,
        )
        out_m = re.search(
            r'Output\s*:\s*(.+?)(?=Explanation\s*:|Example\s+\d|$)',
            sec, re.DOTALL | re.IGNORECASE,
        )
        if inp_m and out_m:
            examples.append({
                "input_text":  inp_m.group(1).strip()[:300],
                "output_text": out_m.group(1).strip()[:200].splitlines()[0].strip(),
            })
    return examples


def _extract_fn_name(user_code: str, language: str = "python"):
    """Return the first function name defined in user code, or None."""
    if language == "javascript":
        # Match: var/let/const foo = function(...) or function foo(...)
        m = re.search(r'(?:var|let|const)\s+(\w+)\s*=\s*function|^function\s+(\w+)', user_code, re.MULTILINE)
        if m:
            return m.group(1) or m.group(2)
    else:
        # Match indented def for class methods or top-level def
        m = re.search(r'^\s*def\s+(\w+)\s*\(', user_code, re.MULTILINE)
        return m.group(1) if m else None
    return None


def _build_dynamic_cases(examples: list, fn_name: str, language: str = "python", user_code: str = "") -> list:
    """
    Turn raw input/output text pairs into runnable test case dicts.
    """
    cases = []
    has_solution_class = "class Solution" in user_code
    
    for ex in examples:
        inp = ex["input_text"]
        expected = ex["output_text"].strip()

        # Find all "key = value" pairs; take the RHS values
        pairs = re.findall(r'\w+\s*=\s*(.+?)(?=,\s*\w+\s*=|$)', inp)
        args_parts = [v.strip().rstrip(',') for v in pairs if v.strip()]

        if not args_parts:
            # If no "key=val" patterns, try splitting by comma for simpler formats
            args_parts = [p.strip() for p in inp.split(',') if p.strip()]
            if not args_parts: continue

        label = inp[:80]

        if language == "javascript":
            args_str = ", ".join(args_parts)
            if "var solution =" in user_code or "const solution =" in user_code:
                call = f"console.log(JSON.stringify(solution.{fn_name}({args_str})))"
            else:
                call = f"console.log(JSON.stringify({fn_name}({args_str})))"
        elif language == "java":
            parsed_args = []
            for a in args_parts:
                a = a.strip()
                if a.startswith('[') and a.endswith(']'): parsed_args.append(f"new int[]{{{a[1:-1]}}}")
                elif a.startswith('"'): parsed_args.append(a)
                else: parsed_args.append(a)
            args_str = ", ".join(parsed_args)
            call = f"Solution _s = new Solution();\n        __print(_s.{fn_name}({args_str}));"
        elif language in ["cpp", "c++"]:
            parsed_args = []
            for a in args_parts:
                a = a.strip()
                if a.startswith('[') and a.endswith(']'): parsed_args.append(f"vector<int>{{{a[1:-1]}}}")
                elif a.startswith('"'): parsed_args.append(f"string({a})")
                else: parsed_args.append(a)
            args_str = ", ".join(parsed_args)
            call = f"Solution _s;\n    __print(_s.{fn_name}({args_str}));"
        elif language == "c":
            # Just do syntax check for C for dynamic cases
            continue
        else:
            args_str = ", ".join(args_parts)
            if has_solution_class:
                call = f"s = Solution()\nprint(s.{fn_name}({args_str}))"
            else:
                call = f"print({fn_name}({args_str}))"

        cases.append({"label": label, "call": call, "expected": expected, "dynamic": True})

    return cases


# ─────────────────────────────────────────────────────────────────────────────
# LINE NUMBER EXTRACTION FROM TRACEBACKS
# ─────────────────────────────────────────────────────────────────────────────

def _extract_error_line(stderr: str, user_code_offset: int = 2) -> int | None:
    """
    Parse a Python or Node.js traceback and return the 1-based line number
    within the user's code section (subtract the boilerplate offset).
    Returns None if not determinable.
    """
    if not stderr:
        return None

    # Python: File "<string>", line N   OR   line N, in <module>
    py_matches = re.findall(r'line\s+(\d+)', stderr)
    if py_matches:
        raw = int(py_matches[-1])
        adjusted = raw - user_code_offset
        return max(1, adjusted) if adjusted > 0 else None

    # Node.js: at <anonymous>:N:C  OR  script.js:N:C
    js_matches = re.findall(r':(\d+):\d+', stderr)
    if js_matches:
        raw = int(js_matches[0])
        adjusted = raw - user_code_offset
        return max(1, adjusted) if adjusted > 0 else None

    return None


# ─────────────────────────────────────────────────────────────────────────────
# SANDBOXED CODE RUNNER
# ─────────────────────────────────────────────────────────────────────────────

def _run_python(user_code: str, call_expr: str) -> tuple:
    """Execute Python user_code + call_expr in subprocess. Returns (stdout, stderr, elapsed_s)."""
    # user code starts at line 2 (line 1 = `import sys`)
    script = textwrap.dedent(f"""\
import sys
{user_code}
{call_expr}
""")
    start = time.perf_counter()
    try:
        result = subprocess.run(
            [sys.executable, "-c", script],
            capture_output=True,
            text=True,
            encoding="utf-8",
            timeout=TIMEOUT_SECONDS,
        )
        elapsed = time.perf_counter() - start
        return result.stdout.strip(), result.stderr.strip(), elapsed
    except subprocess.TimeoutExpired:
        return "", f"⏱️ Time Limit Exceeded (>{TIMEOUT_SECONDS}s)", float(TIMEOUT_SECONDS)


def _run_javascript(user_code: str, call_expr: str) -> tuple:
    """Execute JS user_code + call_expr via Node.js subprocess. Returns (stdout, stderr, elapsed_s)."""
    node_bin = shutil.which("node") or shutil.which("nodejs")
    if not node_bin:
        return "", "Node.js is not installed or not in PATH. Cannot run JavaScript.", 0.0

    # user code starts at line 2 (line 1 is the implicit first line of the script string)
    script = f"{user_code}\n{call_expr}\n"
    start = time.perf_counter()
    try:
        result = subprocess.run(
            [node_bin, "--eval", script],
            capture_output=True,
            text=True,
            encoding="utf-8",
            timeout=TIMEOUT_SECONDS,
        )
        elapsed = time.perf_counter() - start
        return result.stdout.strip(), result.stderr.strip(), elapsed
    except subprocess.TimeoutExpired:
        return "", f"⏱️ Time Limit Exceeded (>{TIMEOUT_SECONDS}s)", float(TIMEOUT_SECONDS)


def _run_c(user_code: str, call_expr: str) -> tuple:
    script = f"#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#include <stdbool.h>\n{user_code}\n\nint main() {{\n    {call_expr}\n    return 0;\n}}"
    with tempfile.TemporaryDirectory() as temp_dir:
        src = os.path.join(temp_dir, "solution.c")
        exe = os.path.join(temp_dir, "solution.out")
        with open(src, "w") as f: f.write(script)
        c = subprocess.run(["gcc", src, "-o", exe, "-lm"], capture_output=True, text=True, encoding="utf-8")
        if c.returncode != 0: return "", "Compilation Error:\n" + c.stderr.strip(), 0.0
        start = time.perf_counter()
        try:
            r = subprocess.run([exe], capture_output=True, text=True, encoding="utf-8", timeout=TIMEOUT_SECONDS)
            return r.stdout.strip(), r.stderr.strip(), time.perf_counter() - start
        except subprocess.TimeoutExpired:
            return "", f"⏱️ Time Limit Exceeded (>{TIMEOUT_SECONDS}s)", float(TIMEOUT_SECONDS)


def _run_cpp(user_code: str, call_expr: str) -> tuple:
    script = f"""#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;
template<typename T> void __print(const vector<T>& v) {{
    cout << "["; for(size_t i=0; i<v.size(); ++i) cout << v[i] << (i==v.size()-1?"":","); cout << "]" << endl;
}}
template<typename T> void __print(const T& v) {{ cout << v << endl; }}
{user_code}
int main() {{
    {call_expr}
    return 0;
}}"""
    with tempfile.TemporaryDirectory() as temp_dir:
        src = os.path.join(temp_dir, "solution.cpp")
        exe = os.path.join(temp_dir, "solution.out")
        with open(src, "w") as f: f.write(script)
        c = subprocess.run(["g++", "-std=c++17", "-O2", src, "-o", exe], capture_output=True, text=True, encoding="utf-8")
        if c.returncode != 0: return "", "Compilation Error:\n" + c.stderr.strip(), 0.0
        start = time.perf_counter()
        try:
            r = subprocess.run([exe], capture_output=True, text=True, encoding="utf-8", timeout=TIMEOUT_SECONDS)
            return r.stdout.strip(), r.stderr.strip(), time.perf_counter() - start
        except subprocess.TimeoutExpired:
            return "", f"⏱️ Time Limit Exceeded (>{TIMEOUT_SECONDS}s)", float(TIMEOUT_SECONDS)


def _run_java(user_code: str, call_expr: str) -> tuple:
    script = f"""import java.util.*;
{user_code}
class Main {{
    static void __print(int[] arr) {{ System.out.println(Arrays.toString(arr).replace(" ", "")); }}
    static void __print(double[] arr) {{ System.out.println(Arrays.toString(arr).replace(" ", "")); }}
    static void __print(Object[] arr) {{ System.out.println(Arrays.toString(arr).replace(" ", "")); }}
    static void __print(Object o) {{ System.out.println(o); }}
    static void __print(int o) {{ System.out.println(o); }}
    static void __print(double o) {{ System.out.println(o); }}
    static void __print(boolean o) {{ System.out.println(o); }}
    public static void main(String[] args) {{
        {call_expr}
    }}
}}"""
    with tempfile.TemporaryDirectory() as temp_dir:
        src = os.path.join(temp_dir, "Main.java")
        with open(src, "w") as f: f.write(script)
        c_path = shutil.which("javac")
        if not c_path: return "", "Java Compiler (javac) not installed.", 0.0
        c = subprocess.run([c_path, src], capture_output=True, text=True, encoding="utf-8")
        if c.returncode != 0: return "", "Compilation Error:\n" + c.stderr.strip(), 0.0
        start = time.perf_counter()
        try:
            r = subprocess.run(["java", "-cp", temp_dir, "Main"], capture_output=True, text=True, encoding="utf-8", timeout=TIMEOUT_SECONDS)
            return r.stdout.strip(), r.stderr.strip(), time.perf_counter() - start
        except subprocess.TimeoutExpired:
            return "", f"⏱️ Time Limit Exceeded (>{TIMEOUT_SECONDS}s)", float(TIMEOUT_SECONDS)


def _run_single(user_code: str, call_expr: str, language: str = "python") -> tuple:
    """Dispatch to the correct language runner."""
    lang = language.lower()
    if lang == "javascript": return _run_javascript(user_code, call_expr)
    if lang == "c": return _run_c(user_code, call_expr)
    if lang in ["cpp", "c++"]: return _run_cpp(user_code, call_expr)
    if lang == "java": return _run_java(user_code, call_expr)
    return _run_python(user_code, call_expr)


def _compare_outputs(stdout: str, expected: str) -> bool:
    """Flexible comparison: exact string match or AST/JSON-normalized match."""
    if stdout == expected:
        return True
    if not stdout:
        return False
    # Try Python literal evaluation
    try:
        import ast
        if repr(ast.literal_eval(stdout)) == repr(ast.literal_eval(expected)):
            return True
    except Exception:
        pass
    # Try JSON parse (for JavaScript outputs)
    try:
        if json.loads(stdout) == json.loads(expected):
            return True
    except Exception:
        pass
    # Normalize booleans: Python True/False vs JS true/false
    norm_map = {"true": "True", "false": "False", "null": "None"}
    if norm_map.get(stdout.lower()) == expected:
        return True
    return False


def run_tests(problem_id: str, user_code: str, description_html: str = "", language: str = "python") -> dict:
    """
    Run user code against test cases.
    Priority: hardcoded → dynamic from HTML → syntax check.
    Returns dict with:
      - success: bool
      - output: str (summary text)
      - test_results: list of per-case dicts
      - runtime_ms: total runtime
      - has_test_cases: bool
      - line_markers: list of {line_number, message, severity} for Monaco
    """
    lang = language.lower()
    cases = None
    if lang == "javascript":
        cases = JS_TEST_CASES.get(problem_id)
    elif lang == "python":
        cases = PYTHON_TEST_CASES.get(problem_id)
    elif lang in ["cpp", "c++"]:
        cases = CPP_TEST_CASES.get(problem_id)
    elif lang == "java":
        cases = JAVA_TEST_CASES.get(problem_id)
    elif lang == "c":
        cases = C_TEST_CASES.get(problem_id)

    # Try dynamic extraction if no hardcoded cases
    if not cases and description_html:
        fn_name = _extract_fn_name(user_code, lang)
        if fn_name:
            examples = extract_examples(description_html)
            if examples:
                cases = _build_dynamic_cases(examples, fn_name, lang, user_code)
                if cases:
                    print(f"[CodeExecutor] Dynamic: {len(cases)} cases for '{problem_id}' ({lang})")

    if not cases:
        return _syntax_only(user_code, lang)

    results = []
    total_ms = 0.0
    line_markers = []

    for tc in cases:
        stdout, stderr, elapsed_s = _run_single(user_code, tc["call"], lang)
        ms = round(elapsed_s * 1000, 1)
        total_ms += ms

        expected = tc["expected"]
        passed = _compare_outputs(stdout, expected) and not stderr

        # Extract line number for Monaco markers
        err_line = None
        if stderr:
            # user code starts at line 2 of the temporary script
            err_line = _extract_error_line(stderr, user_code_offset=2)

        results.append({
            "label":       tc["label"],
            "expected":    expected,
            "got":         stdout if stdout else "(no output)",
            "passed":      passed,
            "error":       stderr if stderr else None,
            "runtime_ms":  ms,
            "line_number": err_line,
        })

        if not passed:
            msg = f"Test failed: expected {expected!r}, got {stdout!r}"
            if stderr:
                last_err = stderr.splitlines()[-1]
                msg = f"Error: {last_err}"
            line_markers.append({
                "line_number": err_line or 1,
                "message":     msg,
                "severity":    "error",   # "error" | "warning" | "info"
            })

    all_passed = all(r["passed"] for r in results)
    passed_count = sum(r["passed"] for r in results)

    lines = [
        "✅ All Test Cases Passed!" if all_passed else f"❌ {passed_count}/{len(results)} Test Cases Passed",
        "-" * 42,
    ]
    for i, r in enumerate(results, 1):
        icon = "✅" if r["passed"] else "❌"
        lines.append(f"{icon}  Case {i}: {r['label']}")
        if not r["passed"]:
            lines.append(f"    Expected : {r['expected']}")
            lines.append(f"    Got      : {r['got']}")
            if r["error"]:
                lines.append(f"    Error    : {r['error'].splitlines()[-1]}")
        lines.append(f"    Runtime  : {r['runtime_ms']} ms")

    lines += ["", f"Total Runtime: {round(total_ms, 1)} ms"]

    return {
        "success":        all_passed,
        "output":         "\n".join(lines),
        "test_results":   results,
        "runtime_ms":     round(total_ms, 1),
        "has_test_cases": True,
        "line_markers":   line_markers,
    }


def _syntax_only(user_code: str, language: str = "python") -> dict:
    """Fallback: syntax/runtime check only, no output validation."""
    _, stderr, elapsed_s = _run_single(user_code, "// noop" if language == "javascript" else "pass", language)
    ok = not stderr

    if ok:
        output = (
            "✅ Code compiled successfully!\n"
            "------------------------------------------\n"
            "No test cases found for this problem.\n"
            "Submit when you feel confident in your solution."
        )
    else:
        err_short = stderr.splitlines()[-1] if stderr else "Unknown error"
        output = (
            f"❌ Syntax / Runtime Error\n"
            f"------------------------------------------\n"
            f"Error: {err_short}\n\n"
            "Fix the error and try again."
        )

    line_markers = []
    if stderr:
        ln = _extract_error_line(stderr)
        line_markers.append({
            "line_number": ln or 1,
            "message":     stderr.splitlines()[-1] if stderr else "Unknown error",
            "severity":    "error",
        })

    return {
        "success":        ok,
        "output":         output,
        "test_results":   [],
        "runtime_ms":     round(elapsed_s * 1000, 1),
        "has_test_cases": False,
        "line_markers":   line_markers,
    }
