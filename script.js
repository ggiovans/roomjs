'use strict';

const BGambience = { id: "ambience", path: "ambience.ogg", vol: 0.35 };
const BGroom100 = { id: "special", path: "room100amb.mp3", vol: 0.8 };
const BGhide = { id: "hide", path: "hide.ogg", vol: 0.1, min: 0.98, max: 1.02 };
const BGmachinehum = { id: "hum", path: "hum.wav", vol: 0.9 };

const SFXfakeout = { path: "fake.mpeg", vol: 0.15, min: 0.95, max: 1.05 };

const SFXnormalcharge = { path: "normalcharge.mp3", vol: 0.4, min: 0.95, max: 1.05 };
const SFXcharge = { path: "charge.mpeg", vol: 0.1, min: 0.95, max: 1.05 };
const SFXfirstdoor = { path: "firstdoor.mpeg", vol: 0.1, min: 0.95, max: 1.05 };
const SFXdoor = { path: "door.mpeg", vol: 0.35, min: 0.90, max: 1.10 };

const SFXhidein = { path: "lockerin.mp3", vol: 0.4, min: 0.90, max: 1.10 };
const SFXhideout = { path: "lockerout.mp3", vol: 1, min: 0.90, max: 1.10 };
const SFXtitle = { path: "title.mpeg", vol: 1.0, min: 1, max: 1 };

const SFXflashlight = { path: "flashlight.mpeg", vol: 0.5, min: 0.95, max: 1.05 };
const SFXbatterypick = { path: "batterypick.wav", vol: 0.3, min: 0.95, max: 1.05 };

const SFXfootstepsFabric = { path: "foostepsFabric.mp3", vol: 0.15, min: 0.70, max: 1.30 };
const SFXaltfootstepsFabric = { path: "foostepsFabric2.mp3", vol: 0.15, min: 0.70, max: 1.30 };

const SFXfootstepsMetal = { path: "footstepsMetal.mpeg", vol: 0.15, min: 0.95, max: 1.05 };
const SFXfootstepsGrass = { path: "footstepsGrass.mp3", vol: 0.5, min: 0.95, max: 1.05 };
const SFXfootstepsPlastic = { path: "footstepsPlastic.mpeg", vol: 0.15, min: 0.95, max: 1.05 };

const a60sfx =
{
  spawn: { path: "RumbleA60.mpeg", vol: 0.2, min: 0.95, max: 1.05 },
  ambience: { id: "a60_ambience", path: "A60AmbienceV3.mp3", vol: 1 },
  near: { id: "a60_near", path: "NearbyA60.mpeg", vol: 0.7 },
  despawn: { path: "A60despawn.mp3", vol: 0.9, min: 0.95, max: 1.05 },
  kill: { path: "A60Kill.mpeg", vol: 0.8, min: 0.95, max: 1.05 },
};

const a200sfx =
{
  spawn: { path: "a200spawn.mpeg", vol: 0.1, min: 0.95, max: 1.05 },
  ambience: { id: "a200_ambience", path: "a200ambience.mpeg", vol: 0.5 },
  near: { id: "a200_near", path: "a200near.ogg", vol: 0.9 },
  despawn: { path: "a200despawn.mpeg", vol: 0.9, min: 0.95, max: 1.05 },
  kill: { path: "a200kill2.mpeg", vol: 0.4, min: 0.95, max: 1.05 },
}; 

const rushsfx =
{
  spawn: { path: "flicker.wav", vol: 1, min: 0.95, max: 1.05 },
  ambience: { id: "rushfar", path: "rushfar.mpeg", vol: 0.2 },
  near: { id: "rushnear", path: "rushnear.mpeg", vol: 0.9 },
  despawn: { path: "rushout.mp3", vol: 0.7, min: 0.95, max: 1.05 },
  kill: { path: "rushkill.mpeg", vol: 0.3, min: 0.95, max: 1.05 },
};

const fix60fps = 1.6;

class Game 
{
  constructor(canvasId) 
  {
    this.sp = new SoundPlayer();

    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");
    this.rooms = [];
    this.specialRooms = [];
    this.entities = [];

    this.currentRoom = new Room("lobby", "assets/room0.png", 
      [
        new Zone(466, 349, 69, 94, () => this.goToNext()),
      ], 
      [
        new BatteryZone(104, 445, 27, 1),
        new BatteryZone(260, 411, 17),
        new BatteryZone(16, 564),
        new BatteryZone(6, 410),
        new BatteryZone(722, 410, 17),
        new BatteryZone(873, 444),
        new BatteryZone(968, 412),
        new BatteryZone(958, 567)
      ], 
      469, 321, 63, 21, "15px", "fabric", 0
    );

    this.currentRoom.roomLog();

    this.doorNum = 1;
    this.nextRoom = null; 
    this.lastFrame = performance.now();
    this.dt = 1;
    this.cooldown = 0;
    
    this.fadeAlpha = 0;
    this.fadeDirection = 0;
    this.lightAlpha = /*Math.floor(Math.random() * 2) == 0? 0 : 0.9*/ 0;

    this.darkCanvas = document.createElement("canvas");
    this.darkCtx = this.darkCanvas.getContext("2d");
    this.darkCanvas.width = this.canvas.width;
    this.darkCanvas.height = this.canvas.height;

    this.flashlight = new Flashlight(false, this.canvas.width, this.canvas.height);
    this.batteryCount = 0;
    this.normalsegments = 1; 
    this.gummysegments = 32;
    this.dispenderActive = false;

    this.hideBG = new Image();
    this.hideBG.src = "assets/hideBG.png";

    this.hideOverlay = new Image();
    this.hideOverlay.src = "assets/hide.png";

    this.hiding = false; 
    this.hidingtransition = null;

    this.dead = false;
    this.deathTimer = 0;
    this.deathPhase = 0; 

    this.subtitle = "";
    this.subtitleTimer = 0;

    this.canvas.addEventListener("mousemove", (e) =>
    {
      if (this.dead) return;

      let rect = this.canvas.getBoundingClientRect();

      this.flashlight.x = e.clientX - rect.left;
      this.flashlight.y = e.clientY - rect.top;
    });

    window.addEventListener("keydown", (e) =>
    {
      if (this.dead) return;

      if(e.key.toLowerCase() === "f")
      {
        this.flashlight.on = !this.flashlight.wasOn;
        this.flashlight.wasOn = this.flashlight.on;
        this.sp.playSFX(SFXflashlight);
      }
    });

    window.addEventListener("keydown", (e) => 
    {
      if (this.dead) return;

      if (e.key.toLowerCase() === "s") 
      {
        if((window.location.href).includes("ggiovans.github.io/roomjs"))
          return;

        console.log("something spawned");

        if(Math.random() < 0.5) 
          this.entities.push(new A200(a200sfx)); 
        else if (Math.random() < 0.5)
          this.entities.push(new A60(a60sfx));
        else if (Math.random() < 0.5)
            this.entities.push(new Rush(rushsfx));
        else
          this.sp.playSFX(SFXfakeout);
      }
    });

    window.addEventListener("keydown", (e) =>
    {
      if (this.dead) return;

      if(e.key.toLowerCase() === "r")
      {
        if (this.cooldown > 0)
          return;

        this.flashlight.on = this.flashlight.wasOn;

        if(this.flashlight.isGummy)
        {
          this.cooldown = 15;

          this.sp.playSFX(SFXcharge); 
          this.flashlight.batterySegments = Math.min(this.flashlight.batterySegments + 12, this.flashlight.maxBatterySegments);
        }
        else if(this.batteryCount > 0)
        {
          this.cooldown = 70;

          this.sp.playSFX(SFXnormalcharge); 

          this.batteryCount--;
          this.flashlight.batterySegments = 4;
          this.flashlight.drain = 0;
        }
      }
    });

    this.init();
  }

  init() 
  {
    this.rooms = //replace with json later?? nah
    [
      new Room("standard_2locks", "assets/room1.png", 
      [
        new Zone(457, 310, 87, 120, () => this.goToNext()),
        new Zone(219, 316, 84, 119, () => this.hide()),
        new Zone(698, 316, 84, 119, () => this.hide())
      ],
      [
        new BatteryZone(3, 471),
        new BatteryZone(970, 467),
        new BatteryZone(320, 417, 18),
        new BatteryZone(662, 417, 18)
      ], 
      460, 274, 81, 27, "18px"),

      new Room("alt_standard_2locks", "assets/room2.png", 
      [
        new Zone(457, 310, 87, 120, () => this.goToNext()),
        new Zone(219, 316, 84, 119, () => this.hide()),
        new Zone(698, 316, 84, 119, () => this.hide())
      ],
      [
        new BatteryZone(3, 471),
        new BatteryZone(970, 467),
        new BatteryZone(320, 417, 18),
        new BatteryZone(662, 417, 18)
      ], 
      460, 274, 81, 27, "18px"),    
      
      new Room("r_3locks", "assets/room3.png", 
      [
        new Zone(301, 303, 97, 133, () => this.goToNext()),
        new Zone(492, 333, 184, 85, () => this.hide())
      ],
      [
        new BatteryZone(186, 418),
        new BatteryZone(472, 407, 16),
        new BatteryZone(677, 408, 15)
      ], 
      305, 263, 90, 30, "20px"),

      new Room("r_corner_table", "assets/room4.png", 
      [
        new Zone(405, 347, 60, 82, () => this.goToNext()),
      ],
      [
        new BatteryZone(331, 416, 17), //27 is standard, please remember
        new BatteryZone(524, 416, 17),
        new BatteryZone(580, 462, 24),
        new BatteryZone(746, 391),
        new BatteryZone(843, 394),
        new BatteryZone(781, 492),
        new BatteryZone(883, 488)
      ], 
      407, 323, 55, 18, "14px"),

      new Room("hallway", "assets/room5.png", 
      [
        new Zone(479, 357, 88, 120, () => this.goToNext()),
      ],
      [
        new BatteryZone(336, 463, 18),
        new BatteryZone(687, 464, 18),
        new BatteryZone(757, 458),
        new BatteryZone(808, 479),
        new BatteryZone(911, 478),
        new BatteryZone(749, 568),
        new BatteryZone(872, 567),
        new BatteryZone(818, 626),
        new BatteryZone(946, 625)
      ], 
      483, 321, 80, 27, "18px"),

      new Room("alt_r_corner_table", "assets/room6.png", 
      [
        new Zone(535, 347, 60, 82, () => this.goToNext()),
      ],
      [
        new BatteryZone(652, 416, 17), //27 is standard, please remember
        new BatteryZone(459, 416, 17),
        new BatteryZone(396, 462, 24),
        new BatteryZone(227, 391),
        new BatteryZone(130, 394),
        new BatteryZone(192, 492),
        new BatteryZone(90, 488)
      ], 
      538, 323, 55, 18, "14px"),

      new Room("alt_r_3locks", "assets/room7.png", 
      [
        new Zone(601, 303, 98, 133, () => this.goToNext()),
        new Zone(324, 333, 184, 85, () => this.hide())
      ],
      [
        new BatteryZone(787, 418),
        new BatteryZone(512, 407, 16),
        new BatteryZone(308, 408, 15)
      ], 
      605, 263, 90, 30, "20px")

    //   new Room("room_100", "assets/room100.png", //remove later
    //   [
    //     new Zone(475, 352, 62, 85, () => this.goToNext()),
    //     new Zone(174, 389, 96, 45, () => this.getGummy()),
    //   ],
    //   [
    //     new BatteryZone(154, 484, 27, 1),
    //     new BatteryZone(297, 481, 20),
    //     new BatteryZone(907, 501),
    //     new BatteryZone(878, 431),
    //     new BatteryZone(772, 425),
    //     new BatteryZone(606, 376, 16),
    //     new BatteryZone(613, 331, 15),
    //     new BatteryZone(809, 502)
    //   ], 
    //   478, 327, 56, 19, "15px", "grass", 0.8)
     ];

    this.specialRooms = 
    [
      new Room("room_100", "assets/room100.png",
      [
        new Zone(475, 352, 62, 85, () => this.goToNext()),
        new Zone(174, 389, 96, 45, () => this.getGummy()),
      ], 
      [
        new BatteryZone(154, 484, 27, 1),
        new BatteryZone(297, 481, 20),
        new BatteryZone(907, 501),
        new BatteryZone(878, 431),
        new BatteryZone(772, 425),
        new BatteryZone(606, 376, 16),
        new BatteryZone(613, 331, 15),
        new BatteryZone(809, 502)
      ],
      478, 327, 56, 19, "15px", "grass", 0.8)
    ];
    
    this.canvas.addEventListener("click", (e) => 
    {
      if (this.dead) return;

      if (this.cooldown > 0)
        return;

      let rect = this.canvas.getBoundingClientRect();
      let x = e.clientX - rect.left, y = e.clientY - rect.top;
      
      if (this.hiding) 
      {
        this.unhide();
        return;
      }

      for (let z of (this.currentRoom.batteryZones || [])) 
      {
        if (z.isIn(x, y)) 
        {
          z.collect();
          this.sp.playSFX(SFXbatterypick);
          this.batteryCount += z.qta;
          return;
        }
      }
      
      this.currentRoom.handleClick(x, y);
      
    });

    this.ctx.textBaseline = "middle"; //might be moved if I wanna have subtitles as well
    this.ctx.textAlign = "center";
    this.ctx.fillStyle = "black";
    this.ctx.font = `bold ${this.currentRoom.fontSize} Calibri`;

    this.showDoorNum("A-" + ((this.doorNum).toString().padStart(3, "0"))); //first load of number tag

    for (let z of this.currentRoom.batteryZones) {
      z.roll();
    }

    this.loop();
  }

  randomRoom() 
  {
    let tmp;

    do
    {
      tmp = this.rooms[Math.floor(Math.random() * this.rooms.length)];
    } while(tmp.name == this.currentRoom.name);
        
    tmp.roomLog();

    return new Room(tmp.name, tmp.image.src, tmp.zones, tmp.batteryZones, tmp.numTag.x, tmp.numTag.y, tmp.numTag.w, tmp.numTag.h, tmp.fontSize, tmp.floor, tmp.forceAlpha); //wtf is THIS!!
  }

  goToNext() 
  {
    this.cooldown = 105;
    this.sp.playSFX(SFXdoor);

    this.doorNum++;

    switch(this.doorNum)
    {
      case 100: this.startTransition(this.specialRooms[0]); return;
    }
    
    this.startTransition(this.randomRoom());
  }

  hide() 
  {
    this.hidingtransition = () => { this.hiding = true; }   
    
    this.cooldown = 75;

    this.sp.playSFX(SFXhidein);
    this.sp.playBG(BGhide)

    this.fadeDirection = 1;

  }

  unhide() 
  {
    this.hidingtransition = () => { this.hiding = false; }   

    this.cooldown = 75;

    this.sp.playSFX(SFXhideout);
    this.sp.stopBG(BGhide.id);

    this.fadeDirection = 1;
  }

  update()
  {
    if(this.fadeDirection !== 0)
    {
      let step = this.hidingtransition? 0.05 : 0.025;

      this.fadeAlpha += step * this.fadeDirection * this.dt * fix60fps;

      if(this.fadeAlpha >= 1)
      {
        this.fadeAlpha = 1;

        if(this.hidingtransition)
        {
          this.hidingtransition();
          this.hidingtransition = null;
        }
        else
        {
          this.currentRoom = this.nextRoom;

          for (let z of this.currentRoom.batteryZones) {
            z.roll();
          }

          this.showDoorNum("A-" + ((this.doorNum).toString().padStart(3, "0")));
        }

        this.fadeDirection = -1;
      }

      if(this.fadeAlpha <= 0)
      {
        this.fadeAlpha = 0;
        this.fadeDirection = 0;
      }
    }

    if(this.cooldown > 0)
    {
      this.cooldown -= this.dt * fix60fps;
    }

    if(this.flashlight.on)
    {
      this.flashlight.drain += this.flashlight.drainFactor * this.dt * fix60fps;
    }

    if(this.flashlight.drain >= 25)
    {
      this.flashlight.batterySegments--;
      this.flashlight.drain = 0;
    }

    if(this.flashlight.batterySegments <= 0)
    {
      this.flashlight.on = false;
    }

    if (this.subtitleTimer > 0) 
    {
      this.subtitleTimer -= this.dt;

      if (this.subtitleTimer <= 0) 
      {
        this.subtitle = "";
        this.subtitleTimer = 0;
      }
    }

    this.updateEntities();
    this.updateDeath(this.dt);
  }

  updateEntities()
  {
    for (let x of this.entities) 
    {
      x.update(this.dt);

      if (!this.hiding && x.checkKill())
      {
        console.log("you died bro");

        x.dead = true;

        this.sp.stopALL();
        x.sp.stopALL();

        this.dead = true;
      }
    }

    this.entities = this.entities.filter(x => !x.dead);
  }

  spawnEntity()
  {
    if(this.doorNum == 100)
      return;

    if (Math.random() < 0.005 && this.doorNum >= 50)
    {
      console.log("fakeout");
      this.sp.playSFX(SFXfakeout);
    }
    else if(Math.random() < Math.min(0.0005 * this.doorNum, 0.2) && this.doorNum >= 60)
    {
      console.log("a60 spawned");
      this.entities.push(new A60(a60sfx));
    }

    if (Math.random() < Math.min(0.001 * this.doorNum, 0.25) && this.doorNum >= 200)
    {
      console.log("a200 spawned");
      this.entities.push(new A200(a200sfx));
    }

    if(Math.random() < 0.0005 && this.doorNum >= 100)
    {
      console.log("WTF Rush spawned");
      this.entities.push(new Rush(rushsfx));
    }
  }

  updateDeath(dt) 
  {
    if (!this.dead) return;

    this.deathTimer += dt;

    if (this.deathPhase === 0) 
    {
      if (this.deathTimer > 300) 
      {
        this.deathTimer = 0;
        this.deathPhase = 1;
      }
    }
  }

  draw() 
  {
    if (!this.currentRoom.image.complete) return;

    this.currentRoom.draw(this.ctx);
    this.showGummy();

    let text = this.message;
    this.ctx.font = `bold ${this.currentRoom.fontSize} Calibri`;

    const tag = this.currentRoom.numTag;

    let m = this.ctx.measureText(text);

    let centerX = tag.x + tag.w / 2;
    let centerY = tag.y + tag.h / 2;

    let x = centerX;
    let y = centerY + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;

    this.ctx.fillText(text, x, y);

    for (let z of this.currentRoom.batteryZones) 
    {
      z.draw(this.ctx);
    }

    if (this.hiding)
      this.ctx.drawImage(this.hideBG, 0, 0, this.canvas.width, this.canvas.height);

    this.darkCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.darkCtx.clearRect(0, 0, this.darkCanvas.width, this.darkCanvas.height);

    this.darkCtx.globalCompositeOperation = "source-over";

    let darknessAlpha = this.lightAlpha;

    if(this.currentRoom.forceAlpha !== 1)
      darknessAlpha = this.currentRoom.forceAlpha;

    this.darkCtx.globalAlpha = darknessAlpha;
    this.darkCtx.fillStyle = "black";
    this.darkCtx.fillRect(0, 0, this.darkCanvas.width, this.darkCanvas.height);

    for (let e of this.entities) 
    {
      e.draw(this.darkCtx, this.ctx);
    }

    if (this.hiding)
      this.ctx.drawImage(this.hideOverlay, 0, 0, this.canvas.width, this.canvas.height);

    if(this.flashlight.on)
    {
      let r = this.flashlight.radius;

      this.darkCtx.globalCompositeOperation = "destination-out";

      let g = this.darkCtx.createRadialGradient(this.flashlight.x, this.flashlight.y, 0, this.flashlight.x, this.flashlight.y, r);

      let strenght = [0.37, 0.35, 0];

      if (this.hiding) 
      {
        strenght[0] *= 1.5;
        strenght[1] *= 1.5;
      }

      if(this.flashlight.batterySegments <= Math.ceil(this.flashlight.maxBatterySegments / 2) || true)
      {
        strenght[0] *= Math.min(0.75 * this.flashlight.batterySegments / this.flashlight.maxBatterySegments, 0.4);
        strenght[1] *= Math.min(0.75 * this.flashlight.batterySegments / this.flashlight.maxBatterySegments, 0.4);

        r = Math.min(this.flashlight.radius * 3.5 * this.flashlight.batterySegments / this.flashlight.maxBatterySegments, this.flashlight.radius);
      }

      g.addColorStop(0, "rgba(0,0,0," + strenght[0] + ")"); //37, 35, 0
      g.addColorStop(0.3, "rgba(0,0,0," + strenght[1] + ")");
      g.addColorStop(1, "rgba(0,0,0," + strenght[2] + ")");

      this.darkCtx.fillStyle = g;

      this.darkCtx.beginPath();
      this.darkCtx.arc(this.flashlight.x, this.flashlight.y, r, 0, Math.PI * 2);
      this.darkCtx.fill();

      this.darkCtx.globalCompositeOperation = "source-over";
      this.darkCtx.globalAlpha = 1;

      let glow = this.darkCtx.createRadialGradient(this.flashlight.x, this.flashlight.y, 0, this.flashlight.x, this.flashlight.y, r);
      
      if(!this.flashlight.isGummy)
      {
        glow.addColorStop(0, "rgba(255, 220, 40, 0.14)");
        glow.addColorStop(0.4, "rgba(255, 200, 30, 0.08)");
        glow.addColorStop(1, "rgba(255, 160, 20, 0)"); 
      }
      else
      {
        glow.addColorStop(0, "rgba(0, 255, 50, 0.22)");
        glow.addColorStop(0.2, "rgba(0, 180, 40, 0.20)");
        glow.addColorStop(0.4, "rgba(0, 180, 40, 0.15)");
        glow.addColorStop(1, "rgba(0, 90, 30, 0)");
      }

      this.darkCtx.fillStyle = glow;

      this.darkCtx.beginPath();
      this.darkCtx.arc(this.flashlight.x, this.flashlight.y, r, 0, Math.PI * 2);

      this.darkCtx.fill();
    }

    let steppedFade = Math.round(this.fadeAlpha * 3) / 3;

    this.darkCtx.globalCompositeOperation = "source-over";
    this.darkCtx.globalAlpha = steppedFade;
    this.darkCtx.fillStyle = "black";
    this.darkCtx.fillRect(0, 0, this.darkCanvas.width, this.darkCanvas.height);

    this.ctx.drawImage(this.darkCanvas, 0, 0);
    this.drawUI();
  }

  drawUI()
  {
    const x = 10;
    const y = this.canvas.height - 50;

    const segH = 38;
    const segW = this.flashlight.segW;
    const gap = this.flashlight.gap;

    this.ctx.save();

    this.ctx.fillStyle = this.flashlight.color;
    this.ctx.strokeStyle = this.flashlight.color;
    this.ctx.lineWidth = 2;

    this.ctx.strokeRect(x, y, segW * this.flashlight.maxBatterySegments + gap * 3 + 8, segH);
    this.ctx.fillRect(x + segW * this.flashlight.maxBatterySegments + gap * 3 + 8, y + 8, 5, segH / 2);

    for(let i = 0; i < this.flashlight.batterySegments; i++)
    {
      this.ctx.fillRect(x + 4 + i * (segW + gap), y + 4, segW, segH - 8);
    }

    if(!this.flashlight.isGummy && this.batteryCount > 0)
    {
      this.ctx.font = "24px Calibri";
      this.ctx.textAlign = "left";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText("" + this.batteryCount, x + 105, y + segH / 2);
    }

    this.ctx.restore(); 

    this.drawDeathOverlay(); 
    this.drawSubtitles();
  }

  drawSubtitles() 
  {
    if (!this.subtitle)
      return;

    this.ctx.save();

    this.ctx.font = "22px Calibri";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";

    let h = 46;
    let y = this.canvas.height - 90;

    this.ctx.fillStyle = "#0000001e";
    this.ctx.fillText(this.subtitle, this.canvas.width / 2 - 2, y + h / 2 + 2);

    this.ctx.fillStyle = "#FFDEBD";
    this.ctx.fillText(this.subtitle, this.canvas.width / 2, y + h / 2);

    this.ctx.restore();
  }

  drawDeathOverlay() 
  {
    if (!this.dead) return;

    let alpha = 0;

    if (this.deathPhase === 0) 
    {
      this.ctx.save();
      this.ctx.fillStyle = "rgb(120, 0, 0)";
      this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
      this.ctx.restore();
      return;
    }

    if (this.deathPhase === 1) 
    {
      let t = Math.min(this.deathTimer / 2, 1);

      this.ctx.save();
      this.ctx.fillStyle = `rgba(120, 0, 0, ${1 - t})`;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.ctx.fillStyle = `rgba(0,0,0,${t * 0.4})`;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.restore();

      this.ctx.save();
      this.ctx.globalCompositeOperation = "saturation";
      this.ctx.fillStyle = `rgba(133, 133, 133,${t})`; 
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.restore();

      if (t >= 1) 
      {
        this.lightAlpha = 0;
        this.showSubtitle("you died. this is the end.");
      }
    }
  }

  updateCursor() 
  {
    if (this.dead) 
    {
      this.canvas.style.cursor = "default";
      return;
    }

    if (this.hiding) 
    {
      this.canvas.style.cursor = "grab"; //replace with custom
      return;
    }

    let hoveringDoor = this.currentRoom.zones.some(z => this.flashlight.x >= z.x && this.flashlight.x <= z.x + z.w && this.flashlight.y >= z.y && this.flashlight.y <= z.y + z.h);
    let hoveringBattery = this.currentRoom.batteryZones.some(z => this.flashlight.x >= z.x && this.flashlight.x <= z.x + z.w && this.flashlight.y >= z.y && this.flashlight.y <= z.y + z.h && !z.collected && z.spawned);

    if (this.lightAlpha < 0.95 || this.flashlight.on)
      this.canvas.style.cursor = hoveringDoor ? "pointer" : hoveringBattery? "grab" : "default";
    else
      this.canvas.style.cursor = "default";
  }

  getGummy()
  {
    if(!this.dispenderActive)
    {
      if (this.batteryCount < 5) 
      {
        this.showSubtitle("You need 5 batteries for this.");
        return;
      }

      this.batteryCount -= 5;
      this.dispenderActive = true;
      this.showSubtitle("You inserted 5 batteries into the dispenser... Something came out.");

      this.sp.playSFX(SFXnormalcharge); 
      this.sp.playBG(BGmachinehum);
    }
    else
    {
      if(!this.flashlight.isGummy)
        this.normalsegments = this.flashlight.batterySegments;
      else
        this.gummysegments = this.flashlight.batterySegments;

      this.flashlight = new Flashlight(!this.flashlight.isGummy, this.canvas.width, this.canvas.height, this.flashlight.isGummy? this.normalsegments : this.gummysegments); 
      this.showSubtitle(this.flashlight.isGummy ? "Gummy Flashlight. Infinite battery with a much shorter durability. Recharge at any time with R." : "You picked up back the normal flashlight.");
    }
  }

  showGummy()
  {
    if(this.dispenderActive && this.doorNum == 100)
    {
      let img = new Image();
      img.src = this.flashlight.isGummy ? "assets/flashdrop.png" : "assets/gummydrop.png";

      this.ctx.drawImage(img, 191, 407);
    }
  }

  loop(now = performance.now()) 
  {
    this.dt = Math.min((now - this.lastFrame) / 16.666, 3);
    this.lastFrame = now;

    this.update();
    this.draw();
    this.updateCursor();

    requestAnimationFrame((t) => this.loop(t));
  }

  showDoorNum(text) 
  {
    this.message = text;
    console.log(text + " | " + (Math.round((this.lightAlpha + Number.EPSILON) * 100) / 100));
  }

  // doorAnimation() //maybe another time :P
  // {

  // }

  showSubtitle(text, duration = 180) 
  {
    this.subtitle = text;
    this.subtitleTimer = duration;
  }

  startTransition(newRoom)
  {
    this.canvas.style.cursor = "default";
    this.nextRoom = newRoom;
    this.fadeDirection = 1;

    this.lightAlpha = Math.min(this.lightAlpha + 0.005, 1);

    let sfx = SFXfootstepsFabric;
    switch (newRoom.floor) 
    {
      case "metal": sfx = SFXfootstepsMetal; break;
      case "grass": sfx = SFXfootstepsGrass; break;
      case "plastic": sfx = SFXfootstepsPlastic; break;
      default: if (Math.floor(Math.random() * 2) == 0) sfx = SFXaltfootstepsFabric;
    }

    this.sp.playSFX(sfx);

    switch (newRoom.name)
    {
      case "room_100": this.sp.playBG(BGroom100, true); break;
      default: this.sp.stopBG("special"); this.sp.stopBG("hum"); break;
    }

    this.spawnEntity();
  }
}

window.onload = () => 
{
  const game = new Game("game");

  setTimeout(function() 
  {
    game.sp.playSFX(SFXtitle);
    game.sp.playBG(BGambience);
  }, 1800);

  game.sp.playSFX(SFXfirstdoor);
  game.showSubtitle("Click to interact. Press F to use the flashlight. Press R to recharge (consumes batteries).", 360);
};

