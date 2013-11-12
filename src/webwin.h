
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

#ifndef XKOBO_H_WEBWIN
#define XKOBO_H_WEBWIN
  
#define EVENTMAX 33

extern "C"{
#include <string.h>
}

//class Display {};

class win {

  protected:
    int x,y,sx,sy;
    long mask;
    int ecount;
    int etype[EVENTMAX];
    void (*ec[EVENTMAX])(win& w);
    void *ownerobject;
    static char disp_string[1024];
    int pId;
    
  public:
    //static Display *disp;
//    static int scr;
    static inline void xsync(){};
    static inline void xflush(){};
    static int xcheckevent();
    static inline void set_disp_string(char *t){
        strncpy(disp_string, t, 1024);}
    
    win();
    virtual ~win();
    int event(int etyp,void (*c)(win& w)){return 0;};
    int event(int etyp,unsigned int emask,void (*c)(win& w)){return 0;};
    void make(win *back=NULL,int wx=0,int wy=0,int sizex=200,int sizey=200);
    void map() {};
    void unmap() {};
    int eventloop();
    void title(char *title) {};
    void set_wm_close() {};
    void hold_size() {};
    void erase_cursor() {};
    void setowner(void *owner);
    void *getowner();
    void appeal(char *name) {};
    void setborder(unsigned long color) {};
    void setId(int id);
};

#endif // XKOBO_H_WEBWIN
