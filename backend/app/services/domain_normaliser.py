"""
Domain normalisation pipeline for Argus.

Runs BEFORE any DB write or AI enrichment call.
Goal: one DB entry per vendor, zero redundant AI calls.

Pipeline order:
  1. Sanitise input
  2. Filter out non-AI infrastructure
  3. Extract root domain
  4. Consolidate to canonical vendor domain
  5. Return NormalisedDomain with full context
"""
import re
import ipaddress
from dataclasses import dataclass
from typing import Optional


# ── Private/internal ranges to drop entirely ─────────────────────────────────

PRIVATE_PATTERNS = re.compile(
    r'^(localhost|.*\.local|.*\.internal|.*\.corp|.*\.lan)$', re.I
)

PRIVATE_IP_PREFIXES = ('10.', '172.', '192.168.', '127.', '0.', '169.254.', 'fc', 'fd')


# ── Infrastructure domains — not AI tools, not worth triaging ────────────────
# CDN, analytics, auth providers, common SaaS infra

INFRASTRUCTURE_DOMAINS = {
    # CDN / hosting
    "cloudflare.com", "cloudflare.net", "fastly.com", "akamai.com",
    "akamaiedge.net", "akamaitechnologies.com", "edgesuite.net",
    "amazonaws.com", "awsstatic.com", "azureedge.net", "azurefd.net",
    "googleusercontent.com", "gstatic.com", "googleapis.com",
    "cloudfront.net", "cdn.shopify.com", "jsdelivr.net", "cdnjs.cloudflare.com",
    "unpkg.com", "bootstrapcdn.com",

    # Analytics / tracking
    "google-analytics.com", "googletagmanager.com", "hotjar.com",
    "segment.com", "mixpanel.com", "amplitude.com", "fullstory.com",
    "heap.io", "intercom.io", "intercom.com", "crisp.chat",
    "logrocket.com", "sentry.io", "bugsnag.com", "datadog.com",
    "newrelic.com", "elastic.co",

    # Auth / identity (not AI tools)
    "okta.com", "auth0.com", "onelogin.com", "ping.com",
    "microsoftonline.com", "live.com", "windows.net",
    "accounts.google.com",

    # Common productivity SaaS (not AI tools)
    "zoom.us", "zoomgov.com", "slack.com", "teams.microsoft.com",
    "dropbox.com", "box.com", "docusign.com", "adobe.com",
    "atlassian.com", "jira.com", "confluence.com", "trello.com",
    "asana.com", "monday.com", "clickup.com", "basecamp.com",
    "salesforce.com", "hubspot.com", "zendesk.com", "freshdesk.com",
    "servicenow.com", "workday.com", "bamboohr.com",

    # Email / calendar
    "gmail.com", "outlook.com", "office.com", "office365.com",
    "microsoft.com", "apple.com", "icloud.com",

    # Social / consumer (not org tools)
    "facebook.com", "instagram.com", "twitter.com", "x.com",
    "linkedin.com", "youtube.com", "tiktok.com", "reddit.com",
    "pinterest.com", "snapchat.com", "discord.com", "twitch.tv",

    # Dev infrastructure
    "github.com", "gitlab.com", "bitbucket.org", "npmjs.com",
    "pypi.org", "dockerhub.com", "hub.docker.com", "docker.com",
    "stackoverflow.com", "stackexchange.com",

    # Media / news
    "bbc.co.uk", "cnn.com", "nytimes.com", "theguardian.com",
    "reuters.com", "bloomberg.com", "wsj.com", "forbes.com",

    # E-commerce
    "amazon.com", "ebay.com", "etsy.com", "shopify.com",
    "stripe.com", "paypal.com", "square.com",

    # Other common non-AI
    "wikipedia.org", "wikimedia.org", "archive.org",
    "netflix.com", "spotify.com", "disney.com", "hulu.com",
}


# ── Multi-part TLDs (public suffix list subset) ───────────────────────────────
# Needed to correctly extract root domain from co.uk, com.au etc.

MULTI_PART_TLDS = {
    "co.uk", "co.nz", "co.za", "co.jp", "co.in", "co.kr",
    "com.au", "com.br", "com.cn", "com.mx", "com.sg", "com.hk",
    "org.uk", "net.au", "gov.uk", "edu.au", "ac.uk",
}


# ── Vendor consolidation map ──────────────────────────────────────────────────
# Maps any domain → canonical root domain for that vendor
# Prevents multiple DB entries for the same vendor

VENDOR_ALIASES: dict[str, str] = {
    # OpenAI family
    "chatgpt.com":           "chat.openai.com",
    "openai.com":            "chat.openai.com",
    "api.openai.com":        "chat.openai.com",
    "platform.openai.com":   "chat.openai.com",
    "auth.openai.com":       "chat.openai.com",

    # Anthropic family
    "anthropic.com":         "claude.ai",
    "claude.com":            "claude.ai",
    "api.anthropic.com":     "claude.ai",

    # Google AI family
    "bard.google.com":       "gemini.google.com",
    "ai.google.com":         "gemini.google.com",
    "labs.google.com":       "gemini.google.com",

    # Microsoft Copilot family
    "bing.com":              "copilot.microsoft.com",
    "copilot.bing.com":      "copilot.microsoft.com",

    # GitHub Copilot
    "github.com":            "copilot.github.com",
    "githubcopilot.com":     "copilot.github.com",

    # Notion
    "notion.site":           "notion.so",
    "notion.com":            "notion.so",

    # Grammarly
    "grammarly.io":          "grammarly.com",
    "extension.grammarly.com": "grammarly.com",

    # Hugging Face
    "hf.co":                 "huggingface.co",
}


# ── Result dataclass ──────────────────────────────────────────────────────────

@dataclass
class NormalisedDomain:
    original: str           # what was submitted
    canonical: str          # what to use for DB lookups
    root: str               # root domain (no subdomains)
    action: str             # LOOKUP / TRIAGE / SKIP
    skip_reason: str = ""   # why it was skipped
    was_consolidated: bool = False  # alias was resolved
    was_subdomain_stripped: bool = False


# ── Main normalisation function ───────────────────────────────────────────────

def normalise(domain: str) -> NormalisedDomain:
    """
    Normalise a domain before any DB or AI operation.
    Returns a NormalisedDomain with action = LOOKUP | TRIAGE | SKIP.
    """
    original = domain.strip().lower()

    # ── 1. Basic sanitisation ─────────────────────────────────────────────────
    # Strip protocol if someone pasted a URL
    domain = re.sub(r'^https?://', '', original)
    domain = re.sub(r'/.*$', '', domain)      # strip path
    domain = re.sub(r'\?.*$', '', domain)     # strip query string
    domain = re.sub(r':[\d]+$', '', domain)   # strip port
    domain = domain.strip().lower()

    if not domain:
        return NormalisedDomain(original, "", "", "SKIP", "Empty domain")

    # ── 2. Filter private/internal ────────────────────────────────────────────
    if PRIVATE_PATTERNS.match(domain):
        return NormalisedDomain(original, domain, domain, "SKIP", "Internal/private hostname")

    if any(domain.startswith(p) for p in PRIVATE_IP_PREFIXES):
        return NormalisedDomain(original, domain, domain, "SKIP", "Private IP range")

    try:
        ipaddress.ip_address(domain)
        return NormalisedDomain(original, domain, domain, "SKIP", "IP address — not a domain")
    except ValueError:
        pass

    # ── 3. Extract root domain ────────────────────────────────────────────────
    root = _extract_root(domain)
    was_stripped = root != domain

    # ── 4. Vendor consolidation (before blocklist — github.com → copilot.github.com) ──
    canonical = domain
    was_consolidated = False

    if domain in VENDOR_ALIASES:
        canonical = VENDOR_ALIASES[domain]
        was_consolidated = True
    elif root in VENDOR_ALIASES:
        canonical = VENDOR_ALIASES[root]
        was_consolidated = True
    elif was_stripped:
        canonical = root

    # ── 5. Check infrastructure blocklist ────────────────────────────────────
    # Only skip if NOT consolidated to an AI tool canonical
    if not was_consolidated:
        if root in INFRASTRUCTURE_DOMAINS or domain in INFRASTRUCTURE_DOMAINS:
            return NormalisedDomain(original, domain, root, "SKIP", f"Infrastructure/non-AI domain: {root}")

    return NormalisedDomain(
        original=original,
        canonical=canonical,
        root=root,
        action="LOOKUP",
        was_consolidated=was_consolidated,
        was_subdomain_stripped=was_stripped,
    )


def normalise_batch(domains: list[str]) -> list[NormalisedDomain]:
    """
    Normalise a list of domains and deduplicate canonicals.
    Returns one NormalisedDomain per unique canonical — never duplicates.
    """
    seen_canonicals: set[str] = set()
    results: list[NormalisedDomain] = []

    for domain in domains:
        nd = normalise(domain)

        if nd.action == "SKIP":
            continue

        # Deduplicate — if we've already seen this canonical, skip
        if nd.canonical in seen_canonicals:
            continue

        seen_canonicals.add(nd.canonical)
        results.append(nd)

    return results


def _extract_root(domain: str) -> str:
    """
    Extract root domain, handling multi-part TLDs correctly.
    mail.google.co.uk → google.co.uk (not co.uk)
    api.openai.com    → openai.com
    """
    parts = domain.split(".")

    if len(parts) <= 2:
        return domain

    # Check for multi-part TLD (co.uk, com.au etc.)
    possible_tld = ".".join(parts[-2:])
    if possible_tld in MULTI_PART_TLDS:
        if len(parts) > 2:
            return ".".join(parts[-3:])
        return domain

    # Standard: last two parts
    return ".".join(parts[-2:])
