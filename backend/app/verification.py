"""Pure matching helpers for document verification (no I/O, fully unit-testable).

Design goals
------------
* OCR-tolerant: certificate IDs are 12-char hex strings, so the usual OCR
  confusions (O/0, l/I/1, S/5, Z/2) are repaired before comparing.
* Strict where it matters: names must match token-by-token (order-insensitive,
  small OCR typos tolerated). Substring / 70%-overlap matching is NOT used.
* Missing data is never silently treated as a match: callers receive
  "missing" so they can answer *manual_review* instead of *verified*.
"""

from __future__ import annotations

import difflib
import re

_HEX = set("0123456789abcdef")
_CONFUSABLE = {"o": "0", "q": "0", "i": "1", "l": "1", "|": "1", "s": "5", "z": "2", "g": "9", "b": "6"}

MATCH = "match"
MISMATCH = "mismatch"
MISSING = "missing"


def normalize_text(value: str | None) -> str:
    cleaned = "".join(ch.lower() if ch.isalnum() else " " for ch in str(value or ""))
    return " ".join(cleaned.split())


def normalize_cert_id(value: str | None) -> str:
    """Return a lowercase hex ID with common OCR confusions repaired."""
    raw = re.sub(r"[^0-9a-zA-Z]", "", str(value or "")).lower()
    out = []
    for ch in raw:
        if ch in _HEX:
            out.append(ch)
        else:
            out.append(_CONFUSABLE.get(ch, ch))
    return "".join(out)


def id_candidates(value: str | None) -> list[str]:
    """Possible real IDs for an OCR'd string (exact first, repaired second)."""
    raw = re.sub(r"[^0-9a-zA-Z]", "", str(value or "")).lower()
    repaired = normalize_cert_id(value)
    seen, result = set(), []
    for cand in (raw, repaired):
        if cand and cand not in seen:
            seen.add(cand)
            result.append(cand)
    return result


def compare_ids(a: str | None, b: str | None) -> str:
    na, nb = normalize_cert_id(a), normalize_cert_id(b)
    if not na or not nb:
        return MISSING
    return MATCH if na == nb else MISMATCH


def _token_close(a: str, b: str) -> bool:
    if a == b:
        return True
    if min(len(a), len(b)) < 4:          # short tokens must match exactly
        return False
    return difflib.SequenceMatcher(None, a, b).ratio() >= 0.86


def name_similarity(a: str | None, b: str | None) -> float:
    ta, tb = normalize_text(a).split(), normalize_text(b).split()
    if not ta or not tb:
        return 0.0
    short, long_ = (ta, tb) if len(ta) <= len(tb) else (tb, ta)
    if len(long_) - len(short) > 1:      # at most one extra (middle) name
        return 0.0
    remaining = list(long_)
    hits = 0
    for tok in short:
        found = next((o for o in remaining if _token_close(tok, o)), None)
        if found is None:
            return 0.0                   # every token of the shorter name must match
        remaining.remove(found)
        hits += 1
    return hits / len(long_)


def compare_names(a: str | None, b: str | None) -> str:
    if not normalize_text(a) or not normalize_text(b):
        return MISSING
    return MATCH if name_similarity(a, b) >= 0.66 else MISMATCH


def compare_emails(a: str | None, b: str | None) -> str:
    ea, eb = str(a or "").strip().lower(), str(b or "").strip().lower()
    if not ea or not eb:
        return MISSING
    if ea == eb:
        return MATCH
    # tolerate a single OCR slip in the local part only when the domain is identical
    la, _, da = ea.partition("@")
    lb, _, db = eb.partition("@")
    if da and da == db and len(la) >= 6 and difflib.SequenceMatcher(None, la, lb).ratio() >= 0.93:
        return MATCH
    return MISMATCH


def compare_phrase(a: str | None, b: str | None, *, threshold: float = 0.88) -> str:
    na, nb = normalize_text(a), normalize_text(b)
    if not na or not nb:
        return MISSING
    if na == nb:
        return MATCH
    if min(len(na), len(nb)) >= 6 and (na in nb or nb in na):
        # containment is allowed for institutions/courses only when the shorter
        # side covers most of the longer one (e.g. "MIT" vs "MIT Institute" is rejected)
        if min(len(na), len(nb)) / max(len(na), len(nb)) >= 0.6:
            return MATCH
    return MATCH if difflib.SequenceMatcher(None, na, nb).ratio() >= threshold else MISMATCH
