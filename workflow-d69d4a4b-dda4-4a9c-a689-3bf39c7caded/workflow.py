from vellum.workflows import BaseWorkflow
from vellum.workflows.state import BaseState

from .inputs import Inputs
from .nodes.study_agent import StudyAgent


class Workflow(BaseWorkflow[Inputs, BaseState]):
    graph = StudyAgent

    class Outputs(BaseWorkflow.Outputs):
        response = StudyAgent.Outputs.text
        chat_history = StudyAgent.Outputs.chat_history
