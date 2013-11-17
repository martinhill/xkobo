
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

#include "webchip.h"
#include "js.h"
     
win_chip::win_chip()
{
    spr_max = sprite;
}

win_chip::~win_chip()
{
} 

void win_chip::make(win *back,int wx,int wy, int sizex,int sizey,
                    int vsizex, int vsizey, int csizex, int csizey, int policy)
{
    this->win_scroll::make(back,wx,wy,sizex,sizey,vsizex,vsizey);
    csx = csizex;
    csy = csizey;
    store_policy = policy;   /* 0 : speed   1 : memory */
    SpriteInit(pId);
}

void win_chip::torus_copy_from_chip_and_store(int x, int y, int h, int v,
                                              int x1, int x2)
{
    this->copy_from_chip_and_store(x,y,h,v,x1,x2);
    if (x1 < sx){
        this->copy_from_chip_and_store(x,y,h,v,x1+vsx-sx,x2);
        if (x2 < sy){
            this->copy_from_chip_and_store(x,y,h,v,x1,x2+vsy-sy);
            this->copy_from_chip_and_store(x,y,h,v,x1+vsx-sx,x2+vsy-sy);
        }
    }
    else if (x2 < sy){
        this->copy_from_chip_and_store(x,y,h,v,x1,x2+vsy-sy);
    }
}

void win_chip::copy_from_chip_and_store(int x, int y, int h, int v,
                                              int x1, int x2)
{
}

int win_chip::clip(int& cx, int& cy, int& x, int& y, int& h, int& v)
{
    int x2 = x + h;
    int y2 = y + h;
    if (x < vx){
        cx += (vx - x);
        x = vx;
    }
    if (y < vy){
        cy += (vy - y);
        y = vy;
    }
    if (x2 > vx + sx) x2 = vx + sx;
    if (y2 > vy + sy) y2 = vy + sy;
    h = x2 - x;
    v = y2 - y;
    if ((h < 0) || (v < 0)){
        h = 0;
        v = 0;
        return 1;
    }
    return 0;
}

void win_chip::store()
{
}

void win_chip::set_position(int vposx, int vposy)
{
    vx = vposx;
    vy = vposy;
    _sprite *spp;

    //SpriteBeginUpdate();
    for ( spp = sprite; spp < spr_max; spp++ ) {
        SpriteUpdate(spp->cx, spp->cy, spp->h, spp->v, spp->x-vx, spp->y-vy);
    }
    SpriteEndUpdate();

    spr_max = sprite;
}
