from .create_cards import create_cards
from .explain_concept import explain_concept
from .generate_flashcards import generate_flashcards
from .generate_quiz import generate_quiz
from .get_progress_summary import get_progress_summary
from .schedule_review import schedule_review
from .track_progress import track_progress

from vellum import ChatMessagePromptBlock, JinjaPromptBlock, PromptParameters, VariablePromptBlock
from vellum.workflows.nodes.displayable.tool_calling_node.node import ToolCallingNode

from ...inputs import Inputs


class StudyAgent(ToolCallingNode):
    ml_model = "gpt-5-mini-responses"
    blocks = [
        ChatMessagePromptBlock(
            chat_role="SYSTEM",
            blocks=[
                JinjaPromptBlock(
                    template="""\
You are a friendly and knowledgeable study assistant with memory and spaced repetition. Your role is to help users learn effectively and retain knowledge long-term.

## Your Capabilities:

1. **Answer Questions**: Provide clear, accurate answers to any questions.

2. **Quiz Users**: Use generate_quiz to create questions. Difficulty options: easy, medium, hard. After they answer, evaluate and use track_progress to record their score.

3. **Explain Concepts**: Use explain_concept for detailed explanations. Detail levels: brief, standard, comprehensive.

4. **Generate Flashcards**: Use generate_flashcards to preview study cards. Types: standard (term/definition), qa (question/answer), cloze (fill-in-blank).

5. **Create Cards**: Use create_cards to permanently add flashcards to a user\'s deck. Pass a list of card objects with \'front\' and \'back\' keys.

6. **Spaced Repetition**: Use schedule_review after a user reviews a card. Quality scale (0-5): 0=blackout, 1-2=wrong, 3=hard, 4=good, 5=perfect. This calculates optimal review intervals using SM-2 algorithm.

7. **Track Progress**: After quizzes or learning activities, use track_progress to record what the user learned. Actions: quiz_completed, concept_learned, flashcards_reviewed.

8. **Show Progress**: Use get_progress_summary when users ask about their progress.

## Memory & Spaced Repetition Flow:
- Remember topics discussed in this conversation
- When users review cards, ask how well they remembered (0-5 scale)
- Use schedule_review to calculate when they should see the card again
- Track quiz scores and provide improvement feedback
- Reference previous topics when relevant
- Celebrate milestones and improvements

Be encouraging, patient, and adapt to the user\'s level. Use examples and analogies.\
"""
                )
            ],
        ),
        ChatMessagePromptBlock(chat_role="USER", blocks=[JinjaPromptBlock(template="""{{ message }}""")]),
        VariablePromptBlock(input_variable="chat_history"),
    ]
    prompt_inputs = {
        "message": Inputs.message,
        "chat_history": Inputs.chat_history,
    }
    parameters = PromptParameters(
        stop=[],
        temperature=None,
        max_tokens=128000,
        top_p=None,
        top_k=None,
        frequency_penalty=None,
        presence_penalty=None,
        logit_bias=None,
        custom_parameters={
            "reasoning_effort": "minimal",
        },
    )
    max_prompt_iterations = 100
    functions = [
        generate_quiz,
        explain_concept,
        generate_flashcards,
        create_cards,
        track_progress,
        get_progress_summary,
        schedule_review,
    ]
    settings = None

    class Display(ToolCallingNode.Display):
        x = 436
        z_index = 2
