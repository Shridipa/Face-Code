"""
leetcode_fetcher.py
Fetches FREE LeetCode problems by difficulty.
- Over-fetches to compensate for paid-only filtering
- Returns only free (isPaidOnly=False) questions
- fetch_question_content now returns a rich dict with content, snippets & test cases
"""
import httpx

LEETCODE_GQL = "https://leetcode.com/graphql"

HEADERS = {
    "Content-Type": "application/json",
    "Referer": "https://leetcode.com",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
}

GQL_LIST_QUERY = """
query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
  problemsetQuestionList: questionList(
    categorySlug: $categorySlug
    limit: $limit
    skip: $skip
    filters: $filters
  ) {
    total: totalNum
    questions: data {
      title
      titleSlug
      difficulty
      topicTags { name }
      isPaidOnly
    }
  }
}
"""

# Extended content query – now fetches code snippets + example test cases
GQL_CONTENT_QUERY = """
query questionContent($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    content
    sampleTestCase
    exampleTestcases
    codeSnippets {
      lang
      langSlug
      code
    }
    metaData
  }
}
"""

# ────────────────────────────────────────────────────────────
# Language slug map: our UI lang key → LeetCode langSlug
# ────────────────────────────────────────────────────────────
LANG_SLUG_MAP = {
    "python":     "python3",
    "javascript": "javascript",
    "typescript": "typescript",
    "java":       "java",
    "cpp":        "cpp",
}


async def fetch_question_content(title_slug: str) -> dict:
    """
    Gets the full content of a problem.
    Returns: {
        content:        str   (HTML description),
        sampleTestCase: str   (single sample input),
        exampleTestcases: str (newline-separated inputs),
        codeSnippets:   list  [{lang, langSlug, code}],
    }
    """
    payload = {
        "operationName": "questionContent",
        "query": GQL_CONTENT_QUERY,
        "variables": {"titleSlug": title_slug},
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(LEETCODE_GQL, json=payload, headers=HEADERS)
        resp.raise_for_status()
        data = resp.json()

    q = data.get("data", {}).get("question", {}) or {}
    
    # LeetCode GQL returns HTML in "content"
    description_html = q.get("content") or q.get("description") or "No description available."
    
    return {
        "description":      description_html,
        "sampleTestCase":   q.get("sampleTestCase", ""),
        "exampleTestcases": q.get("exampleTestcases", ""),
        "codeSnippets":     q.get("codeSnippets", []),
    }


def get_snippet_for_lang(snippets: list, lang: str) -> str:
    """
    Extract the code snippet for the requested language.
    Falls back to Python3 → any available snippet.
    """
    slug = LANG_SLUG_MAP.get(lang.lower(), lang.lower())
    for s in snippets:
        if s.get("langSlug") == slug:
            return s.get("code", "")
    # Fallback: python3
    for s in snippets:
        if s.get("langSlug") == "python3":
            return s.get("code", "")
    return snippets[0].get("code", "") if snippets else ""


async def fetch_leetcode_questions(
    difficulty: str = "easy",
    limit: int = 20,
    skip: int = 0,
) -> dict:
    diff_upper = difficulty.strip().upper()
    if diff_upper not in ("EASY", "MEDIUM", "HARD"):
        raise ValueError(f"Invalid difficulty '{difficulty}'.")

    # We over-fetch (4× buffer) to ensure we have enough FREE questions
    # after filtering paid-only ones out
    fetch_limit = limit * 4
    fetch_skip  = skip  * 4   # scale skip proportionally

    payload = {
        "operationName": "problemsetQuestionList",
        "query": GQL_LIST_QUERY,
        "variables": {
            "categorySlug": "",
            "limit": min(fetch_limit, 100),   # LeetCode caps at 100 per request
            "skip": fetch_skip,
            "filters": {"difficulty": diff_upper},
        },
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(LEETCODE_GQL, json=payload, headers=HEADERS)
        resp.raise_for_status()
        data = resp.json()

    raw       = data.get("data", {}).get("problemsetQuestionList", {})
    total_all = raw.get("total", 0)
    all_qs    = raw.get("questions", [])

    # ── Filter paid-only out completely ──
    free_qs = [
        {
            "title":      q["title"],
            "titleSlug":  q["titleSlug"],
            "difficulty": q["difficulty"].upper(),
            "topicTags":  [t["name"] for t in q.get("topicTags", [])],
        }
        for q in all_qs
        if not q.get("isPaidOnly", False)
    ]

    # Trim to the requested page size
    page_qs = free_qs[:limit]

    # Estimate total free questions (~70% of total based on LeetCode stats)
    estimated_free_total = int(total_all * 0.70)

    return {
        "total":      estimated_free_total,
        "questions":  page_qs,
        "difficulty": diff_upper,
        "limit":      limit,
        "skip":       skip,
        "fetched":    len(free_qs),        # how many free ones we found in this batch
    }
