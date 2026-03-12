import operator
from typing import Annotated, TypedDict

from src.nodes.llm_analyse_information_source import LLMAnalyseInformationSourceOutput
from src.nodes.llm_analyse_statement_verifiability import (
    LLMAnalyseStatmentVerifiabilityOutput,
)
from src.nodes.llm_recommend_information_source import (
    LLMInformationSourceRecommendationOutput,
)
from src.schema import (
    Card,
    CardBlockReorderable,
    CardSourceEnhanced,
    CardStatementEnhanced,
    Message,
    StatementContext,
    StatementVerifiabilityAnalysisResultWrapped,
)


class OveralState(TypedDict):
    messages: list[Message]
    input_card: Card | None
    verification_list: Annotated[list[LLMAnalyseInformationSourceOutput], operator.add]
    analysed_statements: Annotated[
        list[LLMAnalyseStatmentVerifiabilityOutput], operator.add
    ]
    recommended_sources: Annotated[
        list[LLMInformationSourceRecommendationOutput], operator.add
    ]
    recommended_blocks: Annotated[list[CardBlockReorderable], operator.add]
    statement: CardStatementEnhanced | None
    verifiability_analysis: StatementVerifiabilityAnalysisResultWrapped | None
    statement_context: StatementContext | None
    informational_source: CardSourceEnhanced | None
