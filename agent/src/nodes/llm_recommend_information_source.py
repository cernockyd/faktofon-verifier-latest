import logging
import uuid
from datetime import datetime, timezone
from typing import TypedDict

from langchain.chat_models import init_chat_model
from langchain_core.messages import HumanMessage, SystemMessage

from src.schema import (
    CardSource,
    CardStatementEnhanced,
    InformationSourceRecommendationResult,
    StatementContext,
    StatementVerifiabilityAnalysisResult,
)
from src.utils import format_duration

llm_version = "openai:gpt-4.1"
llm = init_chat_model(llm_version)

source_recommendation_system_prompt = """
Jsi Strážce faktů a zdrojů. Tvým cílem je navrhnout zdroj pro ověření tvrzení. Navržený zdroj by měl být z co nejdůvěryhodnějších zdrojů. Pokud se týká českého prostředí, preferuj české zdroje. Vždy upřednostňuj relevanci a adekvátnost, původ, kvalitu a důvěryhodnost zdroje nad jazykem.
"""

source_recommendation_prompt_template = """
Recommend a source that supports our proposition.

Global Proposition Context: {global_proposition_context}

Proposition that we want to verify: {proposition}

Current date: {current_date}

Proposition timeframe: {proposition_timeframe}

Additional context: {additional_context}

User specification: {user_prompt}
"""


class LLMRecommendInformationSourceInput(TypedDict):
    statement: CardStatementEnhanced
    prompt: str
    verifiability_analysis: StatementVerifiabilityAnalysisResult
    statement_context: StatementContext


class LLMInformationSourceRecommendationOutput(TypedDict):
    source_id: str
    statement: CardStatementEnhanced
    recommended_source: CardSource


def llm_recommend_information_source(state: LLMRecommendInformationSourceInput):
    """
    LLM call to propose information source.
    """
    statement = state["statement"]
    verifiability_analysis = statement.get("verifiability_analysis", None)
    if verifiability_analysis is None:
        return {"recommended_sources": []}
    verifiability_analysis_data = verifiability_analysis.data
    context = state["statement_context"]
    logging.info("Thread LLM call to recommend information source")

    now_utc = datetime.now(timezone.utc)

    recommendation_prompt = source_recommendation_prompt_template.format(
        global_proposition_context=context["card_title"],
        user_prompt=state["prompt"],
        current_date=now_utc.strftime("%Y-%m-%d"),
        proposition_timeframe=format_duration(
            verifiability_analysis_data.proposition_timeframe
        )
        if verifiability_analysis_data is not None
        and verifiability_analysis_data.proposition_timeframe
        else "not specified",
        proposition=statement["text"],
        additional_context=" ".join(context["additional_context"]),
    )
    structured_llm = llm.with_structured_output(InformationSourceRecommendationResult)
    recommendation_res = structured_llm.invoke(
        [
            SystemMessage(source_recommendation_system_prompt),
            HumanMessage(content=recommendation_prompt),
        ]
    )

    assert isinstance(recommendation_res, InformationSourceRecommendationResult)

    recommendation_output: LLMInformationSourceRecommendationOutput = {
        "source_id": str(uuid.uuid4()),
        "statement": statement,
        "recommended_source": {
            "type": recommendation_res.source_level,
            "name": recommendation_res.name,
            "url": recommendation_res.url,
            "archive_url": None,
            "date": None,
            "author_type": "agent",
        },
    }

    return {"recommended_sources": [recommendation_output]}
