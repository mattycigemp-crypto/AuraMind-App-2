import json
from typing import Optional


def get_progress_summary(topic: Optional[str] = None) -> str:
    """Get a summary of the user's learning progress.

    Args:
        topic: Specific topic to get progress for, or None for overall summary

    Returns:
        Instructions to summarize progress
    """
    if topic:
        instruction = f"Summarize the user's learning progress specifically for '{topic}'. Include quiz scores, concepts covered, and areas for improvement."
    else:
        instruction = "Provide an overall summary of the user's learning journey. Highlight topics studied, quiz performance trends, strengths, and suggested next steps."
    
    return json.dumps({
        "action": "get_progress_summary",
        "topic": topic,
        "instruction": instruction
    })
