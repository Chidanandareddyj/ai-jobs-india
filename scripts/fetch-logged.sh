#!/usr/bin/env bash
# Runs the fetch and saves console output to logs/fetch-<timestamp>.log
set -o pipefail
cd "$(dirname "$0")/.." && mkdir -p logs
LOG="logs/fetch-$(date +%Y%m%d-%H%M%S).log"
npx tsx scripts/fetch-jobs.ts 2>&1 | tee "$LOG"; echo "log: $LOG"
