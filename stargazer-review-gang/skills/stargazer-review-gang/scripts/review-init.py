#!/usr/bin/env python3
"""
review-init.py — Gather review metadata for the stargazer-review-gang skill.

Output: JSON with changed files, line counts, depth, and whether to spawn the router.

Usage: python3 review-init.py [diff-base]
  diff-base: git ref to diff against (default: HEAD~1)

The main agent runs this ONCE. Routing decisions are made by agents (main or router).
"""

import json
import re
import subprocess
import sys


def run(cmd: list[str]) -> str:
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.stdout.strip()


def get_changed_files(base: str) -> list[str]:
    """Try committed diff, then unstaged, then staged."""
    for args in (
        ["git", "diff", "--name-only", base],
        ["git", "diff", "--name-only"],
        ["git", "diff", "--name-only", "--cached"],
    ):
        output = run(args)
        if output:
            return [f for f in output.splitlines() if f]
    return []


def get_total_lines(base: str) -> int:
    """Parse total insertions + deletions from git diff --stat."""
    stat = run(["git", "diff", "--stat", base])
    if not stat:
        return 0
    last_line = stat.splitlines()[-1]
    insertions = re.search(r"(\d+) insertion", last_line)
    deletions = re.search(r"(\d+) deletion", last_line)
    return (int(insertions.group(1)) if insertions else 0) + (
        int(deletions.group(1)) if deletions else 0
    )


def get_file_lines(base: str, filepath: str) -> int:
    """Get per-file changed line count via --numstat."""
    numstat = run(["git", "diff", "--numstat", base, "--", filepath])
    if not numstat:
        return 0
    parts = numstat.split()
    if len(parts) < 2:
        return 0
    added = 0 if parts[0] == "-" else int(parts[0])
    removed = 0 if parts[1] == "-" else int(parts[1])
    return added + removed


def determine_depth(total_lines: int) -> str:
    if total_lines < 50:
        return "lite"
    elif total_lines <= 500:
        return "standard"
    else:
        return "deep"


def main():
    base = sys.argv[1] if len(sys.argv) > 1 else "HEAD~1"

    files = get_changed_files(base)
    if not files:
        print(json.dumps({"error": "no_changes", "files": [], "total_lines": 0}))
        return

    total_lines = get_total_lines(base)
    depth = determine_depth(total_lines)

    file_infos = []
    for filepath in files:
        file_infos.append({
            "path": filepath,
            "lines": get_file_lines(base, filepath),
        })

    print(json.dumps({
        "total_files": len(files),
        "total_lines": total_lines,
        "depth": depth,
        "spawn_router": depth == "deep",
        "base": base,
        "files": file_infos,
    }, indent=2))


if __name__ == "__main__":
    main()
