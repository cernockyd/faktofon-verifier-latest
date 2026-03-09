"""
To simplify model development this model analyses single proposition + source
tuple at time.
"""

import json
import logging
import operator
import os
import uuid
from datetime import datetime, timezone
from typing import Annotated, Any, NotRequired, TypedDict

import mlflow
import pandas as pd
from dotenv import load_dotenv

# from IPython.display import Image
from langchain.chat_models import init_chat_model
from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import END, START, StateGraph
from langgraph.types import Send
from mlflow.genai import scorer

from src.dataset import Dataset
from src.prompts import (
    source_recommendation_prompt_template,
    source_recommendation_system_prompt,
    source_verification_prompt_template,
    source_verification_system_prompt,
    statement_analysis_system_prompt,
    statement_verifiability_analysis_prompt_template,
)
from src.schema import (
    AgentCardToolRequest,
    Card,
    CardSource,
    CardSourceEnhanced,
    CardStatementEnhanced,
    InformationSourceRecommendationResult,
    Message,
    Patch,
    SourcesLevelCount,
    SourceVerificationAnalysisResult,
    SourceVerificationAnalysisResultEnhanced,
    StatementVerifiabilityAnalysisResult,
    StatementVerifiabilityAnalysisResultEnhanced,
    StatementVerificationAnalysis,
    StatementVerificationAnalysisEnhanced,
)
from src.utils import format_duration, new_record_patch
from src.validation import (
    validate_source_verification,
    validate_statement_verifiability,
    validate_statement_verification,
)

_ = load_dotenv()

llm_version = "openai:gpt-4.1"

enable_git_versioning = os.getenv("ENABLE_GIT_VERSIONING", "false").lower() == "true"
context = None

# if enable_git_versioning:
#     context = mlflow.genai.enable_git_model_versioning()

_ = mlflow.set_tracking_uri(os.getenv("MLFLOW_TRACKING_URI", "http://localhost:5000"))
_ = mlflow.set_experiment("graph development")
_ = mlflow.set_active_model(name="faktofon-verifier-v0-0-1")

# https://mlflow.org/docs/latest/ml/tracking/tracking-api/#model-management-new-in-mlflow-3
# model_params = {
#     # "statement_verifiability_analysis_prompt_template": statement_verifiability_analysis_prompt_template,
#     # "source_verification_system_prompt": source_verification_system_prompt,
#     # "source_verification_prompt_template": source_verification_prompt_template,
#     "llm": llm_version,
#     "temperature": "1.0",
#     # "git_versioning_enabled": enable_git_versioning,
# }
#
# # if context and enable_git_versioning:
# #     model_params["repository_dirty"] = getattr(
# #         getattr(context, "info", None), "dirty", None
# #     )
# #     model_params["git_commit"] = getattr(getattr(context, "info", None), "commit", None)
#
# mlflow.log_model_params(model_params)
#
mlflow.autolog()

logging.basicConfig(level=logging.INFO)

llm = init_chat_model(llm_version)


class StatementContext(TypedDict):
    card_title: str
    additional_context: list[str]


class LLMAnalyseStatmentInput(TypedDict):
    statement: CardStatementEnhanced
    statement_context: StatementContext


class LLMAnalyseStatmentOutput(TypedDict):
    statement_context: StatementContext
    statement: CardStatementEnhanced
    verifiability_analysis: StatementVerifiabilityAnalysisResultEnhanced
    verification_analysis: NotRequired[StatementVerificationAnalysisEnhanced]


class LLMVerifyStatmentOutput(TypedDict):
    statement: CardStatementEnhanced
    verifiability_analysis: StatementVerifiabilityAnalysisResult
    informational_source: CardSourceEnhanced
    verification: SourceVerificationAnalysisResultEnhanced


class LLMInformationSourceRecommendationOutput(TypedDict):
    source_id: str
    statement: CardStatementEnhanced
    recommended_source: CardSource


class OveralState(TypedDict):
    messages: list[Message]
    input_card: Card | None
    verification_list: Annotated[list[LLMVerifyStatmentOutput], operator.add]
    analysed_statements: Annotated[list[LLMAnalyseStatmentOutput], operator.add]
    recommended_sources: Annotated[
        list[LLMInformationSourceRecommendationOutput], operator.add
    ]
    statement: CardStatementEnhanced | None
    verifiability_analysis: StatementVerifiabilityAnalysisResult | None
    statement_context: StatementContext | None
    informational_source: CardSourceEnhanced | None


def preprocess(state: OveralState):
    """Preprocess the nested input structure into a list of URL and proposition tuples."""
    if state["input_card"] is None:
        logging.info("Preprocessing Skipped")
        return
    logging.info("Preprocessing")
    ## return {
    ##     "preprocess_analysis_input_list": [
    ##         {"url": url, "proposition": item["proposition"]}
    ##         for item in state["graph_input"]
    ##         for url in item["url_list"]
    ##     ]
    ## }
    return


def action_routing_function(
    state: OveralState,
):
    """Spawn a thread nodes using the Send API."""
    messages = state["messages"]
    # get last message
    last_message = messages[-1]
    message_part = last_message["parts"][0]

    if message_part["type"] != "action" or message_part["action"] not in [
        "analyze",
        "recommend_sources",
    ]:
        logging.info("Unknown message")
        return END

    card = state["input_card"]
    if card is None:
        logging.info("Skipped routing")
        return END
    logging.info("Routing statements")

    sends: list[Send] = []
    for block_id in card["blocks"]["record"]:
        for statement_id in card["blocks"]["record"][block_id]["statements"]["record"]:
            statement_enhanced = CardStatementEnhanced(
                **card["blocks"]["record"][block_id]["statements"]["record"][
                    statement_id
                ],
                statement_id=statement_id,
                block_id=block_id,
            )
            statement_context = {
                "card_title": card["title"],
                "additional_context": [],
            }
            match message_part["action"]:
                case "analyze":
                    sends.append(
                        Send(
                            "llm_analyse_statement_verifiability",
                            {
                                "statement": statement_enhanced,
                                "statement_context": statement_context,
                            },
                        )
                    )
                case "recommend_sources":
                    payload = message_part.get("payload")
                    if payload is None:
                        return  # todo: better skip
                    action_statement_id = payload.get("statement_id", None)
                    if action_statement_id == statement_id:
                        sends.append(
                            Send(
                                "llm_recommend_information_source",
                                {
                                    "statement": statement_enhanced,
                                    "statement_context": statement_context,
                                },
                            )
                        )

    return sends


def llm_analyse_statement_verifiability(
    state: LLMAnalyseStatmentInput,
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

    analysis_output: LLMAnalyseStatmentOutput = {
        "statement_context": context,
        "statement": statement,
        "verifiability_analysis": analysis_enhanced,
    }
    return {"analysed_statements": [analysis_output]}


def verify_statement_routing_function(
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


class LLMRecommendInformationSourceInput(TypedDict):
    statement: CardStatementEnhanced
    verifiability_analysis: StatementVerifiabilityAnalysisResult
    statement_context: StatementContext


def llm_recommend_information_source(state: LLMRecommendInformationSourceInput):
    """
    LLM call to propose information source.
    """
    statement = state["statement"]
    verifiability_analysis = statement.get("verifiability_analysis", None)
    context = state["statement_context"]
    logging.info("Thread LLM call to recommend information source")

    now_utc = datetime.now(timezone.utc)

    recommendation_prompt = source_recommendation_prompt_template.format(
        global_proposition_context=context["card_title"],
        current_date=now_utc.strftime("%Y-%m-%d"),
        proposition_timeframe=format_duration(
            verifiability_analysis.proposition_timeframe
        )
        if verifiability_analysis is not None
        and verifiability_analysis.proposition_timeframe
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

    logging.info("\n\nrecommended_source", recommendation_res)

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


class LLMVerifyStatmentInput(TypedDict):
    statement: CardStatementEnhanced
    verifiability_analysis: StatementVerifiabilityAnalysisResult
    statement_context: StatementContext
    informational_source: CardSourceEnhanced


def llm_analyse_information_source(state: LLMVerifyStatmentInput):
    """
    A LLM call to verify a proposition using a selected informational source.
    """
    statement = state["statement"]
    verifiability_analysis = state["verifiability_analysis"]
    context = state["statement_context"]
    info_source = state["informational_source"]
    logging.info("Thread LLM call to verify statement")

    now_utc = datetime.now(timezone.utc)
    # timeframe_since = get_date_before_duration(now_utc, analysis.proposition_timeframe)

    human_prompt = source_verification_prompt_template.format(
        global_proposition_context=context["card_title"],
        # get current date and format it
        current_date=now_utc.strftime("%Y-%m-%d"),
        # format if not None
        proposition_timeframe=format_duration(
            verifiability_analysis.proposition_timeframe
        )
        if verifiability_analysis.proposition_timeframe
        else "not specified",
        proposition=statement["text"],
        additional_context=" ".join(context["additional_context"]),
        source_url=info_source["url"],
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

    verification_output: LLMVerifyStatmentOutput = {
        "statement": statement,
        "verifiability_analysis": state["verifiability_analysis"],
        "informational_source": info_source,
        "verification": verification_enhanced,
    }
    return {"verification_list": [verification_output]}


def reconstruct_verified_card(
    original_card: Card, verification_list: list[LLMVerifyStatmentOutput]
) -> Card:
    import copy

    result_card = copy.deepcopy(original_card)

    verification_lookup: dict[
        str,
        dict[
            str,
            tuple[
                StatementVerifiabilityAnalysisResult, SourceVerificationAnalysisResult
            ],
        ],
    ] = {}

    for ver_output in verification_list:
        stmt_id = ver_output["statement"].get("id")
        source_id = ver_output["informational_source"].get("id")

        if not stmt_id or not source_id:
            logging.warning(
                f"Skipping verification without IDs: stmt_id={stmt_id}, source_id={source_id}"
            )
            continue

        if stmt_id not in verification_lookup:
            verification_lookup[stmt_id] = {}

        verification_lookup[stmt_id][source_id] = (
            ver_output[
                "verifiability_analysis"
            ],  # statement analysis (same for all sources)
            ver_output["verification"],  # Source verification (unique per source)
        )

    # Reconstruct by iterating through the card structure
    for block_id in result_card["blocks"]["order"]:
        block = result_card["blocks"]["record"][block_id]
        for statement_id in block["statements"]["record"]:
            statement = block["statements"]["record"][statement_id]

            if (
                statement_id in verification_lookup
                and verification_lookup[statement_id]
            ):
                analysis = next(iter(verification_lookup[statement_id].values()))[0]
                statement["verifiability_analysis"] = analysis

            for source_id in statement["sources"]["order"]:
                source = statement["sources"]["record"][source_id]

                if (
                    statement_id in verification_lookup
                    and source_id in verification_lookup[statement_id]
                ):
                    _, verification = verification_lookup[statement_id][source_id]
                    source["verification"] = verification

    return result_card


def aggregate_recommend_information_sources(state: OveralState):
    logging.info("Aggregating recommended sources")
    return state


def aggregate_statement_verification_analysis(state: OveralState):
    logging.info("Aggregating verifications")

    statement_statistics: dict[str, SourcesLevelCount] = {}

    # collect statement statistics
    for verification in state["verification_list"]:
        statement_id = verification["informational_source"]["statement_id"]
        if statement_id not in statement_statistics:
            # init
            statement_statistics[statement_id] = {
                "primary": 0,
                "secondary": 0,
                "terciary": 0,
            }
        # increment
        statement_statistics[statement_id][
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
            }
        }
        if statement_id in statement_statistics:
            statement_verification["sources_statistics"] = statement_statistics[
                statement_id
            ]

        status = validate_statement_verification(statement_verification)

        statement["verification_analysis"] = StatementVerificationAnalysisEnhanced(
            **statement_verification,
            status=status,
        )

    return state


def print_ver(state: OveralState):
    logging.info("Priting statements/aggregated verifications")
    print(len(state["verification_list"]))
    print(state["verification_list"])


graph_builder = StateGraph(OveralState)

_ = graph_builder.add_node("preprocess", preprocess)
_ = graph_builder.add_node(
    "llm_analyse_statement_verifiability", llm_analyse_statement_verifiability
)
_ = graph_builder.add_node(
    "llm_analyse_information_source", llm_analyse_information_source
)
_ = graph_builder.add_node(
    "llm_recommend_information_source", llm_recommend_information_source
)
_ = graph_builder.add_node(
    "aggregate_recommend_information_sources",
    aggregate_recommend_information_sources,
)
_ = graph_builder.add_node(
    "aggregate_statement_verification_analysis",
    aggregate_statement_verification_analysis,
)
_ = graph_builder.add_node("print_ver", print_ver)

_ = graph_builder.add_edge(START, "preprocess")
_ = graph_builder.add_conditional_edges("preprocess", action_routing_function)
_ = graph_builder.add_conditional_edges(
    "llm_analyse_statement_verifiability", verify_statement_routing_function
)
_ = graph_builder.add_edge(
    "llm_recommend_information_source", "aggregate_recommend_information_sources"
)
_ = graph_builder.add_edge("aggregate_recommend_information_sources", END)
_ = graph_builder.add_edge(
    "llm_analyse_information_source", "aggregate_statement_verification_analysis"
)
_ = graph_builder.add_edge("aggregate_statement_verification_analysis", "print_ver")
_ = graph_builder.add_edge("print_ver", END)

graph = graph_builder.compile()


@mlflow.trace
def predict_fn(item: Card) -> Card:
    """
    Analyse statements and verify sources using the graph.
    Returns the card with analysis attached to statements and verification attached to sources.
    """

    # leave only one item.blocks for faster testing and in the block, only one statement
    # if len(item["blocks"]) > 1:
    #     item["blocks"] = [item["blocks"][0]]
    # if len(item["blocks"][0]["statements"]) > 1:
    #     item["blocks"][0]["statements"] = [item["blocks"][0]["statements"][0]]

    logging.info(f"Processing card: {item['title']}")
    # logging.info(
    #     f"Blocks: {len(item['blocks'])}, "
    #     f"Statements: {sum(len(b['statements']) for b in item['blocks'])}, "
    #     f"Sources: {sum(len(s.get('sources', [])) for b in item['blocks'] for s in b['statements'])}"
    # )

    state = graph.invoke(
        {
            "messages": [],
            "input_card": item,
            "verification_list": [],
            "recommended_sources": [],
            "analysed_statements": [],
            "statement": None,
            "verifiability_analysis": None,
            "statement_context": None,
            "informational_source": None,
        }
    )

    # Reconstruct the card with nested results
    verified_card = reconstruct_verified_card(
        original_card=item, verification_list=state["verification_list"]
    )

    logging.info(
        f"Completed processing: {len(state['verification_list'])} verifications"
    )
    return verified_card


async def event_stream(request: AgentCardToolRequest):

    async for update in graph.astream(
        input={
            "messages": request["messages"],
            "input_card": request["data"]["card"],
            "verification_list": [],
            "analysed_statements": [],
            "recommended_sources": [],
            "statement": None,
            "verifiability_analysis": None,
            "statement_context": None,
            "informational_source": None,
        },
        stream_mode="updates",
    ):
        keys = list(update.keys())

        if "llm_recommend_information_source" in keys:
            recommendation_output = update["llm_recommend_information_source"][
                "recommended_sources"
            ][0]
            source_id = recommendation_output["source_id"]
            statement = recommendation_output["statement"]
            recommended_source = recommendation_output["recommended_source"]
            patch = new_record_patch(
                [
                    "blocks",
                    "record",
                    statement["block_id"],
                    "statements",
                    "record",
                    statement["statement_id"],
                    "sources",
                ],
                source_id,
                recommended_source,
            )
            yield f"[{patch[0].model_dump_json()}, {patch[1].model_dump_json()}]\n"

        if "llm_analyse_statement_verifiability" in keys:
            statement = update["llm_analyse_statement_verifiability"][
                "analysed_statements"
            ][0]["statement"]
            patch = Patch(
                op="replace",
                path=[
                    "blocks",
                    "record",
                    statement["block_id"],
                    "statements",
                    "record",
                    statement["statement_id"],
                    "verifiability_analysis",
                ],
                value=statement["verifiability_analysis"],
            )
            yield f"[{patch.model_dump_json()}]\n"

        if "llm_analyse_information_source" in keys:
            verification = update["llm_analyse_information_source"][
                "verification_list"
            ][0]
            patch = Patch(
                op="replace",
                path=[
                    "blocks",
                    "record",
                    verification["informational_source"]["block_id"],
                    "statements",
                    "record",
                    verification["informational_source"]["statement_id"],
                    "sources",
                    "record",
                    verification["informational_source"]["source_id"],
                    "verification",
                ],
                value=verification["verification"],
            )
            yield f"[{patch.model_dump_json()}]\n"

        if "aggregate_statement_verification_analysis" in keys:
            statements = update["aggregate_statement_verification_analysis"][
                "analysed_statements"
            ]

            for statement_item in statements:
                statement = statement_item["statement"]
                print("\nAGGREGATE_VERIFY_STATEMENT")
                print("text:", statement["text"])
                # print("stats:", statements)

                patch = Patch(
                    op="replace",
                    path=[
                        "blocks",
                        "record",
                        statement["block_id"],
                        "statements",
                        "record",
                        statement["statement_id"],
                        "verification_analysis",
                    ],
                    value=statement_item["verification_analysis"],
                )
                yield f"[{patch.model_dump_json()}]\n"


if __name__ == "__main__":
    img = graph.get_graph().draw_mermaid_png()

    with open("graph.png", "wb") as f:
        _ = f.write(img)

    dataset = Dataset()
    eval_dataset = dataset.get_data()

    data = list(
        {
            "inputs": {"item": item},
            "expectations": {
                "expected_response": {
                    "title": item["title"],
                }
            },
        }
        for item in eval_dataset
    )

    @scorer
    def matches(outputs: SourceVerificationAnalysisResult, expectations: Any) -> bool:
        """
        Evaluate if the output matches expected value.
        """
        expected = expectations["expected_response"]
        # print("\n\n\noutputs:", outputs)
        # print("\n\n\nexpectations:", expectations)
        return json.dumps(outputs, sort_keys=True) == json.dumps(
            expected, sort_keys=True
        )

    scorers = [matches]

    print(len(data[1:2]))

    results = mlflow.genai.evaluate(
        data=pd.DataFrame(data[1:2]),
        predict_fn=predict_fn,
        scorers=scorers,
    )
