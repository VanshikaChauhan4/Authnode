"""In-memory conversation history, keyed by session ID.

Deliberately not persisted anywhere: conversations are not sensitive account
data, and keeping them in-process (capped in length) avoids storing more
than needed. Restarting the service clears all sessions, which is fine for
this use case.
"""

from __future__ import annotations

from collections import OrderedDict

from config import MAX_HISTORY_TURNS

_MAX_SESSIONS = 500  # simple bound so a long-running process can't grow unbounded

_sessions: "OrderedDict[str, list[dict[str, str]]]" = OrderedDict()


def get_history(session_id: str) -> list[dict[str, str]]:
    return _sessions.get(session_id, [])


def append_turn(session_id: str, role: str, content: str) -> None:
    history = _sessions.setdefault(session_id, [])
    history.append({"role": role, "content": content})

    # Cap to the last N turns (a "turn" = one user + one assistant message)
    max_messages = MAX_HISTORY_TURNS * 2
    if len(history) > max_messages:
        del history[: len(history) - max_messages]

    _sessions.move_to_end(session_id)
    while len(_sessions) > _MAX_SESSIONS:
        _sessions.popitem(last=False)
