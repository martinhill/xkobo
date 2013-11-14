
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

#include "webbacking.h"
#include "js.h"

//--------------------------------------------------------------------------//
//                     class     win_backing                                //
//--------------------------------------------------------------------------//

win_backing::win_backing()
{
}

win_backing::~win_backing()
{
}

void win_backing::make(win *back,int wx,int wy,int sizex,int sizey)
{
    this->win::make(back,wx,wy,sizex,sizey);
}

int win_backing::eventloop()
{
    if (this->win::eventloop() == 0) return 0;
    return 1;
}

void win_backing::expose_backing()
{
}

void win_backing::clear()
{
    ClearElements(pId);
}

void win_backing::clear(int x,int y,int h,int v)
{
}

void win_backing::foreground(int i)
{
    SetForegroundColor(pId, i);
}

void win_backing::background(int i)
{
    SetBackgroundColor(pId, i);
}

void win_backing::font(char *s)
{
    SelectFont(pId, s);
}

void win_backing::warp_pointer(int x, int y)
{
}

void win_backing::string_back(int x,int y,char *t)
{ 
    AddTextElement(pId, x,y,t); 
}

void win_backing::string(int x,int y,char *t)
{ 
    AddTextElement(pId, x,y,t); 
}
