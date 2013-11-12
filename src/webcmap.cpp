
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

#include "webcmap.h"

//--------------------------------------------------------------------------//
//                     class     win_cmap                                   //
//--------------------------------------------------------------------------//


win_cmap::win_cmap()
{
}

win_cmap::~win_cmap()
{
}

void win_cmap::make(win *back,int wx,int wy,int sizex,int sizey,
                    int use_private)
{
    this->win_backing::make(back,wx,wy,sizex,sizey);
}

void win_cmap::cmset()
{
}

unsigned long win_cmap::alloc_color(long r, long g, long b) {
    return ( ((r & 0xff00) << 8) | (g & 0xff00) | ((b & 0xff00) >> 8) );
}

unsigned long win_cmap::search_near(long r, long g, long b)
{
    return 0;
}
