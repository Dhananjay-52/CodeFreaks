"""
Lightweight LLM Router for Sovereign Autonomous AI Workbench.

Flow:
User Prompt
  -> lightweight requirement detection
  -> task classification
  -> benchmark-score lookup
  -> model selection
  -> Ollama execution

Rules:
- Selects the highest-scoring local Ollama model according to configured prototype benchmark reference scores.
- Complexity is metadata only (low | medium | high) and does NOT contribute a numerical score.
- Transparent trace returned with every routing decision.
- Safe fallbacks for missing scores, vision queries, or malformed inputs.
"""

from typing import Any, Dict, List, Optional
from .config import (
    AVAILABLE_MODELS,
    BENCHMARK_SCORES,
    DEFAULT_MODEL,
    DIMENSION_WEIGHT_PRIORITY,
    SCORE_NOTE,
    SCORE_SOURCE,
    VISION_MODELS,
)
from .detector import detect_requirements


class LLMRouter:
    """Deterministic, lightweight score-based router."""

    def __init__(
        self,
        benchmark_scores: Optional[Dict[str, Dict[str, float]]] = None,
        default_model: str = DEFAULT_MODEL,
        available_models: Optional[List[str]] = None,
        vision_models: Optional[List[str]] = None,
    ):
        self.benchmark_scores = benchmark_scores or BENCHMARK_SCORES
        self.default_model = default_model
        self.available_models = available_models or AVAILABLE_MODELS
        self.vision_models = vision_models if vision_models is not None else VISION_MODELS

    def route(
        self,
        user_query: str,
        has_image: bool = False,
    ) -> Dict[str, Any]:
        """
        Analyze user query, look up reference benchmark scores, and select
        the highest-scoring local Ollama model.

        Returns transparent routing trace dict.
        """
        try:
            # 1. Deterministic requirement and task detection
            detection = detect_requirements(
                user_query,
                has_image=has_image,
            )
            task_type = detection["task_type"]
            complexity = detection["complexity"]
            requirements = detection["requirements"]
            active_requirements = detection["active_requirements"]

            # 2. Check for vision requirements fallback
            if requirements.get("vision_required"):
                if self.vision_models:
                    selected_model = self.vision_models[0]
                    reason = f"Selected vision-capable model ({selected_model}) for vision requirement."
                    return {
                        "selected_model": selected_model,
                        "task_type": task_type,
                        "complexity": complexity,
                        "requirements": requirements,
                        "active_requirements": active_requirements,
                        "scores": {m: (1.0 if m in self.vision_models else 0.0) for m in self.available_models},
                        "reason": reason,
                    }
                else:
                    return {
                        "selected_model": self.default_model,
                        "task_type": task_type,
                        "complexity": complexity,
                        "requirements": requirements,
                        "active_requirements": active_requirements,
                        "scores": {m: 0.0 for m in self.available_models},
                        "reason": f"Vision requirement detected but no vision-capable local model installed; safely falling back to default model ({self.default_model}).",
                    }

            # Filter active requirements to those present in benchmark configuration
            valid_dims = [d for d in active_requirements if d in self.benchmark_scores]
            if not valid_dims:
                # If primary task type is configured, use it
                if task_type in self.benchmark_scores:
                    valid_dims = [task_type]
                else:
                    # Unknown task fallback
                    return {
                        "selected_model": self.default_model,
                        "task_type": task_type,
                        "complexity": complexity,
                        "requirements": requirements,
                        "active_requirements": active_requirements,
                        "scores": {},
                        "reason": f"Unknown task type '{task_type}'; safely falling back to default model ({self.default_model}).",
                    }

            model_scores: Dict[str, float] = {}

            # 3. Benchmark score calculation
            if len(valid_dims) == 1:
                # Single primary requirement dimension
                dim = valid_dims[0]
                dim_scores = self.benchmark_scores.get(dim, {})

                for model in self.available_models:
                    if model in dim_scores:
                        model_scores[model] = round(dim_scores[model], 2)

                if not model_scores:
                    selected_model = self.default_model
                    reason = f"No benchmark scores available for '{dim}'; safely falling back to default model ({self.default_model})."
                else:
                    selected_model = max(model_scores.keys(), key=lambda m: model_scores[m])
                    best_score = model_scores[selected_model]
                    reason = (
                        f"Selected the highest-scoring local Ollama model ({selected_model}) "
                        f"according to the configured prototype benchmark reference scores for {dim} tasks ({best_score})."
                    )

            else:
                # Multiple requirements: calculate normalized weighted composite score
                # NOTE: Complexity is NOT included in scoring. Only actual benchmark dimensions are weighted.
                raw_weights = {d: DIMENSION_WEIGHT_PRIORITY.get(d, 0.3) for d in valid_dims}
                total_weight = sum(raw_weights.values()) or 1.0
                norm_weights = {d: w / total_weight for d, w in raw_weights.items()}

                for model in self.available_models:
                    model_score = 0.0
                    has_any_score = False
                    for d, weight in norm_weights.items():
                        dim_table = self.benchmark_scores.get(d, {})
                        if model in dim_table:
                            model_score += weight * dim_table[model]
                            has_any_score = True
                    if has_any_score:
                        model_scores[model] = round(model_score, 2)

                if not model_scores:
                    selected_model = self.default_model
                    reason = f"All scores missing for active requirements; safely falling back to default model ({self.default_model})."
                else:
                    selected_model = max(model_scores.keys(), key=lambda m: model_scores[m])
                    pct_desc = ", ".join(f"{d} {int(round(w * 100))}%" for d, w in norm_weights.items())
                    reason = (
                        f"Selected the highest-scoring local Ollama model ({selected_model}) "
                        f"according to the configured prototype benchmark reference scores "
                        f"for composite requirements ({pct_desc})."
                    )

            return {
                "selected_model": selected_model,
                "task_type": task_type,
                "complexity": complexity,
                "requirements": requirements,
                "active_requirements": active_requirements,
                "scores": model_scores,
                "reason": reason,
            }

        except Exception as exc:
            # Defensive fallback: never crash due to unexpected metadata or query issues
            return {
                "selected_model": self.default_model,
                "task_type": "general",
                "complexity": "low",
                "requirements": {
                    "coding_required": False,
                    "math_required": False,
                    "reasoning_required": False,
                    "retrieval_required": False,
                    "tool_use_required": False,
                    "vision_required": False,
                },
                "active_requirements": ["general"],
                "scores": {},
                "reason": f"Routing error encountered ({str(exc)}); safely fell back to default model ({self.default_model}).",
            }


# Singleton router instance for workbench use
router = LLMRouter()
