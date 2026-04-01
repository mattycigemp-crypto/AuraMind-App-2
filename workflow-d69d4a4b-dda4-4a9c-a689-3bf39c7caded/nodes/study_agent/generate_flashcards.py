import json


def generate_flashcards(topic: str, num_cards: int = 5, card_type: str = "standard") -> str:
    """Generate flashcards for studying a topic.

    Args:
        topic: The subject or topic to create flashcards about
        num_cards: Number of flashcards to generate (default: 5)
        card_type: Type of cards - 'standard' (term/definition), 'qa' (question/answer), or 'cloze' (fill-in-blank) (default: standard)

    Returns:
        Instructions for generating flashcards
    """
    return json.dumps({
        "action": "generate_flashcards",
        "topic": topic,
        "num_cards": num_cards,
        "card_type": card_type,
        "instruction": f"Generate {num_cards} {card_type} flashcards about {topic}. Format each card clearly with FRONT and BACK sides. Make them concise and memorable."
    })
