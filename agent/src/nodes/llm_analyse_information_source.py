import logging
from datetime import datetime, timezone
from typing import TypedDict

from langchain.chat_models import init_chat_model
from langchain_community.document_loaders import UnstructuredURLLoader
from langchain_core.messages import HumanMessage, SystemMessage

from src.schema import (
    CardSourceEnhanced,
    CardStatementEnhanced,
    SourceVerificationAnalysisResult,
    SourceVerificationAnalysisResultEnhanced,
    StatementContext,
    StatementVerifiabilityAnalysisResultWrapped,
)
from src.utils import format_duration
from src.validation import validate_source_verification

llm_version = "openai:gpt-4.1"
llm = init_chat_model(llm_version)

source_verification_system_prompt = """
Jsi Strážce faktů a zdrojů. Ověř každé fakt-tvrzení: pravdivost, opora ve zdroji, kvalita zdroje. Styl neřeš. Používej CRAAP (Currency, Relevance, Authority, Accuracy, Purpose).

## Vstupy
proposition - tvrzení, které je potřeba ověřit na základě přiloženého zdroje
source - přiložený zdroj

meta (topic, version, author, locale)

## Definice zdrojů

Primární: zákon, oficiální statistiky, tisková zpráva, článek instituce, open-data, vědecká studie.

Sekundární: renomovaná média/agentury, analytika s odkazy na primární.

Terciární: encyklopedie, blogy, přehledy (ne jako důkaz).

## Vstup
"""

source_verification_prompt_template = """
Global Proposition Context: {global_proposition_context}

Proposition to verify: {proposition}

Current date: {current_date}

Proposition timeframe: {proposition_timeframe}

Additional context: {additional_context}

Source content: {source_content}"""


class LLMAnalyseInformationSourceInput(TypedDict):
    statement: CardStatementEnhanced
    verifiability_analysis: StatementVerifiabilityAnalysisResultWrapped
    statement_context: StatementContext
    informational_source: CardSourceEnhanced


class LLMAnalyseInformationSourceOutput(TypedDict):
    statement: CardStatementEnhanced
    verifiability_analysis: StatementVerifiabilityAnalysisResultWrapped
    informational_source: CardSourceEnhanced
    verification: SourceVerificationAnalysisResultEnhanced


def llm_analyse_information_source(state: LLMAnalyseInformationSourceInput):
    """
    A LLM call to verify a proposition using a selected informational source.
    """
    statement = state["statement"]
    verifiability_analysis = state["verifiability_analysis"]
    info_source = state["informational_source"]
    if verifiability_analysis.data is None or info_source["url"] is None:
        return {"verification_list": []}
    context = state["statement_context"]
    logging.info("Thread LLM call to verify statement")

    now_utc = datetime.now(timezone.utc)
    # timeframe_since = get_date_before_duration(now_utc, analysis.proposition_timeframe)

    loader = UnstructuredURLLoader(urls=[info_source["url"]])
    data = loader.load()
    source_content = ""
    if len(data) == 1:
        source_content = data[0].page_content
    else:
        return {"verification_list": []}

    human_prompt = source_verification_prompt_template.format(
        global_proposition_context=context["card_title"],
        # get current date and format it
        current_date=now_utc.strftime("%Y-%m-%d"),
        # format if not None
        proposition_timeframe=format_duration(
            verifiability_analysis.data.proposition_timeframe
        )
        if verifiability_analysis.data.proposition_timeframe
        else "not specified",
        proposition=statement["text"],
        additional_context=" ".join(context["additional_context"]),
        source_content=source_content,
    )
    structured_llm = llm.with_structured_output(SourceVerificationAnalysisResult)
    verification_res = structured_llm.invoke(
        [
            SystemMessage(source_verification_system_prompt),
            HumanMessage(content=human_prompt),
        ]
    )

    assert isinstance(verification_res, SourceVerificationAnalysisResult)

    status = validate_source_verification(verification_res)

    verification_enhanced = SourceVerificationAnalysisResultEnhanced(
        **verification_res.model_dump(),
        status=status,
    )

    verification_output: LLMAnalyseInformationSourceOutput = {
        "statement": statement,
        "verifiability_analysis": state["verifiability_analysis"],
        "informational_source": info_source,
        "verification": verification_enhanced,
    }
    return {"verification_list": [verification_output]}
