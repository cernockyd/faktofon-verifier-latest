from src.schema import (
    SourceVerificationAnalysisResult,
    SourceVerificationAnalysisStatus,
    StatementVerifiabilityAnalysisResult,
    StatementVerifiabilityAnalysisStatus,
    StatementVerificationAnalysis,
    StatementVerificationAnalysisStatus,
)


def validate_statement_verifiability(
    verifiability_analysis: StatementVerifiabilityAnalysisResult,
) -> StatementVerifiabilityAnalysisStatus:
    messages = []
    errors = []
    status_code = "not_verifiable"
    if verifiability_analysis.proposition_verifiable >= 0.85:
        status_code = "verifiable"
    if verifiability_analysis.is_rhetorical >= 0.85:
        status_code = "not_verifiable_rhetorical_question"
    return {
        "status_code": status_code,
        "messages": messages,
        "errors": errors,
    }


def validate_source_verification(
    verification_analysis: SourceVerificationAnalysisResult,
) -> SourceVerificationAnalysisStatus:
    messages = []
    errors = []
    status_code = "not_supports"

    if (
        verification_analysis.source_implies_proposition_truthful is not None
        and verification_analysis.source_implies_proposition_truthful >= 0.9
    ):
        status_code = "supports"

    return {
        "status_code": status_code,
        "messages": messages,
        "errors": errors,
    }


def validate_statement_verification(
    verification_analysis: StatementVerificationAnalysis,
) -> StatementVerificationAnalysisStatus:
    status_code = "not_supported"
    messages = []
    errors = []
    minimum_source_type_count_met = False
    source_stats = verification_analysis["sources_supported_statistics"]
    if source_stats is not None:
        if source_stats["primary"] >= 1 or source_stats["secondary"] >= 2:
            minimum_source_type_count_met = True

    # todo: check source verification as well

    if minimum_source_type_count_met:
        status_code = "supported"

    return {
        "status_code": status_code,
        "messages": messages,
        "errors": errors,
    }
