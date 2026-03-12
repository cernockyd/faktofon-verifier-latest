import logging

from src.schema import (
    SourcesLevelCount,
    StatementVerificationAnalysis,
    StatementVerificationAnalysisEnhanced,
)
from src.state import OveralState
from src.validation import (
    validate_statement_verification,
)


def aggregate_statement_verification_analysis(state: OveralState):
    logging.info("Aggregating verifications")

    statement_statistics: dict[str, SourcesLevelCount] = {}
    statement_supported_statistics: dict[str, SourcesLevelCount] = {}

    # collect statement statistics
    for verification in state["verification_list"]:
        statement_id = verification["informational_source"]["statement_id"]
        # init
        if statement_id not in statement_statistics:
            statement_statistics[statement_id] = {
                "primary": 0,
                "secondary": 0,
                "terciary": 0,
            }
        if statement_id not in statement_supported_statistics:
            statement_supported_statistics[statement_id] = {
                "primary": 0,
                "secondary": 0,
                "terciary": 0,
            }
        # increment
        statement_statistics[statement_id][
            verification["verification"].source_level
        ] += 1
        status = verification["verification"].status["status_code"]
        if status == "supports":
            statement_supported_statistics[statement_id][
                verification["verification"].source_level
            ] += 1

    # update analysed statements with statement statistics
    for statement in state["analysed_statements"]:
        statement_id = statement["statement"]["statement_id"]

        statement_verification: StatementVerificationAnalysis = {
            "sources_statistics": {
                "primary": 0,
                "secondary": 0,
                "terciary": 0,
            },
            "sources_supported_statistics": {
                "primary": 0,
                "secondary": 0,
                "terciary": 0,
            },
        }
        if statement_id in statement_statistics:
            statement_verification["sources_statistics"] = statement_statistics[
                statement_id
            ]
        if statement_id in statement_supported_statistics:
            statement_verification["sources_supported_statistics"] = (
                statement_supported_statistics[statement_id]
            )

        status = validate_statement_verification(statement_verification)

        statement["verification_analysis"] = StatementVerificationAnalysisEnhanced(
            **statement_verification,
            status=status,
        )

    return state
