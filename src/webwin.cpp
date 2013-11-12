
/*
 * XKOBO, a video-oriented game
 * Copyright (C) 1995,1996  Akira Higuchi
 *     a-higuti@math.hokudai.ac.jp
 *      Martin Hill
 *      martin@hillm.net
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

extern "C"{
#include <stdio.h>
#include <stdlib.h>
}
#include "webwin.h"
#include "js.h"

char       win::disp_string[1024] = {0};


//--------------------------------------------------------------------------//
//                     class     win                                        //
//--------------------------------------------------------------------------//

win::win()
{
    mask = 0;
    ecount = 0;
}

win::~win()
{
}   

void win::make(win *back,int wx,int wy,int sizex,int sizey)
{
    if (mask == -1) return;
    x = wx;
    y = wy;
    sx = sizex;
    sy = sizey;

    mask = -1;
}


void win::setowner(void *owner)
{
    ownerobject = owner;
}

void *win::getowner()
{
    return ownerobject;
}


int win::eventloop()
{
    return 1;
}

void win::setId(int id)
{
    pId = id;
}

int win::xcheckevent() {
    return 0;
}

