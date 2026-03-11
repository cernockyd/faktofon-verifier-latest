from datetime import datetime
from typing import (
    Any,
    Literal,
    NotRequired,
    TypedDict,
)

from pydantic import BaseModel, Field
from pydantic_core import Url


class Source(TypedDict):
    url: Url


class StatementContext(TypedDict):
    card_title: str
    additional_context: list[str]


class StatementVariantsRecommendationResult(BaseModel):
    url: str = Field(
        min_length=5,
        description="The URL of the source",
    )
    name: str = Field(
        min_length=5,
        description="The name or title of the source.",
    )
    relevance_description: str = Field(
        min_length=40,
        description="Why is this source relevant to the proposition and how does it help to prove the proposition.",
    )
    source_level: Literal["primary", "secondary", "terciary"] = Field(
        description="General level of the information source based on its originality and relationship to an event or topic."
    )


class VerificationAnalysisItem(TypedDict):
    sources: list[Source]
    card_title: str
    proposition: str
    additional_context: list[str]


class GraphInput(TypedDict):
    source: Source
    card_title: str
    proposition: str
    additional_context: list[str]


class Interaction(TypedDict):
    approved: bool
    rejected: bool


class CardSource(TypedDict):
    type: str | None
    name: str | None
    url: str | None
    archive_url: str | None
    date: str | None
    verification: NotRequired[
        "SourceVerificationAnalysisResult"
    ]  # Populated during verification
    verification_user_interaction: NotRequired[Interaction]
    author_type: NotRequired[Literal["user", "agent"]]


class InformationSourceRecommendationResult(BaseModel):
    # todo: restrict to HTTP/S URL only
    url: str = Field(
        min_length=5,
        description="The URL of the source",
    )
    name: str = Field(
        min_length=5,
        description="The name or title of the source.",
    )
    relevance_description: str = Field(
        min_length=40,
        description="Why is this source relevant to the proposition and how does it help to prove the proposition.",
    )
    source_level: Literal["primary", "secondary", "terciary"] = Field(
        description="General level of the information source based on its originality and relationship to an event or topic."
    )


class CardSourceEnhanced(CardSource):
    source_id: str
    statement_id: str
    block_id: str


class Duration(BaseModel):
    years: int = Field(default=0, ge=0, description="Number of years")
    months: int = Field(default=0, ge=0, description="Number of months")
    days: int = Field(default=0, ge=0, description="Number of days")
    hours: int = Field(default=0, ge=0, description="Number of hours")


class SourcesLevelCount(TypedDict):
    primary: int
    secondary: int
    terciary: int


class StatementVerificationAnalysis(TypedDict):
    sources_statistics: SourcesLevelCount


class ProcessingState(TypedDict):
    error: bool
    success: bool
    loading: bool


class SourcesReorderable(TypedDict):
    order: list[str]
    record: dict[str, CardSource]


class StatementVerificationAnalysisStatus(TypedDict):
    status_code: Literal["supported", "not_supported"]
    messages: list[str]
    errors: list[str]


class StatementVerificationAnalysisEnhanced(StatementVerificationAnalysis):
    status: StatementVerificationAnalysisStatus


class StatementVerifiabilityAnalysisResult(BaseModel):
    """
    Enforced output structure of the statement analysis LLM prompt.
    """

    proposition_timeframe: Duration | None = Field(
        default=None,
        description="The ideal timeframe of the proposition (an object with years, months, days, hours) denoting what is the ideal age of a resouce backing the proposition.",
    )
    proposition_factual: float | None = Field(
        default=None,
        ge=0,
        le=1,
        description="Is the proposition factual enough to be verified? The closer to 1, the more factual.",
    )


class CardStatement(TypedDict):
    text: str
    sources: SourcesReorderable
    emoji: NotRequired[str]
    verifiability_analysis: NotRequired[StatementVerifiabilityAnalysisResult]
    # verifiability_analysis_user_interaction: NotRequired[Interaction]
    verification_analysis: NotRequired[StatementVerificationAnalysisEnhanced]
    # verification_analysis_user_interaction: NotRequired[Interaction]
    # expected: NotRequired[dict]  # can be refined if needed


class CardStatementEnhanced(CardStatement):
    statement_id: str
    block_id: str


class StatementsReorderable(TypedDict):
    order: list[str]
    record: dict[str, CardStatement]


class CardBlock(TypedDict):
    statements: StatementsReorderable


class CardBlockReorderable(TypedDict):
    order: list[str]
    record: dict[str, CardBlock]


class Card(TypedDict):
    title: str
    topics: list[str]  # at this point not reordeable
    blocks: CardBlockReorderable


# {"messages":[{"id":"msg-1772883664839-yw393d","role":"user","parts":[{"type":"action","action":"recommend_sources","payload":{"statement_id":"25fa2b34-d235-4ecd-b156-63c9e57bcb42"}}],"createdAt":"2026-03-07T11:41:04.839Z"}]


class ActionMessagePartPayload(TypedDict):
    statement_id: NotRequired[str]
    prompt: NotRequired[str]


class ActionMessagePart(TypedDict):
    type: Literal["action"]
    action: Literal[
        "analyze",
        "recommend_sources",
        "recommend_statement_variants",
        "recommend_statement",
        "recommend_blocks",
    ]
    payload: NotRequired[ActionMessagePartPayload]


class Message(TypedDict):
    id: NotRequired[str]
    role: Literal["user"]  # ignoring others
    parts: list[ActionMessagePart]  # ignoring other content types as well
    createdAt: NotRequired[str]


class AgentCardToolRequestData(TypedDict):
    card: Card
    conversationId: NotRequired[str]


class AgentCardToolRequest(TypedDict):
    messages: list[Message]
    data: AgentCardToolRequestData


class SourceVerificationAnalysisResult(BaseModel):
    """
    Enforced prompt output structure.
    """

    source_title: str = Field(description="A short title of the source for UI.")
    # source_type: Literal["news", "reports", "blog", "social-net status", "video", ""] = (
    #     Field(description="Where the source comes from.")
    # )
    source_origin: Literal[
        "academic", "professional", "general", "governmental", "popular", "other"
    ] = Field(description="Where the source comes from.")
    source_function: Literal[
        "reference",
        "research",
        "instructional",
        "news",
        "opinion",
        "promotion",
        "entertainment",
    ] = Field(description="The intent of the source.")
    source_level: Literal["primary", "secondary", "terciary"] = Field(
        description="General level of the information source based on its originality and relationship to an event or topic."
    )
    source_published_at: datetime | None = Field(
        default=None,
        description="The date (optionally with time) when the source was published.",
    )

    source_currency: float | None = Field(
        default=None,
        ge=0,
        le=1,
        description="How recent is the source with respect to the proposition. The higher, the more recent with respect to the proposition timeframe.",
    )
    source_reliability: float | None = Field(
        default=None,
        ge=0,
        le=1,
        description="What kind of information is included? Is it opinion or well balanced information with appropriate sources? The higher the better.",
    )
    source_point_of_view: float | None = Field(
        default=None,
        ge=0,
        le=1,
        description="Is it opinion or factual? Facts are presented free from bias and emotive words with purpose clearly identifiable. The higher the more factual the source is.",
    )
    source_implies_proposition_truthful: float | None = Field(
        default=None,
        ge=0,
        le=1,
        description="Does the source imply the proposition is truthful? The higher the more it implies.",
    )
    source_proof_near_exact_substrings: list[str] | None = Field(
        default=None,
        min_length=1,
        max_length=5,
        description="The exact copies of the most important sentences that support the proof or disproof of the proposition.",
    )
    source_proof_paraphrase: str | None = Field(
        default=None,
        min_length=40,
        description="A paraphrase of the parts from the source that explains proof or disproof the proposition truthy.",
    )
    # source_proof_paraphrases: Optional[list[str]] = Field(
    #     default=None,
    #     min_length=0,
    #     max_length=3,
    #     description="A paraphrase variants of the parts from the source that proof or disproof the proposition truthy.",
    # )


class BlockRecommendationResultParagraph(BaseModel):
    block: list[str] = Field(
        min_length=1,
        max_length=5,
        description="List of short propositions that try to convey a compeling message on a problem. The first proposition is the main claim that the other statements try to support. Together the statements make a dialectic paragraph. Each proposition should be verifiable, as short as posssible. Pronouns or metaphors are not encouraged unless necessary.",
    )
    block_emoji: str = Field(
        min_length=1,
        max_length=1,
        description="Emoji representing the paragrap's topic.",
    )


class BlockRecommendationResult(BaseModel):
    recommended_paragraphs: list[BlockRecommendationResultParagraph] = Field(
        min_length=1, max_length=3, description="Recommended paragraphs"
    )


class SourceVerificationAnalysisStatus(TypedDict):
    status_code: Literal["supports", "not_supports"]
    messages: list[str]
    errors: list[str]


class SourceVerificationAnalysisResultEnhanced(SourceVerificationAnalysisResult):
    status: SourceVerificationAnalysisStatus


class StatementVerifiabilityAnalysisStatus(TypedDict):
    status_code: Literal["verifiable", "not_verifiable"]
    messages: list[str]
    errors: list[str]


class StatementVerifiabilityAnalysisResultEnhanced(
    StatementVerifiabilityAnalysisResult
):
    status: StatementVerifiabilityAnalysisStatus


class Patch(BaseModel):  # using BaseModel to allow model_dump_json()
    op: str
    path: list[int | str]
    value: Any
