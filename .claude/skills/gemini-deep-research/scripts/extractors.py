#!/usr/bin/env python3
"""
Extraction utilities for Deep Research reports.

Code Mode API for citation and claim extraction without running full CLI.

Usage:
    from extractors import CitationExtractor, ClaimExtractor, Verifier

    # Extract citations
    extractor = CitationExtractor()
    citations = extractor.extract("path/to/report.md")

    # Extract claims
    splitter = ClaimExtractor()
    claims = splitter.extract("path/to/report.md")

    # Verify claims
    verifier = Verifier()
    results = await verifier.verify_all("path/to/claims.json")
"""

import asyncio
import json
import re
from dataclasses import asdict, dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Optional

# Optional httpx for verification
try:
    import httpx
    HAS_HTTPX = True
except ImportError:
    HAS_HTTPX = False


# =============================================================================
# Data Classes
# =============================================================================

@dataclass
class Citation:
    """A citation extracted from a report."""
    url: str
    section: str
    context: str
    line_number: int
    claim_text: Optional[str] = None

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class Claim:
    """An atomic claim extracted from a report."""
    id: str
    text: str
    section: str
    citations: list = field(default_factory=list)
    confidence: str = "low"
    claim_type: str = "factual"

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class VerificationResult:
    """Result of verifying a claim against its source."""
    claim_id: str
    claim_text: str
    citation_url: str
    status: str  # supported, partial, not_found, contradicted, inaccessible, paywall
    evidence: str
    notes: str

    def to_dict(self) -> dict:
        return asdict(self)


# =============================================================================
# Citation Extractor
# =============================================================================

class CitationExtractor:
    """Extract citations from markdown reports."""

    URL_PATTERN = re.compile(r'https?://[^\s\)\]\"\'\>,]+', re.IGNORECASE)

    def extract(self, report_path: str) -> dict:
        """
        Extract all citations from a report.

        Args:
            report_path: Path to the markdown report

        Returns:
            Dictionary with citations, statistics, and metadata
        """
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

            for match in self.URL_PATTERN.finditer(line):
                url = match.group()

                # Get context window
                start = max(0, match.start() - 50)
                end = min(len(line), match.end() + 50)
                context = line[start:end]

                # Extract containing sentence
                claim_text = self._extract_sentence(line, match.start())

                citation = Citation(
                    url=url,
                    section=current_section,
                    context=context,
                    line_number=line_num,
                    claim_text=claim_text
                )
                citations.append(citation.to_dict())

                # Track statistics
                by_section[current_section] = by_section.get(current_section, 0) + 1

                try:
                    domain = url.split('/')[2]
                    by_domain[domain] = by_domain.get(domain, 0) + 1
                except IndexError:
                    pass

        return {
            "extracted_at": datetime.now().isoformat(),
            "source_file": str(report_path),
            "total_citations": len(citations),
            "unique_domains": len(by_domain),
            "citations": citations,
            "by_section": by_section,
            "by_domain": by_domain,
        }

    def _extract_sentence(self, text: str, position: int) -> str:
        """Extract the sentence containing the given position."""
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

    def extract_to_file(self, report_path: str, output_path: Optional[str] = None) -> str:
        """Extract citations and save to JSON file."""
        result = self.extract(report_path)

        if output_path is None:
            output_path = Path(report_path).parent / "citations.json"

        with open(output_path, 'w') as f:
            json.dump(result, f, indent=2)

        return str(output_path)


# =============================================================================
# Claim Extractor
# =============================================================================

class ClaimExtractor:
    """Extract atomic claims from markdown reports."""

    URL_PATTERN = re.compile(r'https?://[^\s\)\]\"\'\>,]+', re.IGNORECASE)

    UNCERTAINTY_MARKERS = [
        r'\[UNCERTAIN\]', r'may\s+be', r'might\s+', r'possibly',
        r'reportedly', r'some\s+sources', r'it\s+appears', r'seems\s+to',
    ]

    FACTUAL_MARKERS = [
        r'\d+%', r'\$[\d,]+', r'in\s+\d{4}', r'according\s+to',
        r'study\s+found', r'data\s+shows',
    ]

    def extract(self, report_path: str) -> dict:
        """
        Extract atomic claims from a report.

        Args:
            report_path: Path to the markdown report

        Returns:
            Dictionary with claims, statistics, and metadata
        """
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

            # Split into sentences
            sentences = re.split(r'(?<=[.!?])\s+', line)

            for sentence in sentences:
                sentence = sentence.strip()
                if len(sentence) < 20:
                    continue

                claim_id += 1
                citations = self.URL_PATTERN.findall(sentence)
                confidence = self._assess_confidence(sentence)
                claim_type = self._classify_claim(sentence)

                claim = Claim(
                    id=f"claim_{claim_id:03d}",
                    text=sentence,
                    section=current_section,
                    citations=citations,
                    confidence=confidence,
                    claim_type=claim_type
                )
                claims.append(claim.to_dict())

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

    def _assess_confidence(self, text: str) -> str:
        """Assess confidence level of a claim."""
        text_lower = text.lower()

        for pattern in self.UNCERTAINTY_MARKERS:
            if re.search(pattern, text_lower):
                return "uncertain"

        factual_score = sum(1 for p in self.FACTUAL_MARKERS if re.search(p, text_lower))

        if factual_score >= 2:
            return "high"
        elif factual_score == 1:
            return "medium"
        return "low"

    def _classify_claim(self, text: str) -> str:
        """Classify the type of claim."""
        text_lower = text.lower()

        if re.search(r'will\s+|expect|forecast|predict', text_lower):
            return "prediction"
        if re.search(r'is\s+defined\s+as|refers\s+to|means\s+that', text_lower):
            return "definition"
        if re.search(r'should|ought|better|worse|best|worst', text_lower):
            return "opinion"

        return "factual"

    def extract_to_file(self, report_path: str, output_path: Optional[str] = None) -> str:
        """Extract claims and save to JSON file."""
        result = self.extract(report_path)

        if output_path is None:
            output_path = Path(report_path).parent / "claims.json"

        with open(output_path, 'w') as f:
            json.dump(result, f, indent=2)

        return str(output_path)


# =============================================================================
# Verifier
# =============================================================================

class Verifier:
    """Verify claims against their cited sources."""

    def __init__(self, timeout: float = 10.0, max_concurrent: int = 5):
        self.timeout = timeout
        self.max_concurrent = max_concurrent

    async def verify_claim(self, claim: dict) -> dict:
        """Verify a single claim against its citation."""
        if not HAS_HTTPX:
            return VerificationResult(
                claim_id=claim["id"],
                claim_text=claim["text"],
                citation_url="",
                status="skipped",
                evidence="",
                notes="httpx not installed"
            ).to_dict()

        citations = claim.get("citations", [])
        if not citations:
            return VerificationResult(
                claim_id=claim["id"],
                claim_text=claim["text"],
                citation_url="",
                status="not_found",
                evidence="",
                notes="No citation provided"
            ).to_dict()

        url = citations[0]

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, follow_redirects=True)

                if response.status_code == 403:
                    return VerificationResult(
                        claim_id=claim["id"],
                        claim_text=claim["text"],
                        citation_url=url,
                        status="paywall",
                        evidence="",
                        notes="Access denied (likely paywall)"
                    ).to_dict()

                if response.status_code != 200:
                    return VerificationResult(
                        claim_id=claim["id"],
                        claim_text=claim["text"],
                        citation_url=url,
                        status="inaccessible",
                        evidence="",
                        notes=f"HTTP {response.status_code}"
                    ).to_dict()

                content = response.text
                status, evidence = self._check_claim_support(claim["text"], content)

                return VerificationResult(
                    claim_id=claim["id"],
                    claim_text=claim["text"],
                    citation_url=url,
                    status=status,
                    evidence=evidence[:500] if evidence else "",
                    notes=""
                ).to_dict()

        except Exception as e:
            return VerificationResult(
                claim_id=claim["id"],
                claim_text=claim["text"],
                citation_url=url,
                status="inaccessible",
                evidence="",
                notes=str(e)[:200]
            ).to_dict()

    def _check_claim_support(self, claim: str, source_content: str) -> tuple:
        """Check if source content supports the claim."""
        key_terms = self._extract_key_terms(claim)

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

    def _extract_key_terms(self, text: str) -> list:
        """Extract key terms for verification matching."""
        terms = []
        terms.extend(re.findall(r'\d+(?:\.\d+)?%?', text))
        terms.extend(re.findall(r'"([^"]+)"', text))
        terms.extend(re.findall(r'[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*', text))
        return [t for t in terms if len(t) > 2]

    async def verify_all(self, claims_path: str) -> dict:
        """Verify all claims in a claims.json file."""
        with open(claims_path, 'r') as f:
            data = json.load(f)

        claims = data["claims"]
        semaphore = asyncio.Semaphore(self.max_concurrent)

        async def limited_verify(claim):
            async with semaphore:
                return await self.verify_claim(claim)

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

    def verify_all_sync(self, claims_path: str) -> dict:
        """Synchronous wrapper for verify_all."""
        return asyncio.run(self.verify_all(claims_path))

    def verify_to_file(self, claims_path: str, output_path: Optional[str] = None) -> str:
        """Verify claims and save results to JSON file."""
        result = self.verify_all_sync(claims_path)

        if output_path is None:
            output_path = Path(claims_path).parent / "verification.json"

        with open(output_path, 'w') as f:
            json.dump(result, f, indent=2)

        return str(output_path)


# =============================================================================
# Code Mode API
# =============================================================================

class DeepResearchExtractors:
    """
    Unified Code Mode API for Deep Research extraction.

    Usage:
        dr = DeepResearchExtractors()
        citations = dr.extract_citations("report.md")
        claims = dr.extract_claims("report.md")
        verification = dr.verify_claims("claims.json")
    """

    def __init__(self):
        self.citation_extractor = CitationExtractor()
        self.claim_extractor = ClaimExtractor()
        self.verifier = Verifier()

    def extract_citations(self, report_path: str) -> dict:
        """Extract citations from a report."""
        return self.citation_extractor.extract(report_path)

    def extract_claims(self, report_path: str) -> dict:
        """Extract claims from a report."""
        return self.claim_extractor.extract(report_path)

    def verify_claims(self, claims_path: str) -> dict:
        """Verify claims against their sources."""
        return self.verifier.verify_all_sync(claims_path)

    def extract_all(self, report_path: str, output_dir: Optional[str] = None) -> dict:
        """
        Extract both citations and claims, save to files.

        Returns dict with paths to output files.
        """
        if output_dir is None:
            output_dir = Path(report_path).parent

        out = Path(output_dir)

        citations = self.extract_citations(report_path)
        claims = self.extract_claims(report_path)

        citations_path = out / "citations.json"
        claims_path = out / "claims.json"

        with open(citations_path, 'w') as f:
            json.dump(citations, f, indent=2)

        with open(claims_path, 'w') as f:
            json.dump(claims, f, indent=2)

        return {
            "citations_path": str(citations_path),
            "claims_path": str(claims_path),
            "total_citations": citations["total_citations"],
            "total_claims": claims["total_claims"],
        }


# Singleton for Code Mode usage
extractors = DeepResearchExtractors()


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python extractors.py <report.md>")
        sys.exit(1)

    report_path = sys.argv[1]
    dr = DeepResearchExtractors()
    result = dr.extract_all(report_path)
    print(json.dumps(result, indent=2))
