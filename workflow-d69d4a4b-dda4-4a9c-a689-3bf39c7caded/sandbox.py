from vellum import ChatMessage, StringChatMessageContent
from vellum.workflows.inputs import DatasetRow
from vellum.workflows.sandbox import WorkflowSandboxRunner

from .inputs import Inputs
from .workflow import Workflow

dataset = [
    DatasetRow(
        label="1. Request easy quiz",
        inputs=Inputs(
            chat_history=[],
            message="I want to learn about the French Revolution. Can you give me an easy quiz to start?",
        ),
    ),
    DatasetRow(
        label="2. Answer quiz + request cards",
        inputs=Inputs(
            chat_history=[
                ChatMessage(
                    role="USER",
                    text="I want to learn about the French Revolution. Can you give me an easy quiz to start?",
                    content=StringChatMessageContent(
                        value="I want to learn about the French Revolution. Can you give me an easy quiz to start?"
                    ),
                ),
                ChatMessage(
                    role="ASSISTANT",
                    text="Great choice! Here's an easy quiz on the French Revolution:\n\n1. What year did the French Revolution begin?\na) 1776  b) 1789  c) 1799  d) 1815\n\n2. True or False: The storming of the Bastille occurred on July 14, 1789.\n\n3. What was the name of the French queen executed during the Revolution?\n\nTake your time and let me know your answers!",
                    content=StringChatMessageContent(
                        value="Great choice! Here's an easy quiz on the French Revolution:\n\n1. What year did the French Revolution begin?\na) 1776  b) 1789  c) 1799  d) 1815\n\n2. True or False: The storming of the Bastille occurred on July 14, 1789.\n\n3. What was the name of the French queen executed during the Revolution?\n\nTake your time and let me know your answers!"
                    ),
                ),
            ],
            message="1. b) 1789, 2. True, 3. Marie Antoinette. I got them all right! Can you create some flashcards about the key events?",
        ),
    ),
    DatasetRow(
        label="3. Review card + rate recall",
        inputs=Inputs(
            chat_history=[
                ChatMessage(
                    role="USER",
                    text="I want to learn about the French Revolution. Can you give me an easy quiz to start?",
                    content=StringChatMessageContent(
                        value="I want to learn about the French Revolution. Can you give me an easy quiz to start?"
                    ),
                ),
                ChatMessage(
                    role="ASSISTANT",
                    text="Great choice! Here's an easy quiz on the French Revolution:\n\n1. What year did the French Revolution begin?\na) 1776  b) 1789  c) 1799  d) 1815\n\n2. True or False: The storming of the Bastille occurred on July 14, 1789.\n\n3. What was the name of the French queen executed during the Revolution?",
                    content=StringChatMessageContent(
                        value="Great choice! Here's an easy quiz on the French Revolution:\n\n1. What year did the French Revolution begin?\na) 1776  b) 1789  c) 1799  d) 1815\n\n2. True or False: The storming of the Bastille occurred on July 14, 1789.\n\n3. What was the name of the French queen executed during the Revolution?"
                    ),
                ),
                ChatMessage(
                    role="USER",
                    text="1. b) 1789, 2. True, 3. Marie Antoinette. I got them all right! Can you create some flashcards about the key events?",
                    content=StringChatMessageContent(
                        value="1. b) 1789, 2. True, 3. Marie Antoinette. I got them all right! Can you create some flashcards about the key events?"
                    ),
                ),
                ChatMessage(
                    role="ASSISTANT",
                    text="Perfect score! 🎉 I've tracked your progress.\n\nHere are your flashcards for the French Revolution:\n\n**Card 1**\nFront: When did the French Revolution begin?\nBack: 1789\n\n**Card 2**\nFront: What event on July 14, 1789 symbolized the start of the Revolution?\nBack: The Storming of the Bastille\n\n**Card 3**\nFront: What document declared the rights of citizens during the French Revolution?\nBack: The Declaration of the Rights of Man and of the Citizen (1789)\n\nWant to review these cards now?",
                    content=StringChatMessageContent(
                        value="Perfect score! 🎉 I've tracked your progress.\n\nHere are your flashcards for the French Revolution:\n\n**Card 1**\nFront: When did the French Revolution begin?\nBack: 1789\n\n**Card 2**\nFront: What event on July 14, 1789 symbolized the start of the Revolution?\nBack: The Storming of the Bastille\n\n**Card 3**\nFront: What document declared the rights of citizens during the French Revolution?\nBack: The Declaration of the Rights of Man and of the Citizen (1789)\n\nWant to review these cards now?"
                    ),
                ),
            ],
            message="Yes, let's review! Show me the first card... okay I remember - the answer is 1789. That was easy, I'd rate it a 5.",
        ),
    ),
    DatasetRow(
        label="4. Check progress",
        inputs=Inputs(
            chat_history=[
                ChatMessage(
                    role="USER",
                    text="I want to learn about the French Revolution. Can you give me an easy quiz to start?",
                    content=StringChatMessageContent(
                        value="I want to learn about the French Revolution. Can you give me an easy quiz to start?"
                    ),
                ),
                ChatMessage(
                    role="ASSISTANT",
                    text="Great choice! Here's an easy quiz on the French Revolution...",
                    content=StringChatMessageContent(
                        value="Great choice! Here's an easy quiz on the French Revolution..."
                    ),
                ),
                ChatMessage(
                    role="USER",
                    text="1. b) 1789, 2. True, 3. Marie Antoinette. I got them all right! Can you create some flashcards?",
                    content=StringChatMessageContent(
                        value="1. b) 1789, 2. True, 3. Marie Antoinette. I got them all right! Can you create some flashcards?"
                    ),
                ),
                ChatMessage(
                    role="ASSISTANT",
                    text="Perfect score! 🎉 I've created 3 flashcards about the French Revolution.",
                    content=StringChatMessageContent(
                        value="Perfect score! 🎉 I've created 3 flashcards about the French Revolution."
                    ),
                ),
                ChatMessage(
                    role="USER",
                    text="Let's review the first card... I'd rate my recall a 5.",
                    content=StringChatMessageContent(value="Let's review the first card... I'd rate my recall a 5."),
                ),
                ChatMessage(
                    role="ASSISTANT",
                    text="Excellent! Perfect recall on 'When did the French Revolution begin?' → 1789. Since you rated it 5/5, I've scheduled this card for review in 6 days. Your ease factor is 2.6 - you're building strong memory!",
                    content=StringChatMessageContent(
                        value="Excellent! Perfect recall on 'When did the French Revolution begin?' → 1789. Since you rated it 5/5, I've scheduled this card for review in 6 days. Your ease factor is 2.6 - you're building strong memory!"
                    ),
                ),
            ],
            message="This is great! How am I doing overall? Show me my progress.",
        ),
    ),
    DatasetRow(label="Answer a question", inputs=Inputs(chat_history=[], message="What is photosynthesis?")),
    DatasetRow(label="Hard quiz", inputs=Inputs(chat_history=[], message="Give me a hard quiz on quantum mechanics")),
    DatasetRow(
        label="Explain concept (comprehensive)",
        inputs=Inputs(chat_history=[], message="Explain machine learning comprehensively, I want all the details"),
    ),
]

runner = WorkflowSandboxRunner(workflow=Workflow(), dataset=dataset)

if __name__ == "__main__":
    runner.run()
