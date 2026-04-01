import json
from typing import Optional


def track_progress(
    topic: str,
    action: str,
    score: Optional[float] = None,
    total_questions: Optional[int] = None
) -> str:
    """Track user's learning progress on a topic.

    Args:
        topic: The topic being studied
        action: What the user did - 'quiz_completed', 'concept_learned', 'flashcards_reviewed'
        score: For quizzes, the number of correct answers (optional)
        total_questions: For quizzes, the total number of questions (optional)

    Returns:
        Progress tracking confirmation
    """
    progress_data = {
        "action": "track_progress",
        "topic": topic,
        "activity": action,
    }
    
    if score is not None and total_questions is not None:
        progress_data["score"] = score
        progress_data["total"] = total_questions
        progress_data["percentage"] = round((score / total_questions) * 100, 1) if total_questions > 0 else 0
    
    progress_data["instruction"] = (
        f"Record that the user completed '{action}' on '{topic}'. "
        "Update the learning profile and provide encouraging feedback about their progress."
    )
    
    return json.dumps(progress_data)
