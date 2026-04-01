import json
from datetime import datetime, timedelta


def schedule_review(
    card_front: str,
    card_back: str,
    quality: int,
    previous_interval: int = 0,
    previous_ease: float = 2.5
) -> str:
    """Schedule a flashcard review using SM-2 spaced repetition algorithm.

    Args:
        card_front: The front of the flashcard (question/term)
        card_back: The back of the flashcard (answer/definition)
        quality: How well the user remembered (0-5 scale):
                 0 = Complete blackout
                 1 = Wrong, but recognized answer
                 2 = Wrong, but answer seemed easy to recall
                 3 = Correct with serious difficulty
                 4 = Correct with some hesitation
                 5 = Perfect recall
        previous_interval: Days since last review (0 for new cards)
        previous_ease: Ease factor from last review (default 2.5 for new cards)

    Returns:
        JSON with next review date and updated card data
    """
    # SM-2 Algorithm implementation
    ease = previous_ease
    
    # Adjust ease factor based on quality
    ease = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    ease = max(1.3, ease)  # Minimum ease of 1.3
    
    # Calculate next interval
    if quality < 3:
        # Failed - reset to beginning
        interval = 1
    elif previous_interval == 0:
        # First review
        interval = 1
    elif previous_interval == 1:
        # Second review
        interval = 6
    else:
        # Subsequent reviews
        interval = round(previous_interval * ease)
    
    next_review = datetime.now() + timedelta(days=interval)
    
    return json.dumps({
        "action": "schedule_review",
        "card": {
            "front": card_front,
            "back": card_back
        },
        "review_result": {
            "quality": quality,
            "quality_label": ["Blackout", "Failed", "Hard", "Difficult", "Good", "Perfect"][quality],
            "previous_interval_days": previous_interval,
            "new_interval_days": interval,
            "ease_factor": round(ease, 2),
            "next_review_date": next_review.strftime("%Y-%m-%d")
        },
        "instruction": f"Card scheduled for review in {interval} day(s). Provide feedback based on the quality score ({quality}/5) and encourage the user."
    })
