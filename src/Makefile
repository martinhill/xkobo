#  SPEED OF THE GAME  
WAIT_MSEC   = 30

#  NUMBER OF SHIPS  
SHIPS       = 5

#  RECORDS  
#HSCORE_DIR  = Library/Preferences/com.hatemogi.xkobo/scores

.SUFFIXES: .cpp $(SUFFIXES)

SRCS1= xkobo.cpp enemy.cpp enemies.cpp file.cpp \
       myship.cpp key.cpp map.cpp radar.cpp screen.cpp manage.cpp \
       scenes.cpp score.cpp random.cpp \
       webcmap.cpp webwin.cpp webbacking.cpp webchip.cpp webscroll.cpp

# SRCS2= getvclass.c xkp256.c

SRCS = $(SRCS1) $(SRCS2)

DEFINES = -DWAIT_MSEC=$(WAIT_MSEC) -DSHIPS=$(SHIPS) \
          -DXKOBO_SCORE_DIR=\"$(HSCORE_DIR)\"

CFLAGS=$(OPTIMIZE_OPTION) $(DEFINES)
CCOPTIONS = #-Wall -g -pg

LOCAL_LIBRARIES = -lX11 # -L/usr/X11/lib -L/opt/local/lib -lX11

OBJS = $(SRCS1:.cpp=.o) # $(SRCS2:.c=.o)

xkobo.bc: $(OBJS) $(DEPLIBS)
	$(CXX) -o $@ $(OBJS) $(LDOPTIONS) $(LOCAL_LIBRARIES) $(LDLIBS) $(EXTRA_LOAD_FLAGS)

.cpp.o:
	$(CXX) $(CFLAGS) -c $< -o $@


xkp256.c: xkp256.tif
	$(RM) xkp256.c
	echo '/*'                                            > xkp256.c
	echo ' * XKOBO, a video-oriented game'              >> xkp256.c
	echo ' * Copyright (C) 1995,1996  Akira Higuchi'    >> xkp256.c
	echo ' *     a-higuti@math.hokudai.ac.jp'           >> xkp256.c
	echo ' *'                                           >> xkp256.c
	echo ' */'                                          >> xkp256.c
	echo 'unsigned char spdata[] = {'                   >> xkp256.c
	hexdump -v -e '"\t" 8/1 "0x0%02x," "\n"' xkp256.tif >> xkp256.c
	echo '};'                                           >> xkp256.c

install:
	if [ -d $(HSCORE_DIR) ]; then chmod 777 $(HSCORE_DIR); \
	else mkdirhier $(HSCORE_DIR); chmod 777 $(HSCORE_DIR); fi


clean:
	$(RM) xkobo.bc *.o 
