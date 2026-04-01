import json


def generate_quiz(topic: str, num_questions: int = 3, difficulty: str = "medium") -> str:
    """Generate quiz questions on a given topic.

    Args:
        topic: The subject or topic to create quiz questions about
        num_questions: Number of questions to generate (default: 3)
        difficulty: Difficulty level - 'easy', 'medium', or 'hard' (default: medium)

    Returns:
        A formatted string with quiz questions for the user
    """
    return json.dumps({
        "action": "generate_quiz",
        "topic": topic,
        "num_questions": num_questions,
        "difficulty": difficulty,
        "instruction": f"Generate {num_questions} {difficulty} difficulty quiz questions about {topic}. Include a mix of question types (multiple choice, true/false, short answer). Format them clearly numbered."
    })
