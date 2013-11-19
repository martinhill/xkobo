
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

#include "webscroll.h"

//--------------------------------------------------------------------------//
//                     class     win_scroll                                 //
//--------------------------------------------------------------------------//

win_scroll::win_scroll()
{
    ;
}

win_scroll::~win_scroll()
{
    ;
}

void win_scroll::make(win *back,int wx,int wy, int sizex,int sizey,
                      int vsizex, int vsizey)
{
    vsx = vsizex;
    vsy = vsizey;
    vx  = 0;
    vy  = 0;
    this->win::make(back,wx,wy,sizex,sizey);
}

void win_scroll::expose_backing()
{
}

void win_scroll::set_position(int vposx, int vposy)
{
    vx = vposx;
    vy = vposy;
}

void win_scroll::torus()
{
    int x = vsx - sx;
    int y = vsy - sy;
}
