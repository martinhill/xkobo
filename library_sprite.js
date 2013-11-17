//"use strict";

// DOM sprite tools

LibrarySprite = {
    $Sprite__deps: ['$FS'],
    $Sprite: {
        value: 0,
        // for each parent div, keep track of class for new elements
        currentTextClass: {},
        currentFgColor: {},
        currentBgColor: {},
        events: [],
        init: function(viewport, level, background) {
            Sprite.maxSprites = Module['maxSprites']; 
            Sprite.viewport = viewport;
            Sprite.level = level;
            Sprite.background = background;
            Sprite.viewportW = viewport.clientWidth;
            // size of the the viewport and the larger level within
            Sprite.viewportW = viewport.clientWidth;
            Sprite.viewportH = viewport.clientHeight;
            Sprite.levelW = level.cpplientWidth;
            Sprite.levelH = level.clientHeight;

            // how fast do we scroll the level tiles
            Sprite.levelSpeed = -1;
            // the current scroll location of the level
            Sprite.levelx = 0;

            Sprite.spriteCount = 0;
            Sprite.levelSprites = [];
            Sprite.levelSpriteCount = 0;

            // timer and stats
            Sprite.currentTimestamp = new Date().getTime();
            Sprite.previousTimestamp = 0;
            Sprite.framesThisSecond = 0;
            Sprite.elapsedMs = 0;
            Sprite.currentFPS = 60;

            // each second, add severl new entities
            Sprite.newMovingSpritesPerSecond = 1;
            Sprite.newLevelSpritesPerSecond = 25;
            // no blank screens if the FPS is low
            Sprite.minSpriteCount = 40;

            // add new sprites until the FPS gets too low
            // note: if we set this to 60 it never goes
            // above the threshold: use 55 instead
            Sprite.targetFramerate = 30;

            // SPRITESHEET: all sprite frames stored in a single image
            Sprite.spritesheetWidth = 256;
            Sprite.spritesheetHeight = 128;
            Sprite.spritesheetFrameWidth = 16;
            Sprite.spritesheetFrameHeight = 16;
            Sprite.spritesheetXFrames = Sprite.spritesheetWidth / Sprite.spritesheetFrameWidth;
            Sprite.spritesheetYFrames = Sprite.spritesheetHeight / Sprite.spritesheetFrameHeight;
            Sprite.spritesheetFrames = Sprite.spritesheetXFrames * Sprite.spritesheetYFrames;
            Sprite.demosprites = [];

            // ensure that we have requestAnimationFrame
            // this is Paul Irish's compatibility shim
            if (!window.requestAnimationFrame) 
            {
                window.requestAnimationFrame = (function() 
                        {
                            return window.webkitRequestAnimationFrame ||
                    window.mozRequestAnimationFrame ||
                    window.oRequestAnimationFrame ||
                    window.msRequestAnimationFrame ||
                    function(callback,element) 
                {
                    window.setTimeout(callback, 1000 / 60);
                };
                        })();
            }
        },

        // add or remove sprites depending on the FPS
        maybeMoreSprites: function ()
        {
            var howmany = 0;
            // keep adding sprites until we go below the target fps
            if ((Sprite.currentFPS > Sprite.targetFramerate) || (Sprite.spriteCount < Sprite.minSpriteCount))
            {
                howmany = Sprite.newMovingSpritesPerSecond;
                while (howmany--)
                {
                    // add one new animated sprite
                    var sprite = new Sprite.SpriteX();
                    Sprite.demoInit(sprite);
                    Sprite.demosprites[Sprite.spriteCount] = sprite;
                    Sprite.spriteCount++;
                }

                howmany = Sprite.newLevelSpritesPerSecond;
                while (howmany--)
                {
                    // also add tiles to the static level geometry
                    var sprite = new Sprite.SpriteX(Sprite.level);
                    Sprite.demoInit(sprite);
                    Sprite.levelSprites[Sprite.levelSpriteCount] = sprite;
                    Sprite.levelSpriteCount++;
                }
            }
            // remove sprites if the FPS dips too low
            else
            {
                howmany = Sprite.newMovingSpritesPerSecond;
                while (howmany--)
                {
                    if (Sprite.spriteCount)
                    {
                        Sprite.demosprites[Sprite.spriteCount-1].destroy();
                        Sprite.spriteCount--;
                    }
                }

                howmany = Sprite.newLevelSpritesPerSecond;
                while (howmany--)
                {
                    if (Sprite.levelSpriteCount)
                    {
                        Sprite.levelSprites[Sprite.levelSpriteCount-1].destroy();
                        Sprite.levelSpriteCount--;
                    }
                }
            }
        },

        // measure the framerate and add/remove sprites
        // depending on how fast we're animating
        checkFPS: function () 
        {
            Sprite.framesThisSecond++;
            Sprite.previousTimestamp = Sprite.currentTimestamp;
            Sprite.currentTimestamp = new Date().getTime();
            Sprite.elapsedMs += Sprite.currentTimestamp - Sprite.previousTimestamp;
            Sprite.currentFPS = 1000 / (Sprite.currentTimestamp - Sprite.previousTimestamp);
            // only update once per second
            if (Sprite.elapsedMs >= 1000)
            {
                stats.innerHTML = (Sprite.spriteCount + Sprite.levelSpriteCount) +
                    ' sprites at ' + Sprite.framesThisSecond + 'fps - viewport size: ' +  
                    Sprite.viewportW+'x'+Sprite.viewportH+ ' - ' + Sprite.spriteCount + ' moving entities - ' 
                    + Sprite.levelSpriteCount + ' level tiles';
                Sprite.elapsedMs -= 1000;
                Sprite.framesThisSecond = 0;

                // add more sprites if possible
                // only done once per second so we aren't touching
                // the DOM every single frame
                Sprite.maybeMoreSprites();
            }
        },

        demoInit: function(sprite) {
            // random starting position
            if (sprite.parent == Sprite.level) 
            {
                sprite.x = Math.round(Math.random() * Sprite.levelW);
                sprite.y = Math.round(Math.random() * Sprite.levelH);
            }
            else // regular sprite in the viewport
            {
                sprite.x = Math.round(Math.random() * Sprite.viewportW);
                sprite.y = Math.round(Math.random() * Sprite.viewportH);
            }
            sprite.reposition();
            // give it a random speed
            sprite.xSpeed = Math.round(Math.random() * 10) - 5;
            sprite.ySpeed = Math.round(Math.random() * 10) - 5;
            // no still sprites
            if (sprite.xSpeed == 0) sprite.xSpeed  = 1;
            if (sprite.ySpeed == 0) sprite.ySpeed  = 1;
            // random spritesheet frame
            sprite.frame(Sprite.spriteCount);
        },

        // the sprite class - DOM sprite version
        SpriteX: (function() {
            function SpriteX (parentElement) {
                // function references
                this.reposition = function () {
                    if (!this) return;

                    // CSS3 version - forces hardware accel on mobile
                    // Surprisingly, this is SLOWER on PC Windows using Chrome	
                    // but may be faster on iOS and other mobile platforms
                    this.style.left = this.x + 'px';
                    this.style.top = this.y + 'px';
                };
                // changes the spritesheet frame of a sprite
                // by shifting the background image location
                this.frame = function (num) {
                    if (!this) return;
                    this.style.backgroundPosition = 
            (-1 * (num % Sprite.spritesheetXFrames) * Sprite.spritesheetFrameWidth + 'px ') +
            (-1 * (Math.round(num / Sprite.spritesheetXFrames) % Sprite.spritesheetYFrames)) 
            * Sprite.spritesheetFrameHeight + 'px ';
                };
                this.framexy = function(x, y) {
                    if (!this) return;
                    this.style.backgroundPosition =
                        (-1 * x) + 'px ' + (-1 * y) + 'px ';
                };
                this.show = function() {
                    this.style.visibility = 'visible';
                };
                this.hide = function() {
                    this.style.visibility = 'hidden';
                };
                // removes a sprite from a container DOM element
                this.destroy = function () {
                    if (!this) return;
                    this.parent.removeChild(this.element);
                };
                // where do this sprite live? (default: viewport)
                this.parent = parentElement ? parentElement : Sprite.viewport;
                // create a DOM sprite
                this.element = document.createElement("div");
                this.element.className = 'sprite';
                // optimized pointer to style object
                this.style = this.element.style;
                // put it into the game window
                this.parent.appendChild(this.element);
            }
            SpriteX.prototype = new Object();
            SpriteX.prototype.constructor = SpriteX;
            return SpriteX;
        }()),

        // update the positions of each sprite
        animateSprites: function ()
        {
            for (var loop=0; loop < Sprite.spriteCount; loop++)
            {
                Sprite.demosprites[loop].x += Sprite.demosprites[loop].xSpeed;
                Sprite.demosprites[loop].y += Sprite.demosprites[loop].ySpeed;

                // bounce at edges
                if ((Sprite.demosprites[loop].x <= 0) || (Sprite.demosprites[loop].x >= Sprite.viewportW))
                    Sprite.demosprites[loop].xSpeed = -1 * Sprite.demosprites[loop].xSpeed;
                if ((Sprite.demosprites[loop].y <= 0) || (Sprite.demosprites[loop].y >= Sprite.viewportH))
                    Sprite.demosprites[loop].ySpeed = -1 * Sprite.demosprites[loop].ySpeed;

                Sprite.demosprites[loop].reposition();
            }

            // also scroll the level tiles
            Sprite.levelx += Sprite.levelSpeed;
            // change direction once we get to the edge
            if (Sprite.levelx <= (-Sprite.levelW+Sprite.viewportW)) Sprite.levelSpeed = -1 * Sprite.levelSpeed;
            if (Sprite.levelx >= 0) Sprite.levelSpeed = -1 * Sprite.levelSpeed;
            Sprite.level.style.left = Sprite.levelx + 'px';

            // and the background parallax layer half as fast
            Sprite.background.style.backgroundPosition = Math.round(Sprite.levelx/2) + 'px 0px';
        },

        // run each frame
        animate: function () 
        {
            // call this function again asap
            requestAnimationFrame(Sprite.animate);
            // measure time and add or remove sprites
            Sprite.checkFPS();
            // bounce the sprites around and scroll the level
            Sprite.animateSprites();
        },

        receiveEvent: function(event) {
            Sprite.events.push(event);
            
            if (Sprite.events.length >= 10000) {
                Module.printErr('event queue full, dropping events');
                Sprite.events = Sprite.events.slice(0, 10000);
            }

            switch ( event.type ) {
                case "keydown": case "keyup": {
                    //Module.print('Received ' + event.type + ' event. Keycode = ' + event.keyCode);
                }
            }

        }
    },

    SpriteDemoInit: function() {
        Sprite.init(Module['wchip'], Module['map'], Module['background']);
    },

    SpriteDemoAnimate: function() {
        Sprite.animate();
    },

    SpriteInit: function(parentId) {
        if (!Module['doNotCaptureKeyboard']) {
            document.addEventListener("keydown", Sprite.receiveEvent);
            document.addEventListener("keyup", Sprite.receiveEvent);
            //document.addEventListener("keypress", Sprite.receiveEvent);
        }

        Sprite.init(Module['wchip'], Module['map'], Module['background']);
        var parent = Module.parentmap[parentId];
        Sprite.sprites = new Array(Sprite.maxSprites);
        for ( var i = 0; i < Sprite.maxSprites; i++ ) {
            Sprite.sprites[i] = new Sprite.SpriteX(parent);
            Sprite.sprites[i].hide();
        }
        Sprite.saveUpdateIndex = 0;
    },

    SpriteBeginUpdate: function() {
        Sprite.updateIndex = 0;
    },

    SpriteUpdate: function(cx, cy, h, v, x, y) {
        if ( Sprite.updateIndex < Sprite.maxSprites ) {
            var sprite = Sprite.sprites[Sprite.updateIndex++];
            sprite.framexy(cx, cy);
            sprite.x = x;
            sprite.y = y;
            sprite.reposition();
            sprite.show();
            //Module.print('SpriteUpdate( ' + cx + ', ' + cy + ', ' + h + ', ' + v + ', ' + x + ', ' + y + ')');
        }
    },

    SpriteEndUpdate: function() {
        // hide all the sprites from updateIndex to saveUpdateIndex
        for ( var i = Sprite.updateIndex; i < Sprite.saveUpdateIndex; i++ ) {
            Sprite.sprites[i].hide();
        }

        Sprite.saveUpdateIndex = Sprite.updateIndex;
        Sprite.updateIndex = 0;
    },

    PollEvent: function() {
        if ( Sprite.events.length > 0 ) {
            Sprite.event = Sprite.events.shift();
            //Module.print('Polled ' + Sprite.event.type + ' event. Keycode = ' + Sprite.event.keyCode);
            return 1;
        }
        Sprite.event = undefined;
        return 0;
    },

    GetEventType: function() {
        if ( Sprite.event ) {
            var eventType = Module.eventTypes[Sprite.event.type];
            //Module.print('EventType ' + eventType);
            return eventType;
        }
        Module.print('event undefined');
    },

    GetEventKeycode: function() {
        if ( Sprite.event ) {
            
            switch (Sprite.event.type) {
                case 'keydown': case 'keyup': {
                    var down = Sprite.event.type === 'keydown';
                    //Module.print('Received key event: ' + event.keyCode);
                    var key = Sprite.event.keyCode;
                    if (key >= 65 && key <= 90) {
                        key += 32; // make lowercase for SDL
                    }
                    //Module.print('Got ' + Sprite.event.type + ' event. Keycode = ' + key);
                    return key;
                }
            }
        }
        return 0;
    },

    ClearElements: function(parentId) {
        var parent = Module.parentmap[parentId];
        if ( !parent  ) {
            Module.printErr("clear: invalid parentId " + parentId);
            return;
        }
        var child;
        for ( child in parent.childNodes ) {
            // Remove only non-container "parent" elements
            if ( ! child in Module.parents ) {
                if ( child.className != 'sprite' ) {
                    parent.removeChild(child);
                } else {
                    // only hide sprites - don't remove from DOM
                    child.style.visibility = 'hidden';
                }
            }
        }
        Module.print('ClearElements(' + parentId + ')');
    },

    SelectFont: function(parentId, s) {
        s = Pointer_stringify(s);
        Sprite.currentTextClass[parentId] = Module.fontmap[s] || Module.fontmap.def;
        //Module.print('SelectFont(' + s + '): ' + Sprite.currentTextClass[parentId]);
    },

    SetForegroundColor: function(parentId, color) {
        Sprite.currentFgColor[parentId] = color;
        //Module.print('foreground for ' + parentId + ' is ' + color);
    },
    
    SetBackgroundColor: function(parentId, color) {
        Sprite.currentBgColor[parentId] = color;
        //Module.print('background for ' + parentId + ' is ' + color);
    },
    
    AddTextElement: function(parentId, x, y, text) {
        text = Pointer_stringify(text);
        var parent = Module.parentmap[parentId] || Module.viewport;
        // create a DOM sprite
        var element = document.createElement("div");
        element.className = Sprite.currentTextClass[parentId];
        element.innerHTML = text;
        // optimized pointer to style object
        var style = element.style;
        // set color
        var fgcolor = Sprite.currentFgColor[parentId];
        if ( fgcolor ) {
            style.color = '#' + fgcolor.toString(16);
        }
        style.left = x + 'px';
        style.top = y + 'px';
        // put it into the game window
        parent.appendChild(element);
        //Module.print('AddTextElement('+ parentId + ', ' + x + ', ' + y + ', ' + text + ')');
    },

    XDebug: function(str) {
        str = Pointer_stringify(str);
        console.log(str);
    }
};

autoAddDeps(LibrarySprite, "$Sprite");
mergeInto(LibraryManager.library, LibrarySprite);

