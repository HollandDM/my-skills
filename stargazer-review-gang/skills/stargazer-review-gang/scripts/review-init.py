#!/usr/bin/env python3
"""
review-init.py — CLI tool for the stargazer-review-gang skill.

Commands:
  init [base]           Get changed files, line counts, depth, router decision
  diff <base> <file>    Get unified diff for a single file
  diff-all <base>       Get unified diffs for all changed files
  files <base>          Get just the list of changed file paths
  stat <base>           Get per-file line counts
  log <file> [n]        Get recent commit history for a file
  blame <file> <start> <end>  Get git blame for a line range

All commands output JSON. Default base: HEAD~1
"""

import argparse
import json
import re
import subprocess


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
    return "deep"


# --- Commands ---


def cmd_init(args):
    base = args.base
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


def cmd_diff(args):
    output = run(["git", "diff", "-U3", args.base, "--", args.file])
    print(json.dumps({"file": args.file, "diff": output}))


def cmd_diff_all(args):
    files = get_changed_files(args.base)
    diffs = {}
    for f in files:
        diffs[f] = run(["git", "diff", "-U3", args.base, "--", f])
    print(json.dumps({"base": args.base, "diffs": diffs}, indent=2))


def cmd_files(args):
    files = get_changed_files(args.base)
    print(json.dumps({"base": args.base, "files": files}, indent=2))


def cmd_stat(args):
    base = args.base
    files = get_changed_files(base)
    total = get_total_lines(base)
    file_stats = []
    for f in files:
        file_stats.append({"path": f, "lines": get_file_lines(base, f)})
    print(json.dumps({
        "base": base,
        "total_lines": total,
        "files": file_stats,
    }, indent=2))


def cmd_log(args):
    n = str(args.n)
    output = run(["git", "log", f"--oneline", f"-{n}", "--", args.file])
    lines = [line for line in output.splitlines() if line]
    print(json.dumps({"file": args.file, "commits": lines}, indent=2))


def cmd_blame(args):
    output = run([
        "git", "blame", "-L", f"{args.start},{args.end}", "HEAD", "--", args.file
    ])
    print(json.dumps({
        "file": args.file,
        "start": args.start,
        "end": args.end,
        "blame": output,
    }, indent=2))


def main():
    parser = argparse.ArgumentParser(description="Review init tool for stargazer-review-gang")
    sub = parser.add_subparsers(dest="command", required=True)

    # init
    p_init = sub.add_parser("init", help="Get changed files, depth, router decision")
    p_init.add_argument("base", nargs="?", default="HEAD~1", help="Git ref to diff against")
    p_init.set_defaults(func=cmd_init)

    # diff
    p_diff = sub.add_parser("diff", help="Get unified diff for a single file")
    p_diff.add_argument("base", help="Git ref to diff against")
    p_diff.add_argument("file", help="File path")
    p_diff.set_defaults(func=cmd_diff)

    # diff-all
    p_diff_all = sub.add_parser("diff-all", help="Get all diffs")
    p_diff_all.add_argument("base", nargs="?", default="HEAD~1")
    p_diff_all.set_defaults(func=cmd_diff_all)

    # files
    p_files = sub.add_parser("files", help="List changed file paths")
    p_files.add_argument("base", nargs="?", default="HEAD~1")
    p_files.set_defaults(func=cmd_files)

    # stat
    p_stat = sub.add_parser("stat", help="Per-file line counts")
    p_stat.add_argument("base", nargs="?", default="HEAD~1")
    p_stat.set_defaults(func=cmd_stat)

    # log
    p_log = sub.add_parser("log", help="Recent commit history for a file")
    p_log.add_argument("file", help="File path")
    p_log.add_argument("n", nargs="?", type=int, default=3, help="Number of commits")
    p_log.set_defaults(func=cmd_log)

    # blame
    p_blame = sub.add_parser("blame", help="Git blame for a line range")
    p_blame.add_argument("file", help="File path")
    p_blame.add_argument("start", type=int, help="Start line")
    p_blame.add_argument("end", type=int, help="End line")
    p_blame.set_defaults(func=cmd_blame)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
