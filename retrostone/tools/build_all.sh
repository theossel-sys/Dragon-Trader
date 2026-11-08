#!/bin/sh
# build_all.sh <RetroStoneVC repo> <out dir>: every game of games.txt (needs emsdk_env.sh sourced)
HERE=$(cd "$(dirname "$0")" && pwd)
grep -v '^#' "$HERE/games.txt" | while IFS='|' read id name desc hint; do
  [ -z "$id" ] && continue
  if sh "$HERE/build_web.sh" "$1" "$2" "$id" "$name" "$hint" >/dev/null 2>"$2/.err-$id"; then echo "ok $id"; rm -f "$2/.err-$id"
  else echo "FAIL $id"; fi
done
