"""
Lightweight deterministic requirement and task detector.

Analyzes user prompts locally using simple keyword and pattern matching.
Does NOT call another LLM, embeddings, or ML models.
"""

import re
from typing import Any, Dict, List


# Keywords that should be matched as standalone words or exact phrases
CODING_WORDS = {
    "python", "javascript", "typescript", "java", "rust", "sql", "html", "css",
    "code", "coding", "algorithm", "debug", "reverse", "script", "regex", "array",
    "pointer", "syntax", "compile", "refactor"
}
CODING_PHRASES = [
    "linked list", "def ", "class ", "binary tree", "unit test", "time complexity", "space complexity"
]

MATH_WORDS = {
    "solve", "equation", "calculate", "math", "algebra", "calculus", "derivative",
    "integral", "arithmetic", "fraction", "multiply", "divide", "sum", "formula",
    "theorem", "geometry", "probability", "statistics", "matrix"
}

REASONING_PHRASES = [
    "explain why", "why does", "why is", "why would", "reasoning", "trade-off",
    "compare and contrast", "step-by-step", "pros and cons", "time complexity"
]
REASONING_WORDS = {
    "deduce", "deduction", "implication", "hypothesis", "counterexample"
}

QA_PHRASES = [
    "what is", "who is", "when did", "where is", "define", "how does", "summarize",
    "tell me about", "difference between"
]
QA_WORDS = {
    "explain", "describe", "overview"
}

RETRIEVAL_WORDS = {
    "search", "document", "pdf", "file", "retrieve", "lookup", "rag", "database"
}

TOOL_USE_PHRASES = [
    "run script", "execute", "terminal", "bash", "powershell", "command line"
]

VISION_WORDS = {
    "photo", "photos", "image", "images", "picture", "pictures", "screenshot", "diagram", "chart"
}
VISION_PHRASES = [
    "visualize this image", "look at this image"
]


def _has_word(words_set: set, tokens: List[str]) -> bool:
    return any(t in words_set for t in tokens)


def _has_phrase(phrases: List[str], text: str) -> bool:
    return any(p in text for p in phrases)


def detect_requirements(
    prompt: str,
    has_image: bool = False,
) -> Dict[str, Any]:
    """
    Lightweight deterministic requirement analysis for a user prompt.

    Returns:
        dict containing:
            - task_type: "coding" | "math" | "reasoning" | "QA" | "general"
            - complexity: "low" | "medium" | "high" (metadata only)
            - requirements: dict of boolean requirement flags
            - active_requirements: list of detected benchmark dimensions
    """
    cleaned = (prompt or "").strip()
    lowered = cleaned.lower()
    # Tokenize words, stripping punctuation except math operators
    tokens = re.findall(r"[a-z0-9_]+", lowered)

    # 1. Detect boolean requirements via word set / phrase matching
    has_math_symbols = bool(re.search(r"(\d+\s*[xXyYzZ]\b|[\+\-\*\/\=]\s*\d+|\b\d+\s*[\+\-\*\/]\s*\d+)", lowered))

    coding_req = _has_word(CODING_WORDS, tokens) or _has_phrase(CODING_PHRASES, lowered) or "function" in tokens
    math_req = has_math_symbols or _has_word(MATH_WORDS, tokens)
    reasoning_req = _has_phrase(REASONING_PHRASES, lowered) or _has_word(REASONING_WORDS, tokens) or "why" in tokens
    retrieval_req = _has_word(RETRIEVAL_WORDS, tokens)
    tool_req = _has_phrase(TOOL_USE_PHRASES, lowered)
    vision_req = (
    has_image
    or _has_word(VISION_WORDS, tokens)
    or _has_phrase(VISION_PHRASES, lowered)
)
    # 2. Determine primary task_type
    if coding_req:
        task_type = "coding"
    elif math_req:
        task_type = "math"
    elif "explain why" in lowered or ("why" in lowered and reasoning_req):
        task_type = "reasoning"
    elif _has_phrase(QA_PHRASES, lowered) or _has_word(QA_WORDS, tokens) or lowered.endswith("?"):
        task_type = "QA"
    elif reasoning_req:
        task_type = "reasoning"
    else:
        task_type = "general"

    # 3. Determine active benchmark dimensions for score lookup/weighting
    active_dims: List[str] = []
    if coding_req:
        active_dims.append("coding")
    if math_req:
        active_dims.append("math")
    if reasoning_req:
        active_dims.append("reasoning")
    if task_type == "QA" and "QA" not in active_dims:
        active_dims.append("QA")
    if task_type == "general" and not active_dims:
        active_dims.append("general")

    if not active_dims:
        active_dims = [task_type]

    # 4. Determine complexity (metadata only, NO numerical scoring impact)
    words = lowered.split()
    word_count = len(words)

    if word_count > 40 or (len(active_dims) >= 2 and word_count > 15):
        complexity = "high"
    elif word_count > 6 or len(active_dims) >= 2:
        complexity = "medium"
    else:
        complexity = "low"

    return {
        "task_type": task_type,
        "complexity": complexity,
        "requirements": {
            "coding_required": coding_req,
            "math_required": math_req,
            "reasoning_required": reasoning_req,
            "retrieval_required": retrieval_req,
            "tool_use_required": tool_req,
            "vision_required": vision_req,
        },
        "active_requirements": active_dims,
    }
