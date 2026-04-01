import json


def explain_concept(concept: str, detail_level: str = "standard") -> str:
    """Provide a detailed explanation of a concept.

    Args:
        concept: The concept, term, or idea to explain
        detail_level: How detailed the explanation should be - 'brief', 'standard', or 'comprehensive' (default: standard)

    Returns:
        Instructions for explaining the concept
    """
    return json.dumps({
        "action": "explain_concept",
        "concept": concept,
        "detail_level": detail_level,
        "instruction": f"Provide a {detail_level} explanation of '{concept}'. Include: 1) A clear definition, 2) Key points to understand, 3) A practical example or analogy, 4) Common misconceptions if relevant."
    })
