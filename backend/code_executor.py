"""
code_executor.py — Sandboxed Python code runner for FaceCode.

Runs user-submitted code in a subprocess with a timeout.
- Hardcoded test cases for common problems (keyed by titleSlug)
- Dynamic extraction from LeetCode HTML <pre> example blocks as fallback
"""

import re
import subprocess
import sys
import textwrap
import time
from html.parser import HTMLParser

# ──────────────────────────────────────────────────────────
# TEST CASE REGISTRY
# Each entry: { "label": str, "call": str, "expected": str }
# ──────────────────────────────────────────────────────────
TEST_CASES: dict = {
    # Two Sum  (LeetCode #1)
    "two-sum": [
        {"label": "[2,7,11,15], target=9",  "call": "print(sorted(twoSum([2,7,11,15], 9)))",  "expected": "[0, 1]"},
        {"label": "[3,2,4], target=6",       "call": "print(sorted(twoSum([3,2,4], 6)))",       "expected": "[1, 2]"},
        {"label": "[3,3], target=6",          "call": "print(sorted(twoSum([3,3], 6)))",          "expected": "[0, 1]"},
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


def _extract_fn_name(user_code: str):
    """Return the first function name defined in user code, or None."""
    m = re.search(r'^def\s+(\w+)\s*\(', user_code, re.MULTILINE)
    return m.group(1) if m else None


def _build_dynamic_cases(examples: list, fn_name: str) -> list:
    """
    Turn raw input/output text pairs into runnable test case dicts.
    LeetCode inputs look like:  nums = [2,7,11,15], target = 9
    We extract RHS of each assignment as positional args.
    """
    cases = []
    for ex in examples:
        inp = ex["input_text"]
        expected = ex["output_text"].strip()

        # Find all "key = value" pairs; take the RHS values
        pairs = re.findall(r'\w+\s*=\s*(.+?)(?=,\s*\w+\s*=|$)', inp)
        args_parts = [v.strip().rstrip(',') for v in pairs if v.strip()]

        if not args_parts:
            continue

        args_str = ", ".join(args_parts)
        call = f"_r = {fn_name}({args_str})\nprint(_r)"
        label = inp[:80]

        cases.append({"label": label, "call": call, "expected": expected, "dynamic": True})

    return cases


# ─────────────────────────────────────────────────────────────────────────────
# SANDBOXED CODE RUNNER
# ─────────────────────────────────────────────────────────────────────────────

def _run_single(user_code: str, call_expr: str) -> tuple:
    """Execute user_code + call_expr in a subprocess. Returns (stdout, stderr, elapsed_s)."""
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
            timeout=TIMEOUT_SECONDS,
        )
        elapsed = time.perf_counter() - start
        return result.stdout.strip(), result.stderr.strip(), elapsed
    except subprocess.TimeoutExpired:
        return "", f"⏱️ Time Limit Exceeded (>{TIMEOUT_SECONDS}s)", float(TIMEOUT_SECONDS)


def run_tests(problem_id: str, user_code: str, description_html: str = "") -> dict:
    """
    Run user code against test cases.
    Priority: hardcoded → dynamic from HTML → syntax check.
    """
    cases = TEST_CASES.get(problem_id)

    # Try dynamic extraction if no hardcoded cases
    if not cases and description_html:
        fn_name = _extract_fn_name(user_code)
        if fn_name:
            examples = extract_examples(description_html)
            if examples:
                cases = _build_dynamic_cases(examples, fn_name)
                if cases:
                    print(f"[CodeExecutor] Dynamic: {len(cases)} cases for '{problem_id}'")

    if not cases:
        return _syntax_only(user_code)

    results = []
    total_ms = 0.0

    for tc in cases:
        stdout, stderr, elapsed_s = _run_single(user_code, tc["call"])
        ms = round(elapsed_s * 1000, 1)
        total_ms += ms

        expected = tc["expected"]
        # Flexible comparison: also try repr-matching for lists/bools
        passed = (stdout == expected) and not stderr
        if not passed and not stderr and stdout:
            # Normalize: "True"/"False" vs Python repr, list spacing, etc.
            try:
                import ast
                if repr(ast.literal_eval(stdout)) == repr(ast.literal_eval(expected)):
                    passed = True
            except Exception:
                pass

        results.append({
            "label":      tc["label"],
            "expected":   expected,
            "got":        stdout if stdout else "(no output)",
            "passed":     passed,
            "error":      stderr if stderr else None,
            "runtime_ms": ms,
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
    }


def _syntax_only(user_code: str) -> dict:
    """Fallback: syntax/runtime check only, no output validation."""
    _, stderr, elapsed_s = _run_single(user_code, "pass")
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

    return {
        "success":        ok,
        "output":         output,
        "test_results":   [],
        "runtime_ms":     round(elapsed_s * 1000, 1),
        "has_test_cases": False,
    }
