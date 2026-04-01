from uuid import UUID

from vellum_ee.workflows.display.nodes import BaseNodeDisplay
from vellum_ee.workflows.display.nodes.types import NodeOutputDisplay, PortDisplayOverrides

from ....nodes.study_agent import StudyAgent


class StudyAgentDisplay(BaseNodeDisplay[StudyAgent]):
    node_id = UUID("3d8cee01-9565-46da-a18f-bd5dbdcd46bc")
    attribute_ids_by_name = {
        "ml_model": UUID("3d8ac878-4878-4a8b-9108-6da8f3767f49"),
        "blocks": UUID("659f9f0f-0854-434e-b37d-30c8f58bae62"),
        "prompt_inputs": UUID("f8b24f60-da29-4764-82fc-77726a6ee3ab"),
        "parameters": UUID("11e7fb8a-026f-442b-a862-358d5652ff3e"),
        "max_prompt_iterations": UUID("0bc5b2ab-7e50-4bce-a039-c2d7f97f5a72"),
        "functions": UUID("eb58380a-e2f2-4212-82c9-b81a8c10ae21"),
        "settings": UUID("10061517-3e3f-4215-b08e-5c4151d9252e"),
    }
    output_display = {
        StudyAgent.Outputs.json: NodeOutputDisplay(id=UUID("8639c9aa-6d2e-4f29-b4a0-d95874e1f8a7"), name="json"),
        StudyAgent.Outputs.text: NodeOutputDisplay(id=UUID("645a860e-1ad7-4735-99f8-79e47a7521b3"), name="text"),
        StudyAgent.Outputs.chat_history: NodeOutputDisplay(
            id=UUID("297b6ca6-a917-44a5-9a39-9a8ea42ac412"), name="chat_history"
        ),
    }
    port_displays = {StudyAgent.Ports.default: PortDisplayOverrides(id=UUID("8cc54004-36b9-4b03-89e1-d6ed2318c5de"))}
