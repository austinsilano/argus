"""
Domain classifier for Argus AI Shadow IT Scanner.

Philosophy: be honest about what we know and don't know.
- Known tools (in YAML DB): full profile, scored with confidence
- Known AI vendors (extended registry): identified, moderate confidence
- Unknown domains: flagged for analyst triage, no fabricated score

This is how real CASB tools work (Netskope, Zscaler).
A fabricated score is worse than no score — it creates false confidence.
"""
from dataclasses import dataclass, field
from typing import Optional


# ── Extended vendor registry ──────────────────────────────────────────────────
# Tools not in the main YAML DB but definitively identified.
# These get a real profile, not a guess.
# Security team: add to YAML DB for full profiles, this is the overflow catch.

KNOWN_AI_VENDORS: dict[str, dict] = {
    # Root domain → profile
    "openai.com":        {"name": "OpenAI (Direct)",    "vendor": "OpenAI",          "category": "LLM Platform",      "risk_score": 7.0, "risk_level": "HIGH",   "gdpr_relevant": "YES", "data_leaves_org": True,  "trains_on_data": False, "notes": "Parent domain for ChatGPT and API services."},
    "anthropic.com":     {"name": "Anthropic (Direct)", "vendor": "Anthropic",        "category": "LLM Platform",      "risk_score": 6.0, "risk_level": "MEDIUM", "gdpr_relevant": "YES", "data_leaves_org": True,  "trains_on_data": False, "notes": "Parent domain for Claude services."},
    "cohere.com":        {"name": "Cohere",             "vendor": "Cohere",           "category": "LLM API",           "risk_score": 6.5, "risk_level": "HIGH",   "gdpr_relevant": "YES", "data_leaves_org": True,  "trains_on_data": False, "notes": "Enterprise LLM API provider."},
    "mistral.ai":        {"name": "Mistral AI",         "vendor": "Mistral AI",       "category": "LLM",               "risk_score": 6.5, "risk_level": "HIGH",   "gdpr_relevant": "YES", "data_leaves_org": True,  "trains_on_data": False, "notes": "French LLM provider. EU data residency available."},
    "replicate.com":     {"name": "Replicate",          "vendor": "Replicate",        "category": "ML Model Hosting",  "risk_score": 6.0, "risk_level": "MEDIUM", "gdpr_relevant": "YES", "data_leaves_org": True,  "trains_on_data": False, "notes": "Run open-source ML models via API."},
    "together.ai":       {"name": "Together AI",        "vendor": "Together AI",      "category": "LLM API",           "risk_score": 6.0, "risk_level": "MEDIUM", "gdpr_relevant": "YES", "data_leaves_org": True,  "trains_on_data": False, "notes": "Open-source LLM inference platform."},
    "elevenlabs.io":     {"name": "ElevenLabs",         "vendor": "ElevenLabs",       "category": "Voice AI",          "risk_score": 7.5, "risk_level": "HIGH",   "gdpr_relevant": "YES", "data_leaves_org": True,  "trains_on_data": True,  "notes": "AI voice cloning and synthesis. Audio data leaves org."},
    "synthesia.io":      {"name": "Synthesia",          "vendor": "Synthesia",        "category": "Video AI",          "risk_score": 7.5, "risk_level": "HIGH",   "gdpr_relevant": "YES", "data_leaves_org": True,  "trains_on_data": True,  "notes": "AI avatar video generation. High risk for deepfake concerns."},
    "copy.ai":           {"name": "Copy.ai",            "vendor": "Copy.ai",          "category": "Writing Assistant", "risk_score": 6.0, "risk_level": "MEDIUM", "gdpr_relevant": "YES", "data_leaves_org": True,  "trains_on_data": True,  "notes": "AI copywriting tool."},
    "writesonic.com":    {"name": "Writesonic",         "vendor": "Writesonic",       "category": "Writing Assistant", "risk_score": 6.0, "risk_level": "MEDIUM", "gdpr_relevant": "YES", "data_leaves_org": True,  "trains_on_data": True,  "notes": "AI writing assistant."},
    "poe.com":           {"name": "Poe",                "vendor": "Quora",            "category": "LLM Aggregator",    "risk_score": 7.0, "risk_level": "HIGH",   "gdpr_relevant": "YES", "data_leaves_org": True,  "trains_on_data": True,  "notes": "Multi-model chat platform. Routes to multiple LLM providers."},
    "pi.ai":             {"name": "Pi",                 "vendor": "Inflection AI",    "category": "LLM",               "risk_score": 6.5, "risk_level": "HIGH",   "gdpr_relevant": "YES", "data_leaves_org": True,  "trains_on_data": True,  "notes": "Personal AI assistant. Conversational data stored."},
    "inflection.ai":     {"name": "Inflection AI",     "vendor": "Inflection AI",    "category": "LLM Platform",      "risk_score": 6.5, "risk_level": "HIGH",   "gdpr_relevant": "YES", "data_leaves_org": True,  "trains_on_data": True,  "notes": "AI platform behind Pi."},
    "scale.com":         {"name": "Scale AI",           "vendor": "Scale AI",         "category": "ML Data Platform",  "risk_score": 6.0, "risk_level": "MEDIUM", "gdpr_relevant": "YES", "data_leaves_org": True,  "trains_on_data": False, "notes": "AI data labelling and evaluation platform."},
    "civitai.com":       {"name": "CivitAI",            "vendor": "CivitAI",          "category": "Image Generation",  "risk_score": 7.0, "risk_level": "HIGH",   "gdpr_relevant": "NO",  "data_leaves_org": True,  "trains_on_data": True,  "notes": "Community image generation. No enterprise controls."},
    "leonardo.ai":       {"name": "Leonardo AI",        "vendor": "Leonardo AI",      "category": "Image Generation",  "risk_score": 6.5, "risk_level": "HIGH",   "gdpr_relevant": "YES", "data_leaves_org": True,  "trains_on_data": True,  "notes": "AI image generation platform."},
    "ideogram.ai":       {"name": "Ideogram",           "vendor": "Ideogram",         "category": "Image Generation",  "risk_score": 6.5, "risk_level": "HIGH",   "gdpr_relevant": "YES", "data_leaves_org": True,  "trains_on_data": True,  "notes": "Text-to-image AI tool."},
    "suno.ai":           {"name": "Suno",               "vendor": "Suno AI",          "category": "Music Generation",  "risk_score": 6.5, "risk_level": "HIGH",   "gdpr_relevant": "YES", "data_leaves_org": True,  "trains_on_data": True,  "notes": "AI music generation. Prompts and outputs retained."},
    "udio.com":          {"name": "Udio",               "vendor": "Udio",             "category": "Music Generation",  "risk_score": 6.5, "risk_level": "HIGH",   "gdpr_relevant": "YES", "data_leaves_org": True,  "trains_on_data": True,  "notes": "AI music generation platform."},
    "luma.ai":           {"name": "Luma AI",            "vendor": "Luma AI",          "category": "Video/3D AI",       "risk_score": 6.5, "risk_level": "HIGH",   "gdpr_relevant": "YES", "data_leaves_org": True,  "trains_on_data": True,  "notes": "AI video and 3D generation."},
    "pika.art":          {"name": "Pika Labs",          "vendor": "Pika Labs",        "category": "Video Generation",  "risk_score": 6.5, "risk_level": "HIGH",   "gdpr_relevant": "YES", "data_leaves_org": True,  "trains_on_data": True,  "notes": "AI video generation tool."},
    "krea.ai":           {"name": "Krea AI",            "vendor": "Krea",             "category": "Image/Video AI",    "risk_score": 6.0, "risk_level": "MEDIUM", "gdpr_relevant": "YES", "data_leaves_org": True,  "trains_on_data": True,  "notes": "Real-time AI image and video generation."},
    "gamma.app":         {"name": "Gamma",              "vendor": "Gamma",            "category": "Presentation AI",  "risk_score": 5.5, "risk_level": "MEDIUM", "gdpr_relevant": "YES", "data_leaves_org": True,  "trains_on_data": False, "notes": "AI-powered presentation builder."},
    "tome.app":          {"name": "Tome",               "vendor": "Tome",             "category": "Presentation AI",  "risk_score": 5.5, "risk_level": "MEDIUM", "gdpr_relevant": "YES", "data_leaves_org": True,  "trains_on_data": False, "notes": "AI presentation and storytelling tool."},
    "beautiful.ai":      {"name": "Beautiful.ai",       "vendor": "Beautiful.ai",     "category": "Presentation AI",  "risk_score": 5.0, "risk_level": "MEDIUM", "gdpr_relevant": "YES", "data_leaves_org": True,  "trains_on_data": False, "notes": "AI slide design tool."},
    "descript.com":      {"name": "Descript",           "vendor": "Descript",         "category": "Audio/Video AI",   "risk_score": 7.0, "risk_level": "HIGH",   "gdpr_relevant": "YES", "data_leaves_org": True,  "trains_on_data": True,  "notes": "AI audio and video editing. Voice cloning features present."},
    "murf.ai":           {"name": "Murf AI",            "vendor": "Murf",             "category": "Voice AI",          "risk_score": 7.0, "risk_level": "HIGH",   "gdpr_relevant": "YES", "data_leaves_org": True,  "trains_on_data": True,  "notes": "AI voice generation. Audio data processed externally."},
    "deepl.com":         {"name": "DeepL",              "vendor": "DeepL",            "category": "Translation AI",   "risk_score": 5.0, "risk_level": "MEDIUM", "gdpr_relevant": "YES", "data_leaves_org": True,  "trains_on_data": False, "notes": "AI translation. Pro plan has data privacy controls."},
    "otter.ai":          {"name": "Otter.ai",           "vendor": "AISense",          "category": "Transcription",    "risk_score": 8.0, "risk_level": "HIGH",   "gdpr_relevant": "YES", "data_leaves_org": True,  "trains_on_data": True,  "notes": "Meeting transcription. Audio stored externally."},
    "sembly.ai":         {"name": "Sembly AI",          "vendor": "Sembly",           "category": "Meeting AI",       "risk_score": 7.5, "risk_level": "HIGH",   "gdpr_relevant": "YES", "data_leaves_org": True,  "trains_on_data": True,  "notes": "AI meeting notes and summaries."},
    "fathom.video":      {"name": "Fathom",             "vendor": "Fathom",           "category": "Meeting AI",       "risk_score": 7.0, "risk_level": "HIGH",   "gdpr_relevant": "YES", "data_leaves_org": True,  "trains_on_data": False, "notes": "AI meeting recorder and summariser."},
    "tactiq.io":         {"name": "Tactiq",             "vendor": "Tactiq",           "category": "Meeting AI",       "risk_score": 7.0, "risk_level": "HIGH",   "gdpr_relevant": "YES", "data_leaves_org": True,  "trains_on_data": False, "notes": "Real-time meeting transcription."},
    "zapier.com":        {"name": "Zapier",             "vendor": "Zapier",           "category": "Automation/AI",    "risk_score": 5.5, "risk_level": "MEDIUM", "gdpr_relevant": "YES", "data_leaves_org": True,  "trains_on_data": False, "notes": "Workflow automation with AI features. Data routes through Zapier servers."},
    "make.com":          {"name": "Make (Integromat)",  "vendor": "Make",             "category": "Automation/AI",    "risk_score": 5.5, "risk_level": "MEDIUM", "gdpr_relevant": "YES", "data_leaves_org": True,  "trains_on_data": False, "notes": "Visual workflow automation with AI integrations."},
    "n8n.io":            {"name": "n8n",                "vendor": "n8n GmbH",         "category": "Automation/AI",    "risk_score": 3.5, "risk_level": "LOW",    "gdpr_relevant": "YES", "data_leaves_org": False, "trains_on_data": False, "notes": "Self-hostable workflow automation. Cloud version available."},
    "v0.dev":            {"name": "v0 by Vercel",       "vendor": "Vercel",           "category": "Code Assistant",   "risk_score": 5.5, "risk_level": "MEDIUM", "gdpr_relevant": "YES", "data_leaves_org": True,  "trains_on_data": False, "notes": "AI UI code generation tool."},
    "bolt.new":          {"name": "Bolt",               "vendor": "StackBlitz",       "category": "Code Assistant",   "risk_score": 5.5, "risk_level": "MEDIUM", "gdpr_relevant": "YES", "data_leaves_org": True,  "trains_on_data": False, "notes": "AI full-stack app builder in browser."},
    "replit.com":        {"name": "Replit",             "vendor": "Replit",           "category": "Code Assistant",   "risk_score": 6.0, "risk_level": "MEDIUM", "gdpr_relevant": "YES", "data_leaves_org": True,  "trains_on_data": True,  "notes": "AI-powered online IDE. Code shared with Replit."},
    "tabnine.com":       {"name": "Tabnine",            "vendor": "Tabnine",          "category": "Code Assistant",   "risk_score": 4.5, "risk_level": "MEDIUM", "gdpr_relevant": "YES", "data_leaves_org": True,  "trains_on_data": False, "notes": "AI code completion. Enterprise has private model option."},
    "sourcegraph.com":   {"name": "Sourcegraph Cody",   "vendor": "Sourcegraph",      "category": "Code Assistant",   "risk_score": 4.5, "risk_level": "MEDIUM", "gdpr_relevant": "YES", "data_leaves_org": True,  "trains_on_data": False, "notes": "AI code assistant with codebase context."},
    "pieces.app":        {"name": "Pieces for Developers","vendor": "Pieces",         "category": "Code Assistant",   "risk_score": 4.0, "risk_level": "MEDIUM", "gdpr_relevant": "YES", "data_leaves_org": False, "trains_on_data": False, "notes": "Local AI developer tool. Can run fully on-device."},
}


@dataclass
class ClassificationResult:
    domain: str
    status: str           # KNOWN_DB / KNOWN_VENDOR / UNCLASSIFIED
    profile: Optional[dict] = None
    risk_score: Optional[float] = None
    risk_level: Optional[str] = None
    confidence: str = "NONE"   # HIGH / MEDIUM / NONE
    triage_required: bool = False
    triage_reason: Optional[str] = None


def _extract_root(domain: str) -> str:
    parts = domain.lower().strip().split(".")
    if len(parts) >= 2:
        return ".".join(parts[-2:])
    return domain


def classify_domain(domain: str, yaml_lookup_fn, yaml_score_fn) -> ClassificationResult:
    """
    Classify a domain with full transparency about confidence level.

    Priority order:
    1. YAML DB (curated, high confidence)
    2. Extended vendor registry (identified, medium-high confidence)
    3. Unclassified — send to triage queue, no score assigned
    """
    domain = domain.lower().strip()
    root = _extract_root(domain)

    # ── 1. YAML DB lookup (highest confidence) ───────────────────────────────
    profile = yaml_lookup_fn(domain)
    if profile:
        score, level = yaml_score_fn(profile)
        return ClassificationResult(
            domain=domain,
            status="KNOWN_DB",
            profile=profile,
            risk_score=score,
            risk_level=level,
            confidence="HIGH",
            triage_required=False,
        )

    # ── 2. Extended vendor registry ──────────────────────────────────────────
    if root in KNOWN_AI_VENDORS:
        p = KNOWN_AI_VENDORS[root]
        return ClassificationResult(
            domain=domain,
            status="KNOWN_VENDOR",
            profile={**p, "source_registry": "extended", "domain": domain},
            risk_score=p["risk_score"],
            risk_level=p["risk_level"],
            confidence="MEDIUM",
            triage_required=False,
        )

    # ── 3. Unclassified — triage required ────────────────────────────────────
    return ClassificationResult(
        domain=domain,
        status="UNCLASSIFIED",
        profile=None,
        risk_score=None,
        risk_level=None,
        confidence="NONE",
        triage_required=True,
        triage_reason=f"Domain '{domain}' not found in AI tool database. Analyst review required before scoring.",
    )
