from uuid import UUID

from vellum_ee.workflows.display.base import (
    EdgeDisplay,
    EntrypointDisplay,
    WorkflowInputsDisplay,
    WorkflowMetaDisplay,
    WorkflowOutputDisplay,
)
from vellum_ee.workflows.display.editor import NodeDisplayData, NodeDisplayPosition
from vellum_ee.workflows.display.workflows import BaseWorkflowDisplay

from ..inputs import Inputs
from ..nodes.study_agent import StudyAgent
from ..workflow import Workflow


class WorkflowDisplay(BaseWorkflowDisplay[Workflow]):
    workflow_display = WorkflowMetaDisplay(
        entrypoint_node_id=UUID("63884a7b-c01c-4cbc-b8d4-abe0a8796f6b"),
        entrypoint_node_source_handle_id=UUID("eba8fd73-57ab-4d7b-8f75-b54dbe5fc8ba"),
        entrypoint_node_display=NodeDisplayData(position=NodeDisplayPosition(x=-30, y=0), z_index=1),
    )
    inputs_display = {
        Inputs.chat_history: WorkflowInputsDisplay(
            id=UUID("93927a78-427a-4d05-a643-4646560b762f"), name="chat_history"
        ),
        Inputs.message: WorkflowInputsDisplay(id=UUID("2dc164d7-9512-4b68-8003-9439ea326249"), name="message"),
    }
    entrypoint_displays = {
        StudyAgent: EntrypointDisplay(
            id=UUID("63884a7b-c01c-4cbc-b8d4-abe0a8796f6b"),
            edge_display=EdgeDisplay(id=UUID("fe8b53bd-16ef-45c5-a4ca-96a7b9ce1e2e")),
        )
    }
    output_displays = {
        Workflow.Outputs.response: WorkflowOutputDisplay(
            id=UUID("6e81b6d7-e90d-4593-8082-2dd0b655f255"), name="response"
        ),
        Workflow.Outputs.chat_history: WorkflowOutputDisplay(
            id=UUID("5ebf2c00-cb24-421b-9a23-5e0e2673f1ef"), name="chat_history"
        ),
    }
