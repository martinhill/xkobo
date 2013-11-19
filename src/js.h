
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

#ifndef XKOBO_H_JS
#define XKOBO_H_JS


#define KeyPress                2
#define KeyRelease              3


#ifdef __cplusplus
extern "C" {
#endif

extern void SpriteInit(int parentId);
extern void SpriteUpdate(int cx, int cy, int h, int v, int x, int y);
extern void SpriteEndUpdate();
extern void SpriteAdd(int cx, int cy, int h, int v, int x, int y);
extern void SetPosition(int vx, int vy);

// DOM
extern void SelectFont(int parentId, char* s);
extern void SetForegroundColor(int parentId, int color);
extern void SetBackgroundColor(int parentId, int color);
extern void AddTextElement(int parentId, int x, int y, char* text);
extern void ClearElements(int parentId);

// Events
extern int  PollEvent();
extern int  GetEventType();
extern int  GetEventKeycode();

extern void XDebug(char* msg);

#ifdef __cplusplus
}
#endif

#endif // XKOBO_H_JS
