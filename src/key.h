
/*
 * XKOBO, a video-oriented game
 * Copyright (C) 1995,1996  Akira Higuchi
 *     a-higuti@math.hokudai.ac.jp
 * 
 * This program is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the
 * Free Software Foundation; either version 2 of the License, or (at your
 * option) any later version.
 * 
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 675 Mass Ave, Cambridge, MA 02139, USA.
 * 
 */

#ifndef XKOBO_H_KEY
#define XKOBO_H_KEY

#ifndef EMSCRIPTEN
extern "C"{
#include <X11/Xlib.h>
#include <X11/keysym.h>
}
#else
#include "js.h"

typedef unsigned long KeySym;

#define XK_KP_0			0xFFB0
#define XK_KP_1			0xFFB1
#define XK_KP_2			0xFFB2
#define XK_KP_3			0xFFB3
#define XK_KP_4			0xFFB4
#define XK_KP_5			0xFFB5
#define XK_KP_6			0xFFB6
#define XK_KP_7			0xFFB7
#define XK_KP_8			0xFFB8
#define XK_KP_9			0xFFB9

#define XK_s                   0x073
#define XK_q                   0x071
#define XK_m                   0x06d
#define XK_n                   0x06e

#define XK_Shift_L		16      /* 0xFFE1	Left shift */

#define XK_Home			0xFF50
#define XK_Left			37      /* 0xFF51	Move left, left arrow */
#define XK_Up			38      /* 0xFF52	Move up, up arrow */
#define XK_Right		39      /* 0xFF53	Move right, right arrow */
#define XK_Down			40      /* 0xFF54	Move down, down arrow */
#define XK_Prior		0xFF55	/* Prior, previous */
#define XK_Page_Up		0xFF55
#define XK_Next			0xFF56	/* Next */
#define XK_Page_Down		0xFF56
#define XK_End			0xFF57	/* EOL */
#define XK_Begin		0xFF58	/* BOL */
#endif
#include "config.h"

#define KEY_DOWN      XK_KP_2
#define KEY_LEFT      XK_KP_4
#define KEY_UP        XK_KP_8
#define KEY_RIGHT     XK_KP_6
#define KEY_DL        XK_KP_1
#define KEY_DR        XK_KP_3
#define KEY_UL        XK_KP_7
#define KEY_UR        XK_KP_9

#define KEY_START     XK_s
#define KEY_SHOT      XK_Shift_L
#define KEY_EXIT      XK_q
#define KEY_PLUS      XK_m
#define KEY_MINUS     XK_n

class _key{
    static int  space;
    static int  left, up, down, right, ul, ur, dl, dr;
    static int  shot;
    static int  direction;
    static void change();
  public:
    static void init();
    static void clear();
    static void press(KeySym sym);
    static void release(KeySym sym);
    static void change_up(unsigned long r);
    static void change_down(unsigned long r);
    static void change_left(unsigned long r);
    static void change_right(unsigned long r);
    static void change_shot(unsigned long r);
    static void mouse_press(int n);
    static void mouse_release(int n);
    static void mouse_position(int h, int v);
    static inline int dir(){ return direction; }
    static inline int get_shot(){ int ret = shot; return ret; }
};

extern _key key;

#endif // XKOBO_H_KEY
