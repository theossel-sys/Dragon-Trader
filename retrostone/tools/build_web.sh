#!/bin/sh
# build_web.sh <repo> <out> <game> "<Name>" "<hint>"
# Builds one RetroStone VC game for the web (Emscripten), into <out>/<game>/index.html (+ .js, .wasm).
set -e
REPO=$1; OUT=$2; GAME=$3; NAME=$4; HINT=$5
HERE=$(cd "$(dirname "$0")" && pwd)
cd "$REPO"
make --no-print-directory GAME=$GAME build/gen/$GAME/assets.c >/dev/null
HOUSE=$(grep -qs "^HOUSE_UI_$GAME *[:?]*= *1" games/$GAME/game.mk && echo 1 || true)
TEXT=
if [ -n "$HOUSE" ] || [ -f games/$GAME/strings/en.txt ]; then
  make --no-print-directory GAME=$GAME build/gen/$GAME/game_text.c >/dev/null
  TEXT=build/gen/$GAME/game_text.c
fi
SRC="$(ls sdk/src/*.c) $(ls games/$GAME/src/*.c) build/gen/$GAME/assets.c $TEXT sdk/frontends/common/rs_desktop.c $HERE/rs_web.c"
[ -n "$HOUSE" ] && SRC="$SRC $(ls games/common/src/*.c)"
XMP="$(ls sdk/third_party/libxmp-lite/src/*.c sdk/third_party/libxmp-lite/src/loaders/*.c)"
OBJ=build/web/$GAME; mkdir -p $OBJ "$OUT/$GAME"
# libxmp-lite (cached per game folder)
XO=build/web/xmp; mkdir -p $XO
for f in $XMP; do o=$XO/$(echo $f | tr / _).o
  [ -f $o ] || emcc -std=c11 -O2 -w -DLIBXMP_CORE_PLAYER -DLIBXMP_STATIC -DLIBXMP_NO_DEPACKERS \
     -Isdk/third_party/libxmp-lite/include/libxmp-lite -Isdk/third_party/libxmp-lite/src -c $f -o $o
done
INC="-Isdk/include -Isdk/src -Isdk/third_party/libxmp-lite/include/libxmp-lite -Isdk/third_party/stb \
     -Isdk/third_party/libretro -Isdk/frontends/common -Igames/$GAME/src -Ibuild/gen/$GAME -Igames/common/src -I$OBJ"
python3 "$HERE/gen_scheme.py" apps/launcher/games.cfg $GAME $OBJ
BTNS=$(cat $OBJ/web_buttons.json)
sed -e "s|__NAME__|$NAME|g" -e "s|__HINT__|$HINT|g" -e "s|__BUTTONS__|$BTNS|g" "$HERE/shell.html" > $OBJ/shell.html
emcc -std=gnu11 -D_POSIX_C_SOURCE=200809L -O2 -w $INC -sUSE_SDL=2 $SRC $XO/*.o \
     -sALLOW_MEMORY_GROWTH=1 -sINITIAL_MEMORY=64MB -sSTACK_SIZE=1MB -lidbfs.js \
     -sEXPORTED_FUNCTIONS=_main,_web_start,_web_pause -sEXPORTED_RUNTIME_METHODS=ccall,FS \
     -sENVIRONMENT=web --shell-file $OBJ/shell.html -o "$OUT/$GAME/index.html"
ls -la "$OUT/$GAME"
