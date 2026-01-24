#!/usr/bin/env python3
"""
Gemini Deep Research CLI

Submit research jobs, poll for completion, extract citations/claims,
verify against sources, and compile final reports.

Usage:
    python research.py run "Your research question" --out runs/latest/
    python research.py submit "Research question"
    python research.py poll <job_id> --out runs/latest/
    python research.py extract runs/latest/report.md
    python research.py verify runs/latest/claims.json
    python research.py compile runs/latest/
"""

import argparse
import asyncio
import json
import os
import re
import sys
import time
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path
from typing import Optional

# Optional imports with fallbacks
try:
    from google import genai
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False

try:
    import httpx
    HAS_HTTPX = True
except ImportError:
    HAS_HTTPX = False


# =============================================================================
# Configuration
# =============================================================================

DEEP_RESEARCH_MODEL = os.environ.get(
    "GEMINI_MODEL",
    "gemini-2.0-flash-thinking-exp"
)

RESEARCH_CONFIG = {
    "temperature": 0.7,
    "max_output_tokens": 8192,
}

SYSTEM_PROMPT = """
You are a research assistant producing well-cited reports.

Requirements:
- Cite all factual claims with URLs
- Use markdown formatting
- Include an executive summary
- Flag low-confidence statements with [UNCERTAIN]
- Prefer primary sources over aggregators
- Include a "Sources" section at the end

Output format:
## Executive Summary
[2-3 sentence overview]

## Key Findings
[Numbered findings with inline citations]

## Analysis
[Detailed discussion]

## Risks and Unknowns
[Caveats and limitations]

## Sources
[Numbered list of all URLs cited]
"""


# =============================================================================
# Data Classes
# =============================================================================

@dataclass
class Citation:
    url: str
    section: str
    context: str
    line_number: int
    claim_text: Optional[str] = None


@dataclass
class Claim:
    id: str
    text: str
    section: str
    citations: list
    confidence: str
    claim_type: str


@dataclass
class VerificationResult:
    claim_id: str
    claim_text: str
    citation_url: str
    status: str
    evidence: str
    notes: str


# =============================================================================
# API Functions
# =============================================================================

def get_client():
    """Get Gemini API client."""
    if not HAS_GENAI:
        raise ImportError("google-genai not installed. Run: pip install google-genai")

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable not set")

    return genai.Client(api_key=api_key)


def submit_research(prompt: str) -> str:
    """Submit research job and return job ID (or result for sync mode)."""
    client = get_client()

    full_prompt = f"{SYSTEM_PROMPT}\n\n---\n\nResearch Request:\n{prompt}"

    print(f"[submit] Sending to {DEEP_RESEARCH_MODEL}...")

    response = client.models.generate_content(
        model=DEEP_RESEARCH_MODEL,
        contents=full_prompt,
        config=RESEARCH_CONFIG,
    )

    # For sync mode, return the text directly
    # The "job_id" is a placeholder for async patterns
    return response.text


def submit_research_streaming(prompt: str):
    """Submit with streaming response."""
    client = get_client()

    full_prompt = f"{SYSTEM_PROMPT}\n\n---\n\nResearch Request:\n{prompt}"

    print(f"[submit] Streaming from {DEEP_RESEARCH_MODEL}...")

    response = client.models.generate_content_stream(
        model=DEEP_RESEARCH_MODEL,
        contents=full_prompt,
        config=RESEARCH_CONFIG,
    )

    full_text = ""
    for chunk in response:
        if chunk.text:
            full_text += chunk.text
            print(chunk.text, end="", flush=True)

    print()  # Newline after streaming
    return full_text


# =============================================================================
# Extraction Functions
# =============================================================================

URL_PATTERN = re.compile(r'https?://[^\s\)\]\"\'\>,]+', re.IGNORECASE)

UNCERTAINTY_MARKERS = [
    r'\[UNCERTAIN\]', r'may\s+be', r'might\s+', r'possibly',
    r'reportedly', r'some\s+sources', r'it\s+appears', r'seems\s+to',
]

FACTUAL_MARKERS = [
    r'\d+%', r'\$[\d,]+', r'in\s+\d{4}', r'according\s+to',
    r'study\s+found', r'data\s+shows',
]


def extract_sentence(text: str, position: int) -> str:
    """Extract sentence containing the given position."""
    sentence_ends = re.compile(r'[.!?]\s+')

    start = 0
    for match in sentence_ends.finditer(text):
        if match.end() <= position:
            start = match.end()
        else:
            break

    end = len(text)
    for match in sentence_ends.finditer(text[position:]):
        end = position + match.end()
        break

    return text[start:end].strip()


def extract_citations(report_path: str) -> dict:
    """Extract all citations from a report."""
    with open(report_path, 'r', encoding='utf-8') as f:
        content = f.read()
        lines = content.split('\n')

    citations = []
    current_section = "preamble"
    by_section = {}
    by_domain = {}

    for line_num, line in enumerate(lines, 1):
        if line.startswith('## '):
            current_section = line[3:].strip()
            continue

        for match in URL_PATTERN.finditer(line):
            url = match.group()

            # Get context
            start = max(0, match.start() - 50)
            end = min(len(line), match.end() + 50)
            context = line[start:end]

            claim_text = extract_sentence(line, match.start())

            citations.append(asdict(Citation(
                url=url,
                section=current_section,
                context=context,
                line_number=line_num,
                claim_text=claim_text
            )))

            # Track by section
            by_section[current_section] = by_section.get(current_section, 0) + 1

            # Track by domain
            try:
                domain = url.split('/')[2]
                by_domain[domain] = by_domain.get(domain, 0) + 1
            except IndexError:
                pass

    unique_domains = len(by_domain)

    return {
        "extracted_at": datetime.now().isoformat(),
        "source_file": str(report_path),
        "total_citations": len(citations),
        "unique_domains": unique_domains,
        "citations": citations,
        "by_section": by_section,
        "by_domain": by_domain,
    }


def assess_confidence(text: str) -> str:
    """Assess confidence level of a claim."""
    text_lower = text.lower()

    for pattern in UNCERTAINTY_MARKERS:
        if re.search(pattern, text_lower):
            return "uncertain"

    factual_score = sum(1 for p in FACTUAL_MARKERS if re.search(p, text_lower))

    if factual_score >= 2:
        return "high"
    elif factual_score == 1:
        return "medium"
    return "low"


def classify_claim(text: str) -> str:
    """Classify the type of claim."""
    text_lower = text.lower()

    if re.search(r'will\s+|expect|forecast|predict', text_lower):
        return "prediction"
    if re.search(r'is\s+defined\s+as|refers\s+to|means\s+that', text_lower):
        return "definition"
    if re.search(r'should|ought|better|worse|best|worst', text_lower):
        return "opinion"

    return "factual"


def extract_claims(report_path: str) -> dict:
    """Extract atomic claims from a report."""
    with open(report_path, 'r', encoding='utf-8') as f:
        content = f.read()

    claims = []
    current_section = "preamble"
    claim_id = 0

    by_confidence = {"high": 0, "medium": 0, "low": 0, "uncertain": 0}
    by_type = {"factual": 0, "prediction": 0, "opinion": 0, "definition": 0}

    for line in content.split('\n'):
        if line.startswith('## '):
            current_section = line[3:].strip()
            continue

        if not line.strip() or line.startswith('#'):
            continue

        sentences = re.split(r'(?<=[.!?])\s+', line)

        for sentence in sentences:
            sentence = sentence.strip()
            if len(sentence) < 20:
                continue

            claim_id += 1
            citations = URL_PATTERN.findall(sentence)
            confidence = assess_confidence(sentence)
            claim_type = classify_claim(sentence)

            claims.append(asdict(Claim(
                id=f"claim_{claim_id:03d}",
                text=sentence,
                section=current_section,
                citations=citations,
                confidence=confidence,
                claim_type=claim_type
            )))

            by_confidence[confidence] += 1
            by_type[claim_type] += 1

    return {
        "extracted_at": datetime.now().isoformat(),
        "source_file": str(report_path),
        "total_claims": len(claims),
        "claims": claims,
        "by_confidence": by_confidence,
        "by_type": by_type,
    }


# =============================================================================
# Verification Functions
# =============================================================================

def extract_key_terms(text: str) -> list:
    """Extract key terms for verification matching."""
    terms = []
    terms.extend(re.findall(r'\d+(?:\.\d+)?%?', text))
    terms.extend(re.findall(r'"([^"]+)"', text))
    terms.extend(re.findall(r'[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*', text))
    return [t for t in terms if len(t) > 2]


def check_claim_support(claim: str, source_content: str) -> tuple:
    """Check if source content supports the claim."""
    key_terms = extract_key_terms(claim)

    matches = []
    for term in key_terms:
        if term.lower() in source_content.lower():
            idx = source_content.lower().find(term.lower())
            start = max(0, idx - 100)
            end = min(len(source_content), idx + len(term) + 100)
            matches.append(source_content[start:end])

    if len(matches) >= len(key_terms) * 0.7:
        return "supported", matches[0] if matches else ""
    elif matches:
        return "partial", matches[0]
    return "not_found", ""


async def verify_claim(claim: dict, timeout: float = 10.0) -> dict:
    """Verify a single claim against its citation."""
    if not HAS_HTTPX:
        return asdict(VerificationResult(
            claim_id=claim["id"],
            claim_text=claim["text"],
            citation_url="",
            status="skipped",
            evidence="",
            notes="httpx not installed"
        ))

    citations = claim.get("citations", [])
    if not citations:
        return asdict(VerificationResult(
            claim_id=claim["id"],
            claim_text=claim["text"],
            citation_url="",
            status="not_found",
            evidence="",
            notes="No citation provided"
        ))

    url = citations[0]

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.get(url, follow_redirects=True)

            if response.status_code == 403:
                return asdict(VerificationResult(
                    claim_id=claim["id"],
                    claim_text=claim["text"],
                    citation_url=url,
                    status="paywall",
                    evidence="",
                    notes="Access denied (likely paywall)"
                ))

            if response.status_code != 200:
                return asdict(VerificationResult(
                    claim_id=claim["id"],
                    claim_text=claim["text"],
                    citation_url=url,
                    status="inaccessible",
                    evidence="",
                    notes=f"HTTP {response.status_code}"
                ))

            content = response.text
            status, evidence = check_claim_support(claim["text"], content)

            return asdict(VerificationResult(
                claim_id=claim["id"],
                claim_text=claim["text"],
                citation_url=url,
                status=status,
                evidence=evidence[:500] if evidence else "",
                notes=""
            ))

    except Exception as e:
        return asdict(VerificationResult(
            claim_id=claim["id"],
            claim_text=claim["text"],
            citation_url=url,
            status="inaccessible",
            evidence="",
            notes=str(e)[:200]
        ))


async def verify_all_claims(claims_path: str, max_concurrent: int = 5) -> dict:
    """Verify all claims with rate limiting."""
    with open(claims_path, 'r') as f:
        data = json.load(f)

    claims = data["claims"]
    semaphore = asyncio.Semaphore(max_concurrent)

    async def limited_verify(claim):
        async with semaphore:
            return await verify_claim(claim)

    print(f"[verify] Checking {len(claims)} claims...")
    results = await asyncio.gather(*[limited_verify(c) for c in claims])

    summary = {}
    for r in results:
        status = r["status"]
        summary[status] = summary.get(status, 0) + 1

    return {
        "verified_at": datetime.now().isoformat(),
        "claims_file": str(claims_path),
        "total_verified": len(results),
        "results": results,
        "summary": summary,
    }


# =============================================================================
# Compilation Functions
# =============================================================================

def compile_report(run_dir: str) -> str:
    """Compile all artifacts into final report."""
    run_path = Path(run_dir)

    # Load artifacts
    report = (run_path / "report.md").read_text(encoding='utf-8')

    citations = {}
    if (run_path / "citations.json").exists():
        citations = json.loads((run_path / "citations.json").read_text())

    claims = {}
    if (run_path / "claims.json").exists():
        claims = json.loads((run_path / "claims.json").read_text())

    verification = {"summary": {}, "results": []}
    if (run_path / "verification.json").exists():
        verification = json.loads((run_path / "verification.json").read_text())

    # Build verification badges
    BADGES = {
        "supported": "[VERIFIED]",
        "partial": "[PARTIAL]",
        "not_found": "[UNVERIFIED]",
        "contradicted": "[DISPUTED]",
        "inaccessible": "[SOURCE N/A]",
        "paywall": "[PAYWALL]",
        "skipped": "[SKIPPED]",
    }

    # Add verification summary
    summary = verification.get("summary", {})
    total_claims = claims.get("total_claims", 0)
    verified_count = summary.get("supported", 0) + summary.get("partial", 0)

    header = f"""# Research Report

Generated: {datetime.now().isoformat()}
Total Claims: {total_claims}
Verified: {verified_count}
Verification Summary: {json.dumps(summary)}

---

"""

    # Append verification notes
    footer = """

---

## Verification Notes

"""
    for result in verification.get("results", []):
        badge = BADGES.get(result["status"], "")
        footer += f"- **{result['claim_id']}** {badge}: {result['claim_text'][:100]}...\n"

    return header + report + footer


# =============================================================================
# CLI Commands
# =============================================================================

def cmd_submit(args):
    """Submit a research job."""
    if args.file:
        with open(args.file, 'r') as f:
            prompt = f.read()
    else:
        prompt = args.prompt

    if args.stream:
        result = submit_research_streaming(prompt)
    else:
        result = submit_research(prompt)

    print(f"\n[submit] Received {len(result)} chars")

    if args.out:
        out_path = Path(args.out)
        out_path.mkdir(parents=True, exist_ok=True)
        (out_path / "prompt.txt").write_text(prompt)
        (out_path / "report.md").write_text(result)
        print(f"[submit] Saved to {out_path}")


def cmd_extract(args):
    """Extract citations and claims from a report."""
    report_path = Path(args.report)
    out_dir = report_path.parent

    print(f"[extract] Processing {report_path}")

    citations = extract_citations(str(report_path))
    claims = extract_claims(str(report_path))

    (out_dir / "citations.json").write_text(json.dumps(citations, indent=2))
    (out_dir / "claims.json").write_text(json.dumps(claims, indent=2))

    print(f"[extract] Found {citations['total_citations']} citations")
    print(f"[extract] Found {claims['total_claims']} claims")
    print(f"[extract] Saved to {out_dir}")


def cmd_verify(args):
    """Verify claims against their sources."""
    claims_path = Path(args.claims)
    out_dir = claims_path.parent

    print(f"[verify] Processing {claims_path}")

    verification = asyncio.run(verify_all_claims(str(claims_path)))

    (out_dir / "verification.json").write_text(json.dumps(verification, indent=2))

    print(f"[verify] Results: {verification['summary']}")
    print(f"[verify] Saved to {out_dir}")


def cmd_compile(args):
    """Compile final report from all artifacts."""
    run_dir = Path(args.run_dir)

    print(f"[compile] Processing {run_dir}")

    final = compile_report(str(run_dir))

    (run_dir / "final.md").write_text(final)

    print(f"[compile] Saved final.md ({len(final)} chars)")


def cmd_run(args):
    """Run full research pipeline."""
    if args.file:
        with open(args.file, 'r') as f:
            prompt = f.read()
    else:
        prompt = args.prompt

    out_dir = Path(args.out or f"runs/{datetime.now().strftime('%Y-%m-%d_%H%M%S')}")
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"[run] Output: {out_dir}")

    # 1. Save prompt
    (out_dir / "prompt.txt").write_text(prompt)
    print("[run] Step 1/5: Saved prompt")

    # 2. Submit research
    print("[run] Step 2/5: Submitting research...")
    if args.stream:
        report = submit_research_streaming(prompt)
    else:
        report = submit_research(prompt)
    (out_dir / "report.md").write_text(report)
    print(f"[run] Received {len(report)} chars")

    # 3. Extract
    print("[run] Step 3/5: Extracting citations and claims...")
    citations = extract_citations(str(out_dir / "report.md"))
    claims = extract_claims(str(out_dir / "report.md"))
    (out_dir / "citations.json").write_text(json.dumps(citations, indent=2))
    (out_dir / "claims.json").write_text(json.dumps(claims, indent=2))
    print(f"[run] Found {citations['total_citations']} citations, {claims['total_claims']} claims")

    # 4. Verify
    print("[run] Step 4/5: Verifying claims...")
    verification = asyncio.run(verify_all_claims(str(out_dir / "claims.json")))
    (out_dir / "verification.json").write_text(json.dumps(verification, indent=2))
    print(f"[run] Verification: {verification['summary']}")

    # 5. Compile
    print("[run] Step 5/5: Compiling final report...")
    final = compile_report(str(out_dir))
    (out_dir / "final.md").write_text(final)

    print(f"\n[run] Complete! Output in {out_dir}")
    print(f"[run] - report.md: Raw research output")
    print(f"[run] - citations.json: {citations['total_citations']} citations")
    print(f"[run] - claims.json: {claims['total_claims']} claims")
    print(f"[run] - verification.json: {verification['summary']}")
    print(f"[run] - final.md: Compiled report")


# =============================================================================
# Main
# =============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="Gemini Deep Research CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # submit
    p_submit = subparsers.add_parser("submit", help="Submit a research job")
    p_submit.add_argument("prompt", nargs="?", help="Research prompt")
    p_submit.add_argument("--file", "-f", help="Read prompt from file")
    p_submit.add_argument("--out", "-o", help="Output directory")
    p_submit.add_argument("--stream", "-s", action="store_true", help="Stream response")

    # extract
    p_extract = subparsers.add_parser("extract", help="Extract citations and claims")
    p_extract.add_argument("report", help="Path to report.md")

    # verify
    p_verify = subparsers.add_parser("verify", help="Verify claims against sources")
    p_verify.add_argument("claims", help="Path to claims.json")

    # compile
    p_compile = subparsers.add_parser("compile", help="Compile final report")
    p_compile.add_argument("run_dir", help="Run directory containing artifacts")

    # run (full pipeline)
    p_run = subparsers.add_parser("run", help="Run full research pipeline")
    p_run.add_argument("prompt", nargs="?", help="Research prompt")
    p_run.add_argument("--file", "-f", help="Read prompt from file")
    p_run.add_argument("--out", "-o", help="Output directory")
    p_run.add_argument("--stream", "-s", action="store_true", help="Stream response")

    args = parser.parse_args()

    if args.command == "submit":
        if not args.prompt and not args.file:
            p_submit.error("Either prompt or --file required")
        cmd_submit(args)
    elif args.command == "extract":
        cmd_extract(args)
    elif args.command == "verify":
        cmd_verify(args)
    elif args.command == "compile":
        cmd_compile(args)
    elif args.command == "run":
        if not args.prompt and not args.file:
            p_run.error("Either prompt or --file required")
        cmd_run(args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
