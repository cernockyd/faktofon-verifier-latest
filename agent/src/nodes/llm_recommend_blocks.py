import logging
import uuid
from datetime import datetime, timezone
from typing import TypedDict

from langchain.chat_models import init_chat_model
from langchain_core.messages import HumanMessage, SystemMessage

from src.schema import (
    BlockRecommendationResult,
    CardBlockReorderable,
    CardStatement,
    StatementContext,
    StatementsReorderable,
)

llm_version = "openai:gpt-4.1"
llm = init_chat_model(llm_version)

block_recommendation_prompt_template = """
Write new paragraphs in Czech language that argue on a topic based on the context.

Global context: {global_proposition_context}

Current date: {current_date}

Existing paragraphs (your paragraphs will go after them): {existing_paragraphs}

User message: {user_prompt}


"""


class LLMRecommendBlockInput(TypedDict):
    prompt: str
    # todo: currently unused
    requested_blocks_count: int | None
    existing_blocks: CardBlockReorderable
    # todo: context needs revision, in this case its not even statement context!
    block_context: StatementContext


class LLMBlockRecommendationOutput(TypedDict):
    # might need to pass other variables like desired insert index,
    # thus addional level of dict here
    blocks: CardBlockReorderable


class LLMRecommendBlocksAggregationOutput(TypedDict):
    recommended_blocks: list[LLMBlockRecommendationOutput]


def llm_recommend_blocks(
    state: LLMRecommendBlockInput,
) -> LLMRecommendBlocksAggregationOutput:
    context = state["block_context"]
    logging.info("Thread LLM call to recommend a new block")

    now_utc = datetime.now(timezone.utc)

    existing_paragraphs: str = ""
    for existing_block_id in state["existing_blocks"]["order"]:
        existing_block = state["existing_blocks"]["record"][existing_block_id]
        for existing_block_statement_id in existing_block["statements"]["order"]:
            existing_statement = existing_block["statements"]["record"][
                existing_block_statement_id
            ]
            existing_paragraphs += existing_statement["text"]
        existing_paragraphs += "\n"

    recommendation_prompt = block_recommendation_prompt_template.format(
        global_proposition_context=context["card_title"],
        existing_paragraphs=existing_paragraphs,
        user_prompt=state["prompt"],
        current_date=now_utc.strftime("%Y-%m-%d"),
        # additional_context=" ".join(context["additional_context"]),
    )
    logging.info("Calling LLM")
    structured_llm = llm.with_structured_output(BlockRecommendationResult)
    recommendation_res = structured_llm.invoke(
        [
            SystemMessage(""),
            HumanMessage(content=recommendation_prompt),
        ]
    )

    logging.info("Checking recommendation result")
    assert isinstance(recommendation_res, BlockRecommendationResult)

    new_blocks: CardBlockReorderable = {"order": [], "record": {}}

    for block in recommendation_res.recommended_paragraphs:
        new_block_id = str(uuid.uuid4())
        new_statements: StatementsReorderable = {"order": [], "record": {}}
        for statement_i in range(len(block.block)):
            statement = block.block[statement_i]
            new_statement_id = str(uuid.uuid4())
            card_statement = CardStatement(
                text=statement,
                sources={"order": [], "record": {}},
                emoji=block.block_emoji,
            )
            new_statements["record"][new_statement_id] = card_statement
            new_statements["order"].append(new_statement_id)
        new_blocks["record"][new_block_id] = {"statements": new_statements}
        new_blocks["order"].append(new_block_id)

    logging.info("printing new blocks")
    print("\n\n", new_blocks, "\n\n")

    logging.info("updating state")
    output: LLMBlockRecommendationOutput = {"blocks": new_blocks}

    return {"recommended_blocks": [output]}
