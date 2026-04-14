import csv
import io
from typing import List
from app.services.risk_service import lookup_tool, score_tool


def parse_dns_csv(content: bytes) -> List[dict]:
    """
    Accept CSV exports from common DNS platforms.
    Tries to find a domain/hostname column automatically.
    Returns list of enriched tool dicts ready for DB insert.
    """
    text = content.decode("utf-8", errors="replace")
    reader = csv.DictReader(io.StringIO(text))
    found = []
    seen = set()

    domain_col_candidates = ["domain", "hostname", "query", "fqdn", "name", "destination"]

    for row in reader:
        headers_lower = {k.lower(): k for k in row.keys()}
        domain = None
        for candidate in domain_col_candidates:
            if candidate in headers_lower:
                domain = row[headers_lower[candidate]].strip().lower()
                break

        if not domain or domain in seen:
            continue
        seen.add(domain)

        profile = lookup_tool(domain)
        if profile:
            risk_score, risk_level = score_tool(profile)
            found.append(
                {
                    "name": profile.get("name", domain),
                    "domain": domain,
                    "category": profile.get("category"),
                    "risk_score": risk_score,
                    "risk_level": risk_level,
                    "data_classification": profile.get("data_classification"),
                    "gdpr_relevant": profile.get("gdpr_relevant"),
                    "vendor": profile.get("vendor"),
                    "source": "DNS_CSV",
                    "raw_profile": profile,
                }
            )

    return found
