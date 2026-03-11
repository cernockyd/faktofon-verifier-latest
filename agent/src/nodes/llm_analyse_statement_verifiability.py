import logging
from typing import NotRequired, TypedDict

from langchain.chat_models import init_chat_model
from langchain_core.messages import HumanMessage, SystemMessage

from src.schema import (
    CardStatementEnhanced,
    StatementContext,
    StatementVerifiabilityAnalysisResult,
    StatementVerifiabilityAnalysisResultEnhanced,
    StatementVerificationAnalysisEnhanced,
)
from src.validation import validate_statement_verifiability

llm_version = "openai:gpt-4.1"
llm = init_chat_model(llm_version)

statement_analysis_system_prompt = """
You are an information scientist. Your goal is to analyse a statement so a fact-checker will know, what kind of statement it is.
"""

statement_verifiability_analysis_prompt_template = """
Global Proposition Context: {global_proposition_context}

Proposition to analyse: {proposition}

Additional context: {additional_context}
"""


class LLMAnalyseStatmentVerifiabilityInput(TypedDict):
    statement: CardStatementEnhanced
    statement_context: StatementContext


class LLMAnalyseStatmentVerifiabilityOutput(TypedDict):
    statement_context: StatementContext
    statement: CardStatementEnhanced
    verifiability_analysis: StatementVerifiabilityAnalysisResultEnhanced
    verification_analysis: NotRequired[StatementVerificationAnalysisEnhanced]


def llm_analyse_statement_verifiability(
    state: LLMAnalyseStatmentVerifiabilityInput,
):
    """
    A LLM call to analyse a statement's verifiability.
    This function is also imported and used in the paralell version.
    """
    statement = state["statement"]
    context = state["statement_context"]
    proposition = statement.get("text")

    logging.info("Analyse Statement LLM call")
    human_prompt = statement_verifiability_analysis_prompt_template.format(
        global_proposition_context=context["card_title"],
        proposition=proposition,
        additional_context=" ".join(context["additional_context"]),
    )

    structured_llm = llm.with_structured_output(StatementVerifiabilityAnalysisResult)
    analysis_res = structured_llm.invoke(
        [
            SystemMessage(statement_analysis_system_prompt),
            HumanMessage(content=human_prompt),
        ]
    )
    assert isinstance(analysis_res, StatementVerifiabilityAnalysisResult)

    status = validate_statement_verifiability(analysis_res)

    analysis_enhanced = StatementVerifiabilityAnalysisResultEnhanced(
        **analysis_res.model_dump(),
        status=status,
    )
    statement["verifiability_analysis"] = analysis_enhanced

    analysis_output: LLMAnalyseStatmentVerifiabilityOutput = {
        "statement_context": context,
        "statement": statement,
        "verifiability_analysis": analysis_enhanced,
    }
    return {"analysed_statements": [analysis_output]}
