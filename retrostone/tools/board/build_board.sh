#!/bin/sh
# build_board.sh <RetroStoneVC repo> <out dir>: RetroStone Board (apps/boardgames) for the web, into <out>/board/
# (needs emsdk_env.sh sourced; python3 with Pillow and fontTools; fonts-noto-cjk and fonts-dejavu-core)
set -e
REPO=$1; OUT=$2; HERE=$(cd "$(dirname "$0")" && pwd)
cd "$REPO"
D=apps/boardgames; G=build/boardgames/gen
make --no-print-directory -f $D/Makefile $G/text_data.c $G/art_data.c $G/edition.c >/dev/null
SRC="$D/src/shell.c $D/src/pages.c $D/src/stats.c $D/src/save.c $D/src/sound.c $D/src/art.c $(ls $D/src/card*.c)
     $D/src/ai.c $D/src/bots.c $HERE/ai_worker_web.c $D/src/text.c $G/text_data.c $G/art_data.c $G/edition.c
     $(ls $D/src/games/*.c) apps/common/iap_none.c $D/src/arcade.c"
mkdir -p "$OUT/board" build/web/board
# one object per file (cached, in parallel), then the link
for f in $SRC; do echo "$f build/web/board/$(echo $f | tr / _ | sed 's|^.*_scratchpad_||').o"; done > build/web/board/list
CC="emcc -O2 -std=gnu11 -w -I$D/src -Iapps/common -Isdk/third_party/stb -sUSE_SDL=2"
xargs -P "$(nproc)" -L 1 sh -c '[ -f "$1" ] && [ ! "$0" -nt "$1" ] || '"$CC"' -c "$0" -o "$1"' < build/web/board/list
OBJS=$(cut -d" " -f2 build/web/board/list)
emcc -O2 $OBJS -sUSE_SDL=2 -sASYNCIFY -sASYNCIFY_STACK_SIZE=262144 -sALLOW_MEMORY_GROWTH=1 -sINITIAL_MEMORY=128MB \
     -sSTACK_SIZE=2MB -lidbfs.js -sEXPORTED_RUNTIME_METHODS=FS,IDBFS,addRunDependency,removeRunDependency -sENVIRONMENT=web \
     -sFORCE_FILESYSTEM=1 --shell-file "$HERE/shell.html" -o "$OUT/board/index.html"
ls -la "$OUT/board"
