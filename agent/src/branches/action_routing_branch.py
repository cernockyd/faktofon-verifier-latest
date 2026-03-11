import logging

from langgraph.graph import END
from langgraph.types import Send

from src.schema import CardStatementEnhanced
from src.state import OveralState


def action_routing_branch(
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
        "recommend_blocks",
    ]:
        logging.info("Unknown message")
        return END

    card = state["input_card"]
    if card is None:
        logging.info("Skipped routing")
        return END

    sends: list[Send] = []

    if message_part["action"] == "recommend_blocks":
        payload = message_part.get("payload")
        if payload is None:
            return
        prompt = payload.get("prompt", None)
        blocks_count = payload.get("blocks_count", None)
        sends.append(
            Send(
                "llm_recommend_blocks",
                {
                    "prompt": prompt,
                    "requested_blocks_count": blocks_count,
                    "existing_blocks": card["blocks"],
                    "block_context": {
                        "card_title": card["title"],
                        "additional_context": [],
                    },
                },
            )
        )
        return sends

    logging.info("Routing statements")
    for block_id in card["blocks"]["record"]:
        for statement_id in card["blocks"]["record"][block_id]["statements"]["record"]:
            statement_enhanced = CardStatementEnhanced(
                **card["blocks"]["record"][block_id]["statements"]["record"][
                    statement_id
                ],
                statement_id=statement_id,
                block_id=block_id,
            )
            # todo: handle in different way
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
                    prompt = payload.get("prompt", None)
                    if action_statement_id == statement_id:
                        sends.append(
                            Send(
                                "llm_recommend_information_source",
                                {
                                    "statement": statement_enhanced,
                                    "prompt": prompt,
                                    "statement_context": statement_context,
                                },
                            )
                        )
                case "recommend_statement_variants":
                    payload = message_part.get("payload")
                    if payload is None:
                        return  # todo: better skip
                    action_statement_id = payload.get("statement_id", None)
                    prompt = payload.get("prompt", None)
                    if action_statement_id == statement_id:
                        sends.append(
                            Send(
                                "llm_recommend_statement_variants",
                                {
                                    "statement": statement_enhanced,
                                    "prompt": prompt,
                                    "statement_context": statement_context,
                                },
                            )
                        )

                case _:
                    pass

    return sends
