"""
code_executor.py — Sandboxed Python code runner for FaceCode.

Runs user-submitted code in a subprocess with a timeout.
Validates outputs against per-problem test cases.
"""

import subprocess
import sys
import textwrap
import time

# ──────────────────────────────────────────────────────────
# TEST CASE REGISTRY
# Each entry: { "input_repr": str, "call": str, "expected": str }
# ──────────────────────────────────────────────────────────
TEST_CASES: dict[str, list[dict]] = {
    # Two Sum  (LeetCode #1)
    "two-sum": [
        {"label": "[2,7,11,15], target=9",  "call": "print(sorted(twoSum([2,7,11,15], 9)))",  "expected": "[0, 1]"},
        {"label": "[3,2,4], target=6",       "call": "print(sorted(twoSum([3,2,4], 6)))",       "expected": "[1, 2]"},
        {"label": "[3,3], target=6",          "call": "print(sorted(twoSum([3,3], 6)))",          "expected": "[0, 1]"},
    ],
    "easy_1": [  # fallback slug used by local problems
        {"label": "[2,7,11,15], target=9",  "call": "print(sorted(twoSum([2,7,11,15], 9)))",  "expected": "[0, 1]"},
        {"label": "[3,2,4], target=6",       "call": "print(sorted(twoSum([3,2,4], 6)))",       "expected": "[1, 2]"},
        {"label": "[3,3], target=6",          "call": "print(sorted(twoSum([3,3], 6)))",          "expected": "[0, 1]"},
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
}

TIMEOUT_SECONDS = 5


def _run_single(user_code: str, call_expr: str) -> tuple[str, str, float]:
    """Execute user_code + call_expr in a subprocess, return (stdout, stderr, elapsed)."""
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
        return "", f"⏱️ Time Limit Exceeded (>{TIMEOUT_SECONDS}s)", TIMEOUT_SECONDS


def run_tests(problem_id: str, user_code: str) -> dict:
    """
    Run user code against the registered test cases for problem_id.

    Returns:
        {
            "success": bool,
            "output": str,           # human-readable summary
            "test_results": [        # per-test details
                { "label", "expected", "got", "passed", "error", "runtime_ms" }
            ],
            "runtime_ms": float,
            "has_test_cases": bool
        }
    """
    cases = TEST_CASES.get(problem_id)

    # ── No registered test cases: fallback to syntax check ──
    if not cases:
        return _syntax_only(user_code)

    results = []
    total_ms = 0.0

    for tc in cases:
        stdout, stderr, elapsed_s = _run_single(user_code, tc["call"])
        ms = round(elapsed_s * 1000, 1)
        total_ms += ms
        passed = (stdout == tc["expected"]) and not stderr

        results.append({
            "label": tc["label"],
            "expected": tc["expected"],
            "got": stdout if stdout else "(no output)",
            "passed": passed,
            "error": stderr if stderr else None,
            "runtime_ms": ms,
        })

    all_passed = all(r["passed"] for r in results)
    passed_count = sum(r["passed"] for r in results)

    # ── Build console-style output string ──
    lines = [
        f"{'✅ All Test Cases Passed!' if all_passed else f'❌ {passed_count}/{len(results)} Test Cases Passed'}",
        "-" * 42,
    ]
    for i, r in enumerate(results, 1):
        icon = "✅" if r["passed"] else "❌"
        lines.append(f"{icon}  Case {i}: {r['label']}")
        if not r["passed"]:
            lines.append(f"    Expected : {r['expected']}")
            lines.append(f"    Got      : {r['got']}")
            if r["error"]:
                # Trim long tracebacks
                err_short = r["error"].splitlines()[-1] if r["error"] else ""
                lines.append(f"    Error    : {err_short}")
        lines.append(f"    Runtime  : {r['runtime_ms']} ms")

    lines.append("")
    lines.append(f"Total Runtime: {round(total_ms, 1)} ms")

    return {
        "success": all_passed,
        "output": "\n".join(lines),
        "test_results": results,
        "runtime_ms": round(total_ms, 1),
        "has_test_cases": True,
    }


def _syntax_only(user_code: str) -> dict:
    """Run a compile-only check when we have no test cases."""
    _, stderr, elapsed_s = _run_single(user_code, "pass")
    ok = not stderr

    if ok:
        output = (
            "✅ Code compiled successfully!\n"
            "------------------------------------------\n"
            "No registered test cases for this problem.\n"
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
        "success": ok,
        "output": output,
        "test_results": [],
        "runtime_ms": round(elapsed_s * 1000, 1),
        "has_test_cases": False,
    }
