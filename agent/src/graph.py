import logging
import os
import sys

import mlflow

# import pandas as pd
from dotenv import load_dotenv

# from IPython.display import Image
from langgraph.graph import END, START, StateGraph

from src.branches.action_routing_branch import action_routing_branch
from src.branches.analyze_information_source_branch import (
    analyze_information_source_branch,
)
from src.nodes.aggregate_statement_verification_analysis import (
    aggregate_statement_verification_analysis,
)
from src.nodes.llm_analyse_information_source import (
    LLMAnalyseInformationSourceOutput,
    llm_analyse_information_source,
)
from src.nodes.llm_analyse_statement_verifiability import (
    llm_analyse_statement_verifiability,
)
from src.nodes.llm_recommend_blocks import (
    llm_recommend_blocks,
)
from src.nodes.llm_recommend_information_source import (
    llm_recommend_information_source,
)

# from mlflow.genai import scorer
# from src.dataset import Dataset
from src.schema import (
    AgentCardToolRequest,
    Card,
    CardBlock,
    CardBlockReorderable,
    Patch,
    SourceVerificationAnalysisResult,
    StatementVerifiabilityAnalysisResult,
)
from src.state import OveralState
from src.utils import new_record_patch

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


def preprocess(state: OveralState):
    """Preprocess the nested input structure into a list of URL and proposition tuples."""
    if state["input_card"] is None:
        logging.info("Preprocessing Skipped")
        return
    logging.info("Entering the graph")
    return


def reconstruct_verified_card(
    original_card: Card, verification_list: list[LLMAnalyseInformationSourceOutput]
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


def aggregate_recommend_blocks(state: OveralState):
    logging.info("Aggregating recommended blocks")
    return state


def print_ver(state: OveralState):
    logging.info("Priting statements/aggregated verifications")
    print(len(state["verification_list"]))
    print(state["verification_list"])


graph_builder = StateGraph(OveralState)

# nodes
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

_ = graph_builder.add_node("llm_recommend_blocks", llm_recommend_blocks)

_ = graph_builder.add_node(
    "aggregate_recommend_information_sources",
    aggregate_recommend_information_sources,
)
_ = graph_builder.add_node(
    "aggregate_recommend_blocks",
    aggregate_recommend_blocks,
)
_ = graph_builder.add_node(
    "aggregate_statement_verification_analysis",
    aggregate_statement_verification_analysis,
)
_ = graph_builder.add_node("print_ver", print_ver)

# edges
_ = graph_builder.add_edge(START, "preprocess")
_ = graph_builder.add_conditional_edges("preprocess", action_routing_branch)
_ = graph_builder.add_conditional_edges(
    "llm_analyse_statement_verifiability", analyze_information_source_branch
)
_ = graph_builder.add_edge("llm_recommend_blocks", "aggregate_recommend_blocks")
_ = graph_builder.add_edge("aggregate_recommend_blocks", END)
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
            "recommended_blocks": [],
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
            "recommended_blocks": [],
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

        if "llm_recommend_blocks" in keys:
            aggregation_level_output = update["llm_recommend_blocks"][
                "recommended_blocks"
            ][0]
            blocks: CardBlockReorderable = aggregation_level_output["blocks"]

            for block_id in blocks["order"]:
                block = blocks["record"][block_id]
                patch = new_record_patch(
                    [
                        "blocks",
                    ],
                    block_id,
                    block,
                )
                yield f"[{patch[0].model_dump_json()}, {patch[1].model_dump_json()}]\n"


if __name__ == "__main__":
    _ = load_dotenv()
    print("Graph.py run")

    if "--render" in sys.argv:
        print("Rendering")
        img = graph.get_graph().draw_mermaid_png()
        with open("graph.png", "wb") as f:
            f.write(img)
    else:
        print("Skipping rendering. Use --render to generate the image.")

    # dataset = Dataset()
    # eval_dataset = dataset.get_data()

    # data = list(
    #     {
    #         "inputs": {"item": item},
    #         "expectations": {
    #             "expected_response": {
    #                 "title": item["title"],
    #             }
    #         },
    #     }
    #     for item in eval_dataset
    # )

    # @scorer
    # def matches(outputs: SourceVerificationAnalysisResult, expectations: Any) -> bool:
    #     """
    #     Evaluate if the output matches expected value.
    #     """
    #     expected = expectations["expected_response"]
    #     # print("\n\n\noutputs:", outputs)
    #     # print("\n\n\nexpectations:", expectations)
    #     return json.dumps(outputs, sort_keys=True) == json.dumps(
    #         expected, sort_keys=True
    #     )

    # scorers = [matches]

    # print(len(data[1:2]))

    # results = mlflow.genai.evaluate(
    #     data=pd.DataFrame(data[1:2]),
    #     predict_fn=predict_fn,
    #     scorers=scorers,
    # )
