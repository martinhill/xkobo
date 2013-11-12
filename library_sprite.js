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
            Sprite.newMovingSpritesPerSecond = 10;
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
            Sprite.sprites = [];

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
                    Sprite.sprites[Sprite.spriteCount] = new Sprite.SpriteX();
                    Sprite.spriteCount++;
                }

                howmany = Sprite.newLevelSpritesPerSecond;
                while (howmany--)
                {
                    // also add tiles to the static level geometry
                    Sprite.levelSprites[Sprite.levelSpriteCount] = new Sprite.SpriteX(Sprite.level);
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
                        Sprite.sprites[Sprite.spriteCount-1].destroy();
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
                // random starting position
                if (this.parent == level) 
                {
                    this.x = Math.round(Math.random() * Sprite.levelW);
                    this.y = Math.round(Math.random() * Sprite.levelH);
                }
                else // regular sprite in the viewport
                {
                    this.x = Math.round(Math.random() * Sprite.viewportW);
                    this.y = Math.round(Math.random() * Sprite.viewportH);
                }
                this.reposition();
                // give it a random speed
                this.xSpeed = Math.round(Math.random() * 10) - 5;
                this.ySpeed = Math.round(Math.random() * 10) - 5;
                // no still sprites
                if (this.xSpeed == 0) this.xSpeed  = 1;
                if (this.ySpeed == 0) this.ySpeed  = 1;
                // random spritesheet frame
                this.frame(Sprite.spriteCount);
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
                Sprite.sprites[loop].x += Sprite.sprites[loop].xSpeed;
                Sprite.sprites[loop].y += Sprite.sprites[loop].ySpeed;

                // bounce at edges
                if ((Sprite.sprites[loop].x <= 0) || (Sprite.sprites[loop].x >= Sprite.viewportW))
                    Sprite.sprites[loop].xSpeed = -1 * Sprite.sprites[loop].xSpeed;
                if ((Sprite.sprites[loop].y <= 0) || (Sprite.sprites[loop].y >= Sprite.viewportH))
                    Sprite.sprites[loop].ySpeed = -1 * Sprite.sprites[loop].ySpeed;

                Sprite.sprites[loop].reposition();
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
        }
    },

    SpriteDemoInit: function() {
        Sprite.init(Module['wchip'], Module['level'], Module['background']);
    },

    SpriteDemoAnimate: function() {
        Sprite.animate();
    },

    SpriteInit: function() {
        if (!Module['doNotCaptureKeyboard']) {
            document.addEventListener("keydown", Sprite.receiveEvent);
            document.addEventListener("keyup", Sprite.receiveEvent);
            document.addEventListener("keypress", Sprite.receiveEvent);
        }

    },

    PollEvent: function(ptr) {
        if (Sprite.events.length === 0) return 0;
        if (ptr) {
            Sprite.makeCEvent(Sprite.events.shift(), ptr);
        }
        return 1;
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
                parent.removeChild(child);
            }
        }
        //Module.print('ClearElements(' + parentId + ')');
    },

    SelectFont: function(parentId, s) {
        s = Pointer_stringify(s);
        Sprite.currentTextClass[parentId] = Module.fontmap[s] || Module.fontmap.def;
        //Module.print('SelectFont(' + s + '): ' + Sprite.currentTextClass[parentId]);
    },

    SetForegroundColor: function(parentId, color) {
        Sprite.currentFgColor[parentId] = color;
        Module.print('foreground for ' + parentId + ' is ' + color);
    },
    
    SetBackgroundColor: function(parentId, color) {
        Sprite.currentBgColor[parentId] = color;
        Module.print('background for ' + parentId + ' is ' + color);
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
    }

};

autoAddDeps(LibrarySprite, "$Sprite");
mergeInto(LibraryManager.library, LibrarySprite);

