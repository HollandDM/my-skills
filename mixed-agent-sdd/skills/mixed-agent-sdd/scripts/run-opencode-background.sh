#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 --run-dir <path> --job-id <id> --workdir <path> --model <provider/model> --variant <tier> --prompt <text> [--file <path>]... [--write]" >&2
  exit 64
}

run_dir=""
job_id=""
workdir=""
model=""
variant=""
prompt=""
write_mode=false
files=()

while (($#)); do
  case "$1" in
    --run-dir) run_dir="${2:-}"; shift 2 ;;
    --job-id) job_id="${2:-}"; shift 2 ;;
    --workdir) workdir="${2:-}"; shift 2 ;;
    --model) model="${2:-}"; shift 2 ;;
    --variant) variant="${2:-}"; shift 2 ;;
    --prompt) prompt="${2:-}"; shift 2 ;;
    --file) files+=("${2:-}"); shift 2 ;;
    --write) write_mode=true; shift ;;
    *) usage ;;
  esac
done

[[ -n "$run_dir" && -n "$job_id" && -n "$workdir" && -n "$model" && -n "$variant" && -n "$prompt" ]] || usage

mkdir -p "$run_dir/logs"
log_path="$run_dir/logs/opencode-${job_id}.jsonl"

command=(opencode run --dir "$workdir" --model "$model" --variant "$variant" --format json)
for file in "${files[@]}"; do
  command+=(--file "$file")
done
if [[ "$write_mode" == true ]]; then
  command+=(--auto)
fi
command+=("$prompt")

nohup "${command[@]}" >"$log_path" 2>&1 < /dev/null &
pid=$!
printf 'PID=%s\nLOG=%s\n' "$pid" "$log_path"
