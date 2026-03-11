import logging

from langgraph.graph import END
from langgraph.types import Send

from src.schema import CardSourceEnhanced
from src.state import OveralState


def analyze_information_source_branch(
    state: OveralState | None,
):
    """Spawn thread nodes using Send API for each Informational Source based on shared state."""
    print("\n\nROUTING FUNCTION STATE:")
    print(state)
    print("\n\n")
    if state is None:
        logging.info("Skipped routing for statement verification due to missing state")
        return END

    sends: list[Send] = []
    for statement_analysis_output in state.get("analysed_statements", []):
        sources = statement_analysis_output["statement"].get("sources", {})
        for source_id in sources["record"]:
            source = sources["record"][source_id]
            sends.append(
                Send(
                    "llm_analyse_information_source",
                    {
                        "statement": statement_analysis_output["statement"],
                        "verifiability_analysis": statement_analysis_output[
                            "verifiability_analysis"
                        ],
                        "statement_context": statement_analysis_output[
                            "statement_context"
                        ],
                        "informational_source": CardSourceEnhanced(
                            **source,
                            source_id=source_id,
                            statement_id=statement_analysis_output["statement"][
                                "statement_id"
                            ],
                            block_id=statement_analysis_output["statement"]["block_id"],
                        ),
                    },
                )
            )
    if not sends:
        logging.info("No analysed statements with sources found to verify")
        return END

    logging.info("Routing to verify statements based on shared analysed_statements")
    return sends
