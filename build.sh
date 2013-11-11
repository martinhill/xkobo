#!/bin/sh
SRC=src
(cd $SRC; emmake make)
rm -f xkobo.html
emcc --js-library library_sprite.js --shell-file shell.html $SRC/xkobo.bc -o xkobo.html

