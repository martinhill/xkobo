#!/bin/sh
SRC=src
export OPTIMIZE_OPTION=${1}
export HSCORE_DIR=

(cd $SRC; emmake make)
rm -f xkobo.html
emcc $OPTIMIZE_OPTION --js-library library_sprite.js --shell-file shell.html $SRC/xkobo.bc -o xkobo.html

