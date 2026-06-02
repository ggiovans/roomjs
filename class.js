class Flashlight
{
  constructor(isGummy, width, height, segments = 1) 
  {
    this.wasOn = false;
    this.on = false;
    this.x = width / 2;
    this.y = height / 2;
    this.radius = 200;

    this.isGummy = isGummy;

    this.color = isGummy ? "#5bfaa2" : "#FFFFFF"; 

    this.maxBatterySegments = isGummy ? 84 : 4;
    this.batterySegments = segments;
    this.drainFactor = isGummy ? 3 : 0.01;
    this.segW = isGummy? 1 : 18;
    this.gap = isGummy? 0 : 4;

    this.drain = 0;
  }
}

class Zone 
{
  constructor(x, y, w, h, action) 
  {
    this.x = x; 
    this.y = y; 
    this.w = w; 
    this.h = h;
    this.action = action;
  }

  contains(px, py) 
  {
    return px >= this.x && px <= this.x + this.w && py >= this.y && py <= this.y + this.h;
  }
}

class BatteryZone 
{
  constructor(x, y, s = 27, chance = 0.01) 
  {
    this.x = x; this.y = y; this.w = s; this.h = s;
    this.chance = chance;

    this.spawned = false;
    this.collected = false;

    this.image = new Image();
    this.image.src = "assets/battery.png";

    this.flip = false;

    this.qta = 1;
  }

  roll() 
  {
    this.spawned = Math.random() < this.chance;
    this.collected = false;

    if((Math.floor(Math.random() * 3) == 0)) 
      this.image.src = "assets/altbattery.png";

    if ((Math.floor(Math.random() * 50) == 0))
    {
      this.image.src = "assets/2battery.png";
      this.qta = 2;
    }

    this.flip = Math.floor(Math.random() * 2) == 0;
  }

  draw(ctx) 
  {
    // ctx.strokeStyle = "red"; //transparent when finished
    // ctx.strokeRect(this.x, this.y, this.w, this.h);
   
    if (!this.spawned || this.collected) return;

    ctx.save();

    if(this.flip)
    {
      ctx.scale(-1, 1);
      ctx.drawImage(this.image, -this.x - this.w, this.y, this.w, this.h);
    }
    else
    {
      ctx.drawImage(this.image, this.x, this.y, this.w, this.h);
    }

    ctx.restore();
  }

  isIn(px, py) 
  {
    return this.spawned && !this.collected &&
      px >= this.x && px <= this.x + this.w &&
      py >= this.y && py <= this.y + this.h;
  }

  collect() {
    this.collected = true;
  }
}

class Room 
{
  constructor(name, imageSrc, zones = [], batteryZones = [], numTagX, numTagY, numTagW, numTagH, fontSize, floor = "fabric", forceAlpha = 1) //0 for fullbright, 1 for standard.
  {
    this.name = name;
    this.image = new Image();
    this.image.src = imageSrc;
    this.zones = zones;  
    this.batteryZones = batteryZones;
    this.floor = floor;
    this.forceAlpha = forceAlpha;

    this.numTag = { x: numTagX, y: numTagY, w: numTagW, h: numTagH }; //ts SUCKS!!! so unoptimized BRUH!!
    this.fontSize = fontSize;
  }

  draw(ctx) 
  {
    ctx.drawImage(this.image, 0, 0);
  }

  handleClick(x, y) 
  {
    for (let z of this.zones) 
    {
      if (z.contains(x, y)) 
      {
        z.action();
        return;
      }
    }
  }

  roomLog()
  {
    console.log(this.name + " | " + this.fontSize + " | " + this.numTag.x + ", " + this.numTag.y + ", " + this.numTag.w + ", " + this.numTag.h + ", " + this.floor);
  }
}

class SoundPlayer
{
  constructor()
  {
    this.bg = new Map();
    this.block = false;

    this.fades = [];
  }

  update(dt) 
  {
    for (let i = this.fades.length - 1; i >= 0; i--) 
    {
      let f = this.fades[i];

      f.audio.volume = Math.max(0, Math.min(1, f.audio.volume + f.speed * dt * f.dir));

      if ((f.dir > 0 && f.audio.volume >= f.target) || (f.dir < 0 && f.audio.volume <= f.target)) 
      {
        f.audio.volume = f.target;
        this.fades.splice(i, 1);
      }
    }
  }

  playSFX(audio)
  {
    if(this.block)
      return;

    let a = new Audio("mus/"+audio.path);
    a.volume = audio.vol;

    let min = audio.min ?? 1;
    let max = audio.max ?? 1;

    a.preservesPitch = false;
    a.playbackRate = Math.random() * (max - min) + min;

    console.log(audio.path, (Math.round((a.volume + Number.EPSILON) * 100) / 100), (Math.round((a.playbackRate + Number.EPSILON) * 100) / 100));

    a.play().catch(() => {});
  }
  
  playBG(audio) 
  {
    if (this.block)
      return;

    let existing = this.bg.get(audio.id);

    if (existing) 
    {
      existing.pause();
      existing.currentTime = 0;
    }

    let newbg = new Audio("mus/" + audio.path);
    newbg.volume = audio.vol;
    newbg.loop = true;

    this.bg.set(audio.id, newbg);
    newbg.play().catch(() => { });
  }

  stopBG(id) 
  {
    let newbg = this.bg.get(id);
    if (!newbg) return;

    newbg.pause();
    newbg.currentTime = 0;
    this.bg.delete(id);
  } 

  fadeBG(id, targetVolume, fadeSpeed = 1) 
  {
    let audio = this.bg.get(id);
    if (!audio) return;

    this.fades = this.fades.filter(f => f.audio !== audio);

    this.fades.push({ audio, target: targetVolume, speed: fadeSpeed, dir: targetVolume > audio.volume ? 1 : -1 });
  }

  muteBG(id, fadeSpeed = 0.01) 
  {
    this.fadeBG(id, 0, fadeSpeed);
  }

  unmuteBG(id, vol, fadeSpeed = 0.01) 
  {
    this.fadeBG(id, vol, fadeSpeed);
  }

  instamuteBG(id) 
  {
    let newbg = this.bg.get(id);
    if (!newbg) return;

    newbg.volume = 0;
  } 
  
  instaunmuteBG(id, vol) 
  {
    if (this.block)
      return;

    let newbg = this.bg.get(id);
    if (!newbg) return;

    newbg.volume = vol;
  }

  stopALL() 
  {
    for (let [id, audio] of this.bg.entries()) 
    {
      audio.pause();
      audio.currentTime = 0;
    }

    this.block = true;
    this.bg.clear();
  }
}

class Entity
{
  constructor(sfx, y, size, dir, speed, minRebounds, maxRebounds, glowRadius, threshR = 1200, threshL = -400) 
  {
    this.sfx = sfx;
    this.sp = new SoundPlayer();

    this.y = y;
    this.size = size;

    this.threshR = threshR + Math.floor(Math.random() * 501);
    this.threshL = threshL - Math.floor(Math.random() * 501);

    this.nearLeft = -1500;
    this.nearRight = 2500;

    this.speed = speed;
    this.dir = dir;

    this.x = this.dir == 1 ? this.threshL : this.threshR;
    
    this.rebounds = Math.floor(Math.random() * (maxRebounds - minRebounds + 1)) + minRebounds;
    this.glowRadius = glowRadius;

    this.nearTriggered = false;
    this.dead = false;

    this.colors = ["rgba(255, 0, 0, 0.42)", "rgba(255, 40, 40, 0.4)", "rgba(255, 40, 40, 0.35)", "rgba(255, 30, 30, 0)"];

    this.img = new Image();
    this.img.src = "assets/steamhappy.png";

    this.sp.playSFX(this.sfx.spawn);
    this.sp.playBG(this.sfx.ambience);
    this.sp.playBG(this.sfx.near);
    this.sp.instamuteBG(this.sfx.near.id);
  }

  checkKill()
  {
    if (this.x >= 100 && this.x <= 900)
    {
      this.sp.playSFX(this.sfx.kill);
      return true;
    }
  }

  update(dt) 
  {
    this.x += this.speed * this.dir * dt;
    this.sp.update(dt);

    let isNear = this.x >= this.nearLeft && this.x <= this.nearRight;

    if (isNear && !this.nearTriggered) 
    {
      this.nearTriggered = true;
      this.sp.unmuteBG(this.sfx.near.id, this.sfx.near.vol);
    }

    if (!isNear && this.nearTriggered) 
    {
      this.nearTriggered = false;
      this.sp.muteBG(this.sfx.near.id);
    }

    if(this.x > this.threshR || this.x < this.threshL) 
    {
      if(this.rebounds > 0)
      {
        this.dir *= -1;

        this.rebounds--;
      }
      else
      {
        this.dead = true;
        this.sp.playSFX(this.sfx.despawn);
        this.sp.muteBG(this.sfx.near.id);
        this.sp.muteBG(this.sfx.ambience.id);

        this.sp.stopBG(this.sfx.near.id);
        this.sp.stopBG(this.sfx.ambience.id);
      }
    }
  }

  draw(darkCtx, ctx) 
  {
    let cx = 50 + this.x + this.size / 2;
    let cy = this.y + this.size / 2;

    let r = this.glowRadius;

    darkCtx.globalCompositeOperation = "destination-out";

    let g = darkCtx.createRadialGradient(cx, cy, 0, cx, cy, r);

    g.addColorStop(0, "rgba(255, 0, 0, 0.79)");
    g.addColorStop(0.7, "rgba(255, 0, 0, 0.67)");
    g.addColorStop(1, "rgba(255, 0, 0, 0.27)");

    darkCtx.fillStyle = g;

    darkCtx.beginPath();
    darkCtx.arc(cx, cy, r, 0, Math.PI * 2);
    darkCtx.fill();

    darkCtx.globalCompositeOperation = "source-over";
    darkCtx.globalAlpha = 1;

    let glow = darkCtx.createRadialGradient(cx, cy, 0, cx, cy, r);

    glow.addColorStop(0, this.colors[0]);
    glow.addColorStop(0.2, this.colors[1]);
    glow.addColorStop(0.4, this.colors[2]);
    glow.addColorStop(1, this.colors[3]);

    darkCtx.fillStyle = glow;

    darkCtx.beginPath();
    darkCtx.arc(cx, cy, r, 0, Math.PI * 2);

    darkCtx.fill();

    this.drawIMG(ctx);
  }

  drawIMG(ctx)
  {
    ctx.drawImage(this.img, this.x , this.y, this.size, this.size);
  }
}

//Math.random() < 0.5 ? -1 : 1

class A60 extends Entity
{
  constructor(sfx)
  {
    super(sfx, 170, 300, 1, 60, 0, 1, 1000);

    this.threshR = 2400 + Math.floor(Math.random() * 1001);
    this.threshL = -7000 - Math.floor(Math.random() * 1001) * (this.speed / 3);

    this.x = this.dir == 1 ? this.threshL : this.threshR;

    this.name = "A-60";
    this.imgs = ["a60.png", "a60_2.png", "a60_3.png", "a60_4.png", "a60_5.png"];
    this.img.src = "assets/" + this.imgs[0];

    this.cooldown = 5;

    if(Math.floor(Math.random() * 5) != 0)
      this.rebounds = 0;
  }

  drawIMG(ctx)
  {
    if (this.cooldown <= 0) 
    {
      this.img.src = "assets/" + this.imgs[Math.floor(Math.random() * this.imgs.length)];
      this.cooldown = 5;
    }

    ctx.drawImage(this.img, this.x, this.y, this.size, this.size);
  }

  update(dt)
  {
    super.update(dt);

    if(this.cooldown > 0)
    {
      this.cooldown -= dt;
    }
  }
}

class A200 extends Entity
{
  constructor(sfx) 
  {
    super(sfx, 200, 300, Math.random() < 0.5? 1 : -1, 20, 1, 4, 800);

    this.threshR = 2400 + Math.floor(Math.random() * 1001);
    this.threshL = -5500 - Math.floor(Math.random() * 1001) * (this.speed / 3);

    this.x = this.dir == 1 ? this.threshL : this.threshR;

    this.colors = ["rgba(201, 201, 201, 0.15)", "rgba(189, 189, 189, 0.14)", "rgba(182, 182, 182, 0.10)", "rgba(239, 254, 255, 0)"];

    this.name = "A-200";
    this.imgs = ["a200.webp", "a200_2.webp", "a200_3.webp", "a200_4.webp", "a200_5.webp"];
    this.img.src = "assets/" + this.imgs[0];

    this.cooldown = 5;
  }

  drawIMG(ctx) 
  {
    if (this.cooldown <= 0) 
    {
      this.img.src = "assets/" + this.imgs[Math.floor(Math.random() * this.imgs.length)];
      this.cooldown = 5;
    }

    ctx.drawImage(this.img, this.x, this.y, this.size, this.size);
  }

  update(dt) 
  {
    super.update(dt);

    if (this.cooldown > 0) 
    {
      this.cooldown -= dt;
    }
  }
}

class Rush extends Entity 
{
  constructor(sfx) 
  {
    super(sfx, 200, 300, 1, 50, 0, 0, 20000);

    this.threshR = 2400 + Math.floor(Math.random() * 1001);
    this.threshL = -15500 - Math.floor(Math.random() * 1001) * (this.speed / 3);

    this.x = this.threshL;

    this.colors = ["rgba(16, 16, 17, 0.85)", "rgba(44, 47, 70, 0.58)", "rgba(45, 41, 68, 0.32)", "rgba(52, 42, 83, 0)"];

    this.name = "Rush";
    this.img.src = "assets/rush.png";

    this.sp.instamuteBG("rushfar");

    setTimeout(() => {
      this.sp.unmuteBG(this.sfx.ambience.id, this.sfx.ambience.vol, 0.1);
    }, 3000);
  }

  update(dt)
  {
    super.update(dt);

    console.log((Math.round((this.x + Number.EPSILON) * 100) / 100));
  }

  drawIMG(ctx) 
  {
    ctx.drawImage(this.img, this.x, this.y, this.size, this.size);
  }
}