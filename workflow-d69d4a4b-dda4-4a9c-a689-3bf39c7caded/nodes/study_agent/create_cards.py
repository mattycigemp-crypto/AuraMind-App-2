import json
from typing import Optional


def create_cards(
    topic: str,
    cards: list[dict],
    deck_name: Optional[str] = None
) -> str:
    """Create flashcards and add them to a deck for the user to study.

    Args:
        topic: The subject/topic these cards belong to
        cards: List of card objects, each with 'front' and 'back' keys
        deck_name: Optional name for the deck (defaults to topic name)

    Returns:
        JSON with created cards data for frontend to store
    """
    deck = deck_name or f"{topic} Deck"
    
    formatted_cards = []
    for i, card in enumerate(cards):
        formatted_cards.append({
            "id": f"card_{i+1}",
            "front": card.get("front", ""),
            "back": card.get("back", ""),
            "topic": topic,
            "deck": deck,
            "ease_factor": 2.5,  # Default SM-2 ease
            "interval": 0,  # New card
            "next_review": None,  # Not yet scheduled
            "created_at": "now"
        })
    
    return json.dumps({
        "action": "create_cards",
        "deck_name": deck,
        "topic": topic,
        "cards": formatted_cards,
        "total_cards": len(formatted_cards),
        "instruction": f"Created {len(formatted_cards)} flashcards in '{deck}'. Present them to the user and offer to start a study session or quiz."
    })
