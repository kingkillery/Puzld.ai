# Subagent Patterns for Deep Research

Detailed algorithms and strategies for the post-processing subagents.

## Design Principles

Each subagent follows factory-droid style:
- **Files in, files out**: No shared memory between runs
- **Reproducible**: Same input always produces same output
- **Isolated**: Can run independently or in pipeline
- **Idempotent**: Safe to re-run without side effects

## Citation Extractor

### Purpose

Parse the raw research report to extract all cited URLs and map them to the sections/claims where they appear.

### Algorithm

```python
import re
import json
from dataclasses import dataclass, asdict
from typing import Optional

@dataclass
class Citation:
    url: str
    section: str
    context: str  # Surrounding text (50 chars each side)
    line_number: int
    claim_text: Optional[str] = None  # The sentence containing the citation

URL_PATTERN = re.compile(
    r'https?://[^\s\)\]\"\'\>,]+',
    re.IGNORECASE
)

def extract_citations(report_path: str) -> list[Citation]:
    """Extract all citations with context from a report."""
    with open(report_path, 'r', encoding='utf-8') as f:
        content = f.read()
        lines = content.split('\n')

    citations = []
    current_section = "preamble"

    for line_num, line in enumerate(lines, 1):
        # Track section headers
        if line.startswith('## '):
            current_section = line[3:].strip()
            continue

        # Find URLs in this line
        for match in URL_PATTERN.finditer(line):
            url = match.group()

            # Get context window
            start = max(0, match.start() - 50)
            end = min(len(line), match.end() + 50)
            context = line[start:end]

            # Extract the containing sentence
            claim_text = extract_sentence(line, match.start())

            citations.append(Citation(
                url=url,
                section=current_section,
                context=context,
                line_number=line_num,
                claim_text=claim_text
            ))

    return citations

def extract_sentence(text: str, position: int) -> str:
    """Extract the sentence containing the given position."""
    # Find sentence boundaries
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
```

### Output Schema

```json
{
  "extracted_at": "2026-01-22T10:30:00Z",
  "source_file": "runs/2026-01-22/report.md",
  "total_citations": 15,
  "unique_domains": 8,
  "citations": [
    {
      "url": "https://example.com/article",
      "section": "Key Findings",
      "context": "...according to recent studies [https://example.com/article] the market...",
      "line_number": 45,
      "claim_text": "According to recent studies, the market grew 15% in Q3 2025."
    }
  ],
  "by_section": {
    "Key Findings": 5,
    "Analysis": 7,
    "Sources": 3
  },
  "by_domain": {
    "example.com": 3,
    "reuters.com": 2
  }
}
```

## Claim Splitter

### Purpose

Convert narrative report text into a list of atomic, verifiable claims.

### Algorithm

```python
import re
from dataclasses import dataclass
from typing import Optional

@dataclass
class Claim:
    text: str
    section: str
    citations: list[str]
    confidence: str  # high, medium, low, uncertain
    claim_type: str  # factual, opinion, prediction, definition

# Patterns indicating uncertainty
UNCERTAINTY_MARKERS = [
    r'\[UNCERTAIN\]',
    r'may\s+be',
    r'might\s+',
    r'possibly',
    r'reportedly',
    r'some\s+sources',
    r'it\s+appears',
    r'seems\s+to',
]

# Patterns indicating factual claims
FACTUAL_MARKERS = [
    r'\d+%',           # Percentages
    r'\$[\d,]+',       # Dollar amounts
    r'in\s+\d{4}',     # Year references
    r'according\s+to', # Attribution
    r'study\s+found',
    r'data\s+shows',
]

def split_into_claims(report_path: str) -> list[Claim]:
    """Split report into atomic claims."""
    with open(report_path, 'r', encoding='utf-8') as f:
        content = f.read()

    claims = []
    current_section = "preamble"

    for line in content.split('\n'):
        if line.startswith('## '):
            current_section = line[3:].strip()
            continue

        # Skip non-content lines
        if not line.strip() or line.startswith('#'):
            continue

        # Split into sentences
        sentences = re.split(r'(?<=[.!?])\s+', line)

        for sentence in sentences:
            sentence = sentence.strip()
            if len(sentence) < 20:  # Skip very short fragments
                continue

            # Extract citations from this sentence
            citations = URL_PATTERN.findall(sentence)

            # Determine confidence
            confidence = assess_confidence(sentence)

            # Determine claim type
            claim_type = classify_claim(sentence)

            claims.append(Claim(
                text=sentence,
                section=current_section,
                citations=citations,
                confidence=confidence,
                claim_type=claim_type
            ))

    return claims

def assess_confidence(text: str) -> str:
    """Assess confidence level of a claim."""
    text_lower = text.lower()

    # Check for explicit uncertainty markers
    for pattern in UNCERTAINTY_MARKERS:
        if re.search(pattern, text_lower):
            return "uncertain"

    # Check for strong factual indicators
    factual_score = sum(1 for p in FACTUAL_MARKERS if re.search(p, text_lower))

    if factual_score >= 2:
        return "high"
    elif factual_score == 1:
        return "medium"
    else:
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
```

### Output Schema

```json
{
  "extracted_at": "2026-01-22T10:35:00Z",
  "source_file": "runs/2026-01-22/report.md",
  "total_claims": 42,
  "claims": [
    {
      "id": "claim_001",
      "text": "The global market grew 15% in Q3 2025 according to Reuters.",
      "section": "Key Findings",
      "citations": ["https://reuters.com/article/123"],
      "confidence": "high",
      "claim_type": "factual"
    }
  ],
  "by_confidence": {
    "high": 12,
    "medium": 18,
    "low": 8,
    "uncertain": 4
  },
  "by_type": {
    "factual": 30,
    "prediction": 5,
    "opinion": 4,
    "definition": 3
  }
}
```

## Verifier

### Purpose

Re-fetch cited sources and check whether claims are actually supported.

### Algorithm

```python
import httpx
import asyncio
from dataclasses import dataclass
from enum import Enum

class VerificationStatus(Enum):
    SUPPORTED = "supported"          # Source clearly supports claim
    PARTIALLY_SUPPORTED = "partial"  # Source partially supports
    NOT_FOUND = "not_found"          # Claim not found in source
    CONTRADICTED = "contradicted"    # Source contradicts claim
    INACCESSIBLE = "inaccessible"    # Could not fetch source
    PAYWALL = "paywall"              # Source behind paywall

@dataclass
class VerificationResult:
    claim_id: str
    claim_text: str
    citation_url: str
    status: VerificationStatus
    evidence: str  # Relevant text from source
    notes: str

async def verify_claim(claim: dict, timeout: float = 10.0) -> VerificationResult:
    """Verify a single claim against its citation."""
    claim_id = claim["id"]
    claim_text = claim["text"]
    citations = claim.get("citations", [])

    if not citations:
        return VerificationResult(
            claim_id=claim_id,
            claim_text=claim_text,
            citation_url="",
            status=VerificationStatus.NOT_FOUND,
            evidence="",
            notes="No citation provided"
        )

    url = citations[0]  # Verify against primary citation

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.get(url, follow_redirects=True)

            if response.status_code == 403:
                return VerificationResult(
                    claim_id=claim_id,
                    claim_text=claim_text,
                    citation_url=url,
                    status=VerificationStatus.PAYWALL,
                    evidence="",
                    notes="Access denied (likely paywall)"
                )

            if response.status_code != 200:
                return VerificationResult(
                    claim_id=claim_id,
                    claim_text=claim_text,
                    citation_url=url,
                    status=VerificationStatus.INACCESSIBLE,
                    evidence="",
                    notes=f"HTTP {response.status_code}"
                )

            content = response.text

            # Search for claim keywords in source
            status, evidence = check_claim_support(claim_text, content)

            return VerificationResult(
                claim_id=claim_id,
                claim_text=claim_text,
                citation_url=url,
                status=status,
                evidence=evidence,
                notes=""
            )

    except Exception as e:
        return VerificationResult(
            claim_id=claim_id,
            claim_text=claim_text,
            citation_url=url,
            status=VerificationStatus.INACCESSIBLE,
            evidence="",
            notes=str(e)
        )

def check_claim_support(claim: str, source_content: str) -> tuple[VerificationStatus, str]:
    """Check if source content supports the claim."""
    # Extract key terms from claim
    key_terms = extract_key_terms(claim)

    # Search for terms in source
    matches = []
    for term in key_terms:
        if term.lower() in source_content.lower():
            # Find context around match
            idx = source_content.lower().find(term.lower())
            start = max(0, idx - 100)
            end = min(len(source_content), idx + len(term) + 100)
            matches.append(source_content[start:end])

    if len(matches) >= len(key_terms) * 0.7:
        return VerificationStatus.SUPPORTED, matches[0] if matches else ""
    elif matches:
        return VerificationStatus.PARTIALLY_SUPPORTED, matches[0]
    else:
        return VerificationStatus.NOT_FOUND, ""

def extract_key_terms(text: str) -> list[str]:
    """Extract key terms for verification matching."""
    import re

    # Extract numbers, proper nouns, technical terms
    terms = []

    # Numbers with context
    terms.extend(re.findall(r'\d+(?:\.\d+)?%?', text))

    # Quoted terms
    terms.extend(re.findall(r'"([^"]+)"', text))

    # Capitalized phrases (likely proper nouns)
    terms.extend(re.findall(r'[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*', text))

    return [t for t in terms if len(t) > 2]

async def verify_all_claims(claims_path: str, max_concurrent: int = 5) -> list[VerificationResult]:
    """Verify all claims with rate limiting."""
    with open(claims_path, 'r') as f:
        data = json.load(f)

    claims = data["claims"]
    semaphore = asyncio.Semaphore(max_concurrent)

    async def limited_verify(claim):
        async with semaphore:
            return await verify_claim(claim)

    results = await asyncio.gather(*[limited_verify(c) for c in claims])
    return results
```

### Output Schema

```json
{
  "verified_at": "2026-01-22T10:45:00Z",
  "claims_file": "runs/2026-01-22/claims.json",
  "total_verified": 42,
  "results": [
    {
      "claim_id": "claim_001",
      "claim_text": "The global market grew 15% in Q3 2025.",
      "citation_url": "https://reuters.com/article/123",
      "status": "supported",
      "evidence": "...market expanded by 15 percent during the third quarter...",
      "notes": ""
    }
  ],
  "summary": {
    "supported": 25,
    "partial": 8,
    "not_found": 4,
    "contradicted": 1,
    "inaccessible": 3,
    "paywall": 1
  }
}
```

## Compiler

### Purpose

Merge raw report, citations, claims, and verification into final deliverable.

### Template Structure

```markdown
# Research Report: {title}

Generated: {timestamp}
Verification Status: {verified_count}/{total_claims} claims verified

---

## Executive Summary

{executive_summary}

**Confidence Assessment:**
- High confidence claims: {high_count}
- Claims requiring review: {review_count}
- Unverified claims: {unverified_count}

---

## Key Findings

{findings_with_verification_badges}

---

## Detailed Analysis

{analysis_sections}

---

## Verification Notes

### Supported Claims
{supported_claims_list}

### Claims Requiring Review
{review_claims_list}

### Inaccessible Sources
{inaccessible_list}

---

## Sources

{numbered_source_list}

---

## Methodology

This report was generated using Gemini Deep Research with automated
citation extraction and verification. {verification_rate}% of cited
claims were independently verified against source material.

Verification performed: {verification_timestamp}
```

### Compilation Algorithm

```python
from datetime import datetime
from pathlib import Path

def compile_report(run_dir: str) -> str:
    """Compile all artifacts into final report."""
    run_path = Path(run_dir)

    # Load all artifacts
    with open(run_path / "report.md") as f:
        raw_report = f.read()

    with open(run_path / "citations.json") as f:
        citations = json.load(f)

    with open(run_path / "claims.json") as f:
        claims = json.load(f)

    with open(run_path / "verification.json") as f:
        verification = json.load(f)

    # Build verification lookup
    verification_map = {
        r["claim_id"]: r for r in verification["results"]
    }

    # Parse raw report sections
    sections = parse_sections(raw_report)

    # Add verification badges to findings
    findings = add_verification_badges(
        sections.get("key_findings", ""),
        claims["claims"],
        verification_map
    )

    # Build final report
    template = load_template()
    final = template.format(
        title=extract_title(raw_report),
        timestamp=datetime.now().isoformat(),
        verified_count=verification["summary"]["supported"],
        total_claims=claims["total_claims"],
        executive_summary=sections.get("executive_summary", ""),
        high_count=claims["by_confidence"]["high"],
        review_count=claims["by_confidence"]["low"] + claims["by_confidence"]["uncertain"],
        unverified_count=verification["summary"]["inaccessible"],
        findings_with_verification_badges=findings,
        analysis_sections=sections.get("analysis", ""),
        supported_claims_list=format_claims_by_status(verification, "supported"),
        review_claims_list=format_claims_by_status(verification, "partial"),
        inaccessible_list=format_claims_by_status(verification, "inaccessible"),
        numbered_source_list=format_sources(citations),
        verification_rate=calculate_verification_rate(verification),
        verification_timestamp=verification["verified_at"]
    )

    return final

def add_verification_badges(text: str, claims: list, verification_map: dict) -> str:
    """Add verification status badges to claims in text."""
    BADGES = {
        "supported": "[VERIFIED]",
        "partial": "[PARTIAL]",
        "not_found": "[UNVERIFIED]",
        "contradicted": "[DISPUTED]",
        "inaccessible": "[SOURCE N/A]",
        "paywall": "[PAYWALL]",
    }

    result = text
    for claim in claims:
        claim_id = claim["id"]
        if claim_id in verification_map:
            status = verification_map[claim_id]["status"]
            badge = BADGES.get(status, "")
            # Insert badge after claim text
            claim_text = claim["text"]
            if claim_text in result:
                result = result.replace(claim_text, f"{claim_text} {badge}")

    return result
```

## Pipeline Orchestration

### Sequential Execution

```python
def run_pipeline(prompt: str, output_dir: str) -> dict:
    """Run full research pipeline sequentially."""
    from pathlib import Path
    import shutil

    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    # 1. Save prompt
    (out / "prompt.txt").write_text(prompt)

    # 2. Submit and poll
    job_id = submit_research(prompt)
    report = poll_until_done(job_id)
    (out / "report.md").write_text(report)

    # 3. Extract citations
    citations = extract_citations(out / "report.md")
    (out / "citations.json").write_text(json.dumps(citations, indent=2))

    # 4. Extract claims
    claims = split_into_claims(out / "report.md")
    (out / "claims.json").write_text(json.dumps(claims, indent=2))

    # 5. Verify claims
    verification = asyncio.run(verify_all_claims(out / "claims.json"))
    (out / "verification.json").write_text(json.dumps(verification, indent=2))

    # 6. Compile final report
    final = compile_report(output_dir)
    (out / "final.md").write_text(final)

    return {
        "output_dir": str(out),
        "report": report,
        "citations": citations,
        "claims": claims,
        "verification": verification,
        "final": final
    }
```

### Parallel Extraction

```python
async def run_pipeline_parallel(prompt: str, output_dir: str) -> dict:
    """Run pipeline with parallel extraction steps."""
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    # Sequential: submit and poll
    (out / "prompt.txt").write_text(prompt)
    job_id = submit_research(prompt)
    report = poll_until_done(job_id)
    (out / "report.md").write_text(report)

    # Parallel: extract citations and claims
    citations, claims = await asyncio.gather(
        asyncio.to_thread(extract_citations, out / "report.md"),
        asyncio.to_thread(split_into_claims, out / "report.md")
    )

    (out / "citations.json").write_text(json.dumps(citations, indent=2))
    (out / "claims.json").write_text(json.dumps(claims, indent=2))

    # Sequential: verify (depends on claims)
    verification = await verify_all_claims(out / "claims.json")
    (out / "verification.json").write_text(json.dumps(verification, indent=2))

    # Compile
    final = compile_report(output_dir)
    (out / "final.md").write_text(final)

    return {...}
```
