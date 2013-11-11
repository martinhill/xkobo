
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

#ifndef XKOBO_H_WEBCMAP
#define XKOBO_H_WEBCMAP
  
#include "webbacking.h"

/*
 *
 *
 *      ---  win_backing ---- win_cmap
 *
 *
 */

class win_cmap : public win_backing{

  protected:
    int use_private_cmap;
    unsigned long search_near(long r, long g, long b);
    
  public:
    win_cmap();
    ~win_cmap();
    void make(win *back,int wx, int wy, int sizex, int sizey, int use_private);
    void cmset();
    unsigned long alloc_color(long r, long g, long b) {return 0;};
};

#endif // XKOBO_H_WEBCMAP
