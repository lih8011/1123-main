import React, { useRef, useEffect, useCallback } from 'react';
import { 
  GameState, Monster, Human, Wall, Particle, Camera, Prop, PropType, Projectile, HumanState
} from '../types';
import { 
  WORLD_WIDTH, WORLD_HEIGHT, LAYER_COUNT, CENTER_ROOM_SIZE, LAYER_THICKNESS, WALL_SEGMENT_SIZE,
  COLORS, INITIAL_MONSTER_SIZE, HUMAN_SIZE, GROWTH_PER_HUMAN,
  WALL_HEIGHT, WALL_THICKNESS, HUMAN_SPEED, MONSTER_SPEED, HUMAN_HEIGHT, VISUAL_Z_SCALE,
  PROJECTILE_SPEED, DAMAGE_SOLDIER, DAMAGE_ELITE, COOLDOWN_SOLDIER, COOLDOWN_ELITE, RANGE_SOLDIER, RANGE_ELITE,
  KEYS
} from '../constants';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  onLogUpdate: (log: string) => void;
  onStatsUpdate: (stats: { size: number, eaten: number }) => void;
  inputRef: React.MutableRefObject<{ x: number, y: number }>;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ 
  gameState, setGameState, onLogUpdate, onStatsUpdate, inputRef 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  
  // Game State Refs
  const monsterRef = useRef<Monster>({
    id: 'player',
    pos: { x: 0, y: 0 }, velocity: { x: 0, y: 0 },
    radius: INITIAL_MONSTER_SIZE,
    visualHeight: 40,
    color: COLORS.MONSTER,
    hp: 100, maxHp: 100, level: 1, exp: 0, nextLevelExp: 5, damage: 100
  });

  const humansRef = useRef<Human[]>([]);
  const wallsRef = useRef<Wall[]>([]);
  const propsRef = useRef<Prop[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const cameraRef = useRef<Camera>({ x: 0, y: 0 });
  const shakeRef = useRef<number>(0);
  
  // Visual FX refs
  const flashRef = useRef<number>(0); 
  const hurtFlashRef = useRef<number>(0); 
  
  const keysPressed = useRef<Set<string>>(new Set());
  const statsRef = useRef({ humansEaten: 0, wallsBroken: 0, lastNarrationLevel: 0 });

  // --- INITIALIZATION ---
  const initGame = useCallback(() => {
    statsRef.current = { humansEaten: 0, wallsBroken: 0, lastNarrationLevel: 0 };
    
    const startX = WORLD_WIDTH / 2;
    const startY = WORLD_HEIGHT / 2;

    monsterRef.current = {
      id: 'player',
      pos: { x: startX, y: startY }, velocity: { x: 0, y: 0 },
      radius: INITIAL_MONSTER_SIZE,
      visualHeight: 50,
      color: COLORS.MONSTER,
      hp: 100, maxHp: 100, level: 1, exp: 0, nextLevelExp: 5, damage: 100
    };

    cameraRef.current = { x: startX - window.innerWidth/2, y: startY - window.innerHeight/2 };
    shakeRef.current = 0;

    const newHumans: Human[] = [];
    const newWalls: Wall[] = [];
    const newProps: Prop[] = [];

    // --- LABORATORY GENERATION ---
    for (let i = 0; i < LAYER_COUNT; i++) {
      const currentSize = CENTER_ROOM_SIZE + (i * LAYER_THICKNESS * 2);
      const prevSize = i === 0 ? 0 : CENTER_ROOM_SIZE + ((i - 1) * LAYER_THICKNESS * 2);
      const left = startX - currentSize / 2;
      const top = startY - currentSize / 2;
      const right = startX + currentSize / 2;
      const bottom = startY + currentSize / 2;
      
      const requiredSize = INITIAL_MONSTER_SIZE + 15 + (i * 20); 
      const wallHp = 60 + (i * 60);
      
      // 2. GENERATE WALLS
      const numSegmentsX = Math.ceil(currentSize / WALL_SEGMENT_SIZE);
      const numSegmentsY = Math.ceil((currentSize - (WALL_THICKNESS * 2)) / WALL_SEGMENT_SIZE);
      
      for (let s = 0; s < numSegmentsX; s++) {
        const wx = left + (s * WALL_SEGMENT_SIZE);
        newWalls.push({
            id: `w-l${i}-t-${s}`, x: wx, y: top,
            width: WALL_SEGMENT_SIZE, height: WALL_THICKNESS, visualHeight: WALL_HEIGHT,
            hp: wallHp, maxHp: wallHp, isBreakable: true, requiredSize, layerIndex: i
        });
        
        const wx2 = left + (s * WALL_SEGMENT_SIZE);
        newWalls.push({
            id: `w-l${i}-b-${s}`, x: wx2, y: bottom - WALL_THICKNESS,
            width: WALL_SEGMENT_SIZE, height: WALL_THICKNESS, visualHeight: WALL_HEIGHT,
            hp: wallHp, maxHp: wallHp, isBreakable: true, requiredSize, layerIndex: i
        });
      }
      for (let s = 0; s < numSegmentsY; s++) {
         const wy = top + WALL_THICKNESS + (s * WALL_SEGMENT_SIZE);
         newWalls.push({
            id: `w-l${i}-l-${s}`, x: left, y: wy,
            width: WALL_THICKNESS, height: WALL_SEGMENT_SIZE, visualHeight: WALL_HEIGHT,
            hp: wallHp, maxHp: wallHp, isBreakable: true, requiredSize, layerIndex: i
        });
         
         const wy2 = top + WALL_THICKNESS + (s * WALL_SEGMENT_SIZE);
         newWalls.push({
            id: `w-l${i}-r-${s}`, x: right - WALL_THICKNESS, y: wy2,
            width: WALL_THICKNESS, height: WALL_SEGMENT_SIZE, visualHeight: WALL_HEIGHT,
            hp: wallHp, maxHp: wallHp, isBreakable: true, requiredSize, layerIndex: i
        });
      }

      // 3. GENERATE ENTITIES
      const count = 10 + (i * 8); 
      const innerSize = i === 0 ? 0 : CENTER_ROOM_SIZE + ((i - 1) * LAYER_THICKNESS * 2);
      
      const getSafePos = (padding: number) => {
          let px = 0, py = 0, safe = false, attempts = 0;
          while (!safe && attempts < 50) {
            attempts++;
            px = left + Math.random() * currentSize;
            py = top + Math.random() * currentSize;
            const dx = Math.abs(px - startX);
            const dy = Math.abs(py - startY);
            if (i === 0) {
                if (dx < (CENTER_ROOM_SIZE/2 - padding) && dy < (CENTER_ROOM_SIZE/2 - padding)) safe = true;
            } else {
                if (dx > innerSize/2 + padding || dy > innerSize/2 + padding) {
                     if (dx < currentSize/2 - padding && dy < currentSize/2 - padding) safe = true;
                }
            }
          }
          return safe ? {x: px, y: py} : null;
      };

      for (let h = 0; h < count; h++) {
        const pos = getSafePos(30);
        if (pos) {
            let type: 'scientist' | 'guard' | 'soldier' | 'elite' = 'scientist';
            let color = COLORS.SCIENTIST_COAT;
            let canShoot = false;
            let range = 0;
            let maxCooldown = 0;
            
            const rand = Math.random();
            if (i === 0 || i === 1) {
                if (rand > 0.7) { type = 'guard'; color = COLORS.GUARD_UNIFORM; }
            } else if (i === 2) {
                if (rand > 0.6) { 
                    type = 'soldier'; color = COLORS.SOLDIER_UNIFORM; 
                    canShoot = true; range = RANGE_SOLDIER; maxCooldown = COOLDOWN_SOLDIER;
                } else if (rand > 0.4) { type = 'guard'; color = COLORS.GUARD_UNIFORM; }
            } else {
                if (rand > 0.7) { 
                    type = 'elite'; color = COLORS.ELITE_UNIFORM; 
                    canShoot = true; range = RANGE_ELITE; maxCooldown = COOLDOWN_ELITE;
                } else if (rand > 0.4) { 
                    type = 'soldier'; color = COLORS.SOLDIER_UNIFORM; 
                    canShoot = true; range = RANGE_SOLDIER; maxCooldown = COOLDOWN_SOLDIER;
                }
            }

            newHumans.push({
                id: `h-l${i}-${h}`,
                pos: pos, velocity: { x: 0, y: 0 },
                radius: HUMAN_SIZE, visualHeight: HUMAN_HEIGHT,
                color, type,
                state: 'idle', stateTimer: 0, animOffset: Math.random() * 10,
                panic: false, speed: HUMAN_SPEED + (Math.random()),
                direction: Math.random() * Math.PI * 2,
                canShoot, attackRange: range, maxCooldown, attackCooldown: Math.random() * maxCooldown
            });
        }
      }

      const propCount = 6 + (i * 5);
      for (let p = 0; p < propCount; p++) {
          const pos = getSafePos(60);
          if (pos) {
              const type = Math.random() > 0.5 ? PropType.SERVER : PropType.CRYO_TANK;
              newProps.push({
                  id: `p-l${i}-${p}`,
                  type,
                  x: pos.x, y: pos.y,
                  width: type === PropType.SERVER ? 50 : 40,
                  height: type === PropType.SERVER ? 30 : 40,
                  visualHeight: type === PropType.SERVER ? 70 : 80,
                  hp: 1, isDead: false
              });
          }
      }
    }

    wallsRef.current = newWalls;
    humansRef.current = newHumans;
    propsRef.current = newProps;
    particlesRef.current = [];
    projectilesRef.current = [];
  }, []);

  const createParticles = (x: number, y: number, z: number, color: string, count: number, speedMult: number = 1) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (Math.random() * 4 + 2) * speedMult;
      particlesRef.current.push({
        id: `p-${Math.random()}`,
        x, y, z: z + Math.random() * 20,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, vz: Math.random() * 8 + 4,
        life: 1.0, maxLife: 1.0, color, size: Math.random() * 4 + 2
      });
    }
  };

  const update = useCallback(async () => {
    if (gameState !== GameState.PLAYING) return;

    // --- SCREEN SHAKE DECAY ---
    if (shakeRef.current > 0) {
        shakeRef.current *= 0.9;
        if (shakeRef.current < 0.5) shakeRef.current = 0;
    }

    const monster = monsterRef.current;
    
    // --- MONSTER PHYSICS ---
    let dx = 0, dy = 0;
    // Keyboard Input
    if (keysPressed.current.has('w') || keysPressed.current.has('arrowup')) dy -= 1;
    if (keysPressed.current.has('s') || keysPressed.current.has('arrowdown')) dy += 1;
    if (keysPressed.current.has('a') || keysPressed.current.has('arrowleft')) dx -= 1;
    if (keysPressed.current.has('d') || keysPressed.current.has('arrowright')) dx += 1;

    // Joystick Input (Override if active)
    if (inputRef.current.x !== 0 || inputRef.current.y !== 0) {
        dx = inputRef.current.x;
        dy = inputRef.current.y;
    }

    // Velocity & Position
    if (dx !== 0 || dy !== 0) {
      // Normalize if length > 1 (to prevent faster diagonal speed, though joystick handles this naturally)
      const length = Math.hypot(dx, dy);
      const scale = length > 1 ? 1 / length : 1; // Allows partial speed on joystick
      
      monster.pos.x += dx * scale * MONSTER_SPEED;
      monster.pos.y += dy * scale * MONSTER_SPEED;
    }
    
    // Camera follow with slight lag for smoothness
    // Calculate target position (centered on monster, slightly leading movement)
    const leadX = dx * 150;
    const leadY = dy * 150;
    const targetCamX = monster.pos.x - window.innerWidth / 2 + leadX;
    const targetCamY = monster.pos.y - window.innerHeight / 2 + leadY;
    
    cameraRef.current.x += (targetCamX - cameraRef.current.x) * 0.1;
    cameraRef.current.y += (targetCamY - cameraRef.current.y) * 0.1;

    // --- WALL LOGIC ---
    wallsRef.current = wallsRef.current.filter(wall => {
      if (wall.hp <= 0) return false;
      
      const closestX = Math.max(wall.x, Math.min(monster.pos.x, wall.x + wall.width));
      const closestY = Math.max(wall.y, Math.min(monster.pos.y, wall.y + wall.height));
      const distSq = Math.pow(monster.pos.x - closestX, 2) + Math.pow(monster.pos.y - closestY, 2);
      
      if (distSq < monster.radius * monster.radius) {
        if (monster.radius >= wall.requiredSize) {
            wall.hp -= monster.damage;
            shakeRef.current = Math.max(shakeRef.current, 2); // Small shake on impact
            if (Math.random() > 0.8) createParticles(closestX, closestY, 20, COLORS.WALL_BROKEN, 3);
            if (wall.hp <= 0) {
              statsRef.current.wallsBroken++;
              createParticles(wall.x + wall.width/2, wall.y + wall.height/2, 0, COLORS.WALL_BASE, 15);
              shakeRef.current = 10; // Big shake on break
              return false;
            }
        } else {
            // Push back
            const dist = Math.sqrt(distSq);
            if (dist > 0) {
                const overlap = monster.radius - dist;
                const angle = Math.atan2(monster.pos.y - closestY, monster.pos.x - closestX);
                monster.pos.x += Math.cos(angle) * overlap;
                monster.pos.y += Math.sin(angle) * overlap;
            }
        }
      }
      return true;
    });

    // --- PROP LOGIC ---
    propsRef.current = propsRef.current.filter(prop => {
        const closestX = Math.max(prop.x, Math.min(monster.pos.x, prop.x + prop.width));
        const closestY = Math.max(prop.y, Math.min(monster.pos.y, prop.y + prop.height));
        const distSq = Math.pow(monster.pos.x - closestX, 2) + Math.pow(monster.pos.y - closestY, 2);

        if (distSq < monster.radius * monster.radius) {
             const color = prop.type === PropType.SERVER ? COLORS.SPARK : COLORS.CRYO_LIQUID;
             createParticles(prop.x + prop.width/2, prop.y + prop.height/2, 20, color, 12, 1.5);
             shakeRef.current = 5;
             return false;
        }
        return true;
    });

    // --- PROJECTILE LOGIC ---
    projectilesRef.current = projectilesRef.current.filter(proj => {
        proj.x += proj.vx;
        proj.y += proj.vy;
        
        // Wall Collision
        for (const wall of wallsRef.current) {
             if (proj.x > wall.x && proj.x < wall.x + wall.width && 
                 proj.y > wall.y && proj.y < wall.y + wall.height) {
                    createParticles(proj.x, proj.y, 20, COLORS.SPARK, 3);
                    return false;
             }
        }
        
        // Monster Collision
        const distToMonster = Math.hypot(proj.x - monster.pos.x, proj.y - monster.pos.y);
        if (distToMonster < monster.radius) {
            createParticles(proj.x, proj.y, 20, COLORS.MONSTER, 5);
            monster.radius = Math.max(10, monster.radius - proj.damage); 
            monster.visualHeight = Math.max(20, monster.visualHeight - (proj.damage * 0.2));
            hurtFlashRef.current = 5;
            shakeRef.current = 8;
            onStatsUpdate({ size: monster.radius, eaten: statsRef.current.humansEaten });
            
            if (monster.radius <= 12) {
                setGameState(GameState.GAME_OVER);
            }
            return false;
        }
        
        const distFromCam = Math.hypot(proj.x - (cameraRef.current.x + window.innerWidth/2), proj.y - (cameraRef.current.y + window.innerHeight/2));
        if (distFromCam > 1000) return false;

        return true;
    });


    // --- HUMAN LOGIC ---
    humansRef.current = humansRef.current.filter(human => {
      const dist = Math.hypot(monster.pos.x - human.pos.x, monster.pos.y - human.pos.y);
      
      // EAT Logic
      if (dist < monster.radius + human.radius + 15) {
        createParticles(human.pos.x, human.pos.y, 20, COLORS.BLOOD, 15);
        statsRef.current.humansEaten++;
        monster.radius += GROWTH_PER_HUMAN; 
        monster.visualHeight += 0.5;
        flashRef.current = 6; 
        shakeRef.current = 4;
        monster.exp++;
        if (monster.exp >= monster.nextLevelExp) {
          monster.level++;
          monster.nextLevelExp = Math.floor(monster.nextLevelExp * 1.5);
          // AI Narration disabled for performance/quota
          /*
          if (monster.level > statsRef.current.lastNarrationLevel) {
             statsRef.current.lastNarrationLevel = monster.level;
             generateNarration(monster.level, statsRef.current.humansEaten, statsRef.current.wallsBroken, false)
               .then(text => onLogUpdate(text));
          }
          */
        }
        onStatsUpdate({ size: monster.radius, eaten: statsRef.current.humansEaten });
        return false; 
      }

      // --- HUMAN STATE MACHINE ---
      
      // 1. Recover from Trip
      if (human.state === 'trip') {
          human.stateTimer--;
          if (human.stateTimer <= 0) {
              human.state = 'run';
              human.panic = true; // Still panicked
          }
          return true; // Skip movement/combat processing while tripped
      }

      // 2. Combat
      if (human.canShoot && human.state !== 'shiver') {
         human.attackCooldown--;
         if (dist < human.attackRange && human.attackCooldown <= 0) {
             // Turn to face monster
             const angle = Math.atan2(monster.pos.y - human.pos.y, monster.pos.x - human.pos.x);
             
             const spread = (Math.random() - 0.5) * 0.1;
             const vx = Math.cos(angle + spread) * PROJECTILE_SPEED;
             const vy = Math.sin(angle + spread) * PROJECTILE_SPEED;

             projectilesRef.current.push({
                 id: `proj-${Date.now()}-${Math.random()}`,
                 x: human.pos.x, y: human.pos.y,
                 vx, vy,
                 damage: human.type === 'elite' ? DAMAGE_ELITE : DAMAGE_SOLDIER,
                 color: human.type === 'elite' ? COLORS.PROJECTILE_ELITE : COLORS.PROJECTILE
             });
             
             human.attackCooldown = human.maxCooldown;
             // Don't return, allow them to move while shooting (kiting)
         }
      }

      // 3. Behavior Decision
      if (human.canShoot && dist < human.attackRange - 150) {
           // Kite backwards
           human.state = 'run';
           const angle = Math.atan2(human.pos.y - monster.pos.y, human.pos.x - monster.pos.x);
           human.velocity.x = Math.cos(angle) * (human.speed * 0.6);
           human.velocity.y = Math.sin(angle) * (human.speed * 0.6);
      } else if (dist < 500) {
        // Run away!
        human.state = 'run';
        human.panic = true;
        
        // CHANCE TO TRIP
        if (Math.random() < 0.003 && human.type === 'scientist') { // Scientists are clumsy
            human.state = 'trip';
            human.stateTimer = 40 + Math.random() * 40; // Trip duration
            human.velocity.x = 0;
            human.velocity.y = 0;
            return true;
        }

        const angle = Math.atan2(human.pos.y - monster.pos.y, human.pos.x - monster.pos.x);
        human.velocity.x = Math.cos(angle) * human.speed;
        human.velocity.y = Math.sin(angle) * human.speed;
      } else if (dist < 700) {
         // Nervous / Shiver
         if (Math.random() < 0.05) {
             human.state = 'shiver';
             human.velocity.x = 0;
             human.velocity.y = 0;
         } else if (human.state !== 'shiver') {
             human.state = 'cower'; // Hiding behavior
         }
      } else {
        // Idle wander
        human.state = 'idle';
        if (Math.random() < 0.02) {
            const angle = Math.random() * Math.PI * 2;
            human.velocity.x = Math.cos(angle) * 0.5;
            human.velocity.y = Math.sin(angle) * 0.5;
        } else if (Math.random() < 0.02) {
            human.velocity.x = 0;
            human.velocity.y = 0;
        }
      }
      
      const nextX = human.pos.x + human.velocity.x;
      const nextY = human.pos.y + human.velocity.y;
      
      human.pos.x = nextX;
      human.pos.y = nextY;

      // Wall Collision for Humans
      wallsRef.current.forEach(wall => {
         const cx = Math.max(wall.x, Math.min(human.pos.x, wall.x + wall.width));
         const cy = Math.max(wall.y, Math.min(human.pos.y, wall.y + wall.height));
         const dSq = Math.pow(human.pos.x - cx, 2) + Math.pow(human.pos.y - cy, 2);
         if (dSq < human.radius * human.radius) {
            const d = Math.sqrt(dSq);
            const overlap = human.radius - d;
            const a = Math.atan2(human.pos.y - cy, human.pos.x - cx);
            if (d > 0) {
                human.pos.x += Math.cos(a) * overlap;
                human.pos.y += Math.sin(a) * overlap;
            }
         }
      });
      return true;
    });

    particlesRef.current = particlesRef.current.filter(p => {
      p.x += p.vx; p.y += p.vy; p.z += p.vz; p.vz -= 0.8;
      if (p.z <= 0) { p.z = 0; p.vz *= -0.5; p.vx *= 0.8; p.vy *= 0.8; }
      p.life -= 0.02;
      return p.life > 0;
    });

    const worldRadius = (CENTER_ROOM_SIZE + (LAYER_COUNT * LAYER_THICKNESS * 2)) / 2;
    if (Math.hypot(monster.pos.x - WORLD_WIDTH/2, monster.pos.y - WORLD_HEIGHT/2) > worldRadius + 150) {
      setGameState(GameState.VICTORY);
      // generateNarration(monster.level, statsRef.current.humansEaten, statsRef.current.wallsBroken, true).then(onLogUpdate);
    }
  }, [gameState, setGameState, onLogUpdate, onStatsUpdate, inputRef]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Shake Offset
    const shakeX = (Math.random() - 0.5) * shakeRef.current;
    const shakeY = (Math.random() - 0.5) * shakeRef.current;

    const camX = Math.floor(cameraRef.current.x) - shakeX;
    const camY = Math.floor(cameraRef.current.y) - shakeY;

    // --- RENDER START ---
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = COLORS.BACKGROUND;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.translate(-camX, -camY);
    
    // Draw Blueprint Grid
    const TILE_SIZE = 120;
    const startX = Math.floor(camX / TILE_SIZE) * TILE_SIZE;
    const startY = Math.floor(camY / TILE_SIZE) * TILE_SIZE;
    const endX = startX + window.innerWidth + TILE_SIZE;
    const endY = startY + window.innerHeight + TILE_SIZE;

    ctx.strokeStyle = COLORS.GRID_LINE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = startX; x < endX; x += TILE_SIZE) {
        ctx.moveTo(x, startY); ctx.lineTo(x, endY);
    }
    for (let y = startY; y < endY; y += TILE_SIZE) {
        ctx.moveTo(startX, y); ctx.lineTo(endX, y);
    }
    ctx.stroke();

    // faint glowing crosshairs at intersections
    ctx.fillStyle = COLORS.GRID_GLOW;
    for (let x = startX; x < endX; x += TILE_SIZE) {
        for (let y = startY; y < endY; y += TILE_SIZE) {
            ctx.fillRect(x - 2, y - 10, 4, 20);
            ctx.fillRect(x - 10, y - 2, 20, 4);
        }
    }

    // --- RENDER LIST SORTING ---
    interface RenderItem { ySort: number; type: string; obj: any; }
    const list: RenderItem[] = [];
    
    wallsRef.current.forEach(w => list.push({ ySort: w.y + w.height, type: 'wall', obj: w }));
    humansRef.current.forEach(h => list.push({ ySort: h.pos.y, type: 'human', obj: h }));
    propsRef.current.forEach(p => list.push({ ySort: p.y + p.height, type: 'prop', obj: p }));
    list.push({ ySort: monsterRef.current.pos.y, type: 'monster', obj: monsterRef.current });
    particlesRef.current.forEach(p => list.push({ ySort: p.y, type: 'particle', obj: p }));
    
    list.sort((a, b) => a.ySort - b.ySort);

    list.forEach(item => {
        if (item.type === 'wall') drawWall(ctx, item.obj);
        else if (item.type === 'human') drawHuman(ctx, item.obj);
        else if (item.type === 'prop') drawProp(ctx, item.obj);
        else if (item.type === 'monster') drawMonster(ctx, item.obj);
        else if (item.type === 'particle') drawParticle(ctx, item.obj);
    });

    // Projectiles
    projectilesRef.current.forEach(p => {
        const screenY = p.y;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(p.x, screenY);
        ctx.lineTo(p.x - p.vx*2, screenY - p.vy*2); 
        ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(p.x, screenY, 3, 0, Math.PI*2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
    });

    // --- POST PROCESS: VIGNETTE ---
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const grad = ctx.createRadialGradient(
        canvas.width/2, canvas.height/2, canvas.height/2, 
        canvas.width/2, canvas.height/2, canvas.height
    );
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.8)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

  }, []);

  const drawShadow = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => {
    ctx.fillStyle = COLORS.SHADOW;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawProp = (ctx: CanvasRenderingContext2D, p: Prop) => {
      const screenY = p.y;
      const zHeight = p.visualHeight * VISUAL_Z_SCALE;
      
      // Shadow
      drawShadow(ctx, p.x + p.width/2, p.y + p.height, p.width * 0.6);

      if (p.type === PropType.SERVER) {
          ctx.fillStyle = COLORS.SERVER_BODY;
          ctx.fillRect(p.x, screenY + p.height - zHeight, p.width, zHeight);
          ctx.fillStyle = '#334155'; // Darker top
          ctx.fillRect(p.x, screenY - zHeight, p.width, p.height);
          
          // Server Lights
          if (Math.random() > 0.5) {
              ctx.fillStyle = COLORS.SERVER_LIGHT;
              ctx.shadowColor = COLORS.SERVER_LIGHT;
              ctx.shadowBlur = 5;
              ctx.fillRect(p.x + 5, screenY + p.height - zHeight + 10, 4, 4);
              ctx.fillRect(p.x + 5, screenY + p.height - zHeight + 20, 4, 4);
              ctx.shadowBlur = 0;
          }
      } else {
          ctx.fillStyle = COLORS.CRYO_LIQUID;
          ctx.fillRect(p.x, screenY + p.height - zHeight, p.width, zHeight);
          ctx.fillStyle = 'rgba(255,255,255,0.4)';
          ctx.beginPath();
          ctx.arc(p.x + p.width/2, screenY + p.height - zHeight/2 + (Math.sin(Date.now()*0.005)*10), 5, 0, Math.PI*2);
          ctx.fill();
      }
  };

  const drawWall = (ctx: CanvasRenderingContext2D, w: Wall) => {
    const screenY = w.y;
    const zHeight = w.visualHeight * VISUAL_Z_SCALE;
    
    // Shadow
    drawShadow(ctx, w.x + w.width/2, w.y + w.height, w.width * 0.5);

    // Front Face
    ctx.fillStyle = COLORS.WALL_BASE;
    ctx.fillRect(w.x, screenY + w.height - zHeight, w.width, zHeight);
    
    // Detail Lines (Rivets)
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(w.x + 10, screenY + w.height - zHeight, 2, zHeight);
    ctx.fillRect(w.x + w.width - 12, screenY + w.height - zHeight, 2, zHeight);

    // Top Face
    ctx.fillStyle = COLORS.WALL_TOP;
    ctx.fillRect(w.x, screenY - zHeight, w.width, w.height);
    
    // Clean metal look - REMOVED HAZARD STRIPES
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(w.x + 5, screenY - zHeight + 5, w.width - 10, w.height - 10);
    
    // Damage Overlay
    if (w.hp < w.maxHp) {
        ctx.fillStyle = `rgba(0,0,0,${0.7 * (1 - (w.hp/w.maxHp))})`;
        ctx.fillRect(w.x, screenY - zHeight, w.width, w.height);
        ctx.fillRect(w.x, screenY + w.height - zHeight, w.width, zHeight);
    }
    
    // Level Label
    if (monsterRef.current.radius < w.requiredSize) {
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 16px "Black Ops One"';
        ctx.textAlign = "center";
        ctx.fillText(`LVL ${Math.floor(w.requiredSize/10)}`, w.x + w.width/2, screenY - zHeight - 10);
        ctx.textAlign = "left";
    }
  };

  const drawHuman = (ctx: CanvasRenderingContext2D, h: Human) => {
    let screenY = h.pos.y;
    let screenX = h.pos.x;
    
    // Behavior Visual Modifiers
    let rotation = 0;
    let heightMod = 1;
    let xOffset = 0;
    
    if (h.state === 'shiver') {
        xOffset = (Math.random() - 0.5) * 3; // Shiver effect
    } else if (h.state === 'cower') {
        heightMod = 0.6; // Ducking down
    } else if (h.state === 'trip') {
        rotation = Math.PI / 2; // Lying down
        heightMod = 0.2;
    }
    
    screenX += xOffset;

    // Shadow
    drawShadow(ctx, screenX, screenY, h.radius * 1.5);

    const zHeight = h.visualHeight * VISUAL_Z_SCALE * heightMod;
    const bodyW = h.radius * 1.2;

    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.rotate(rotation);

    // --- DRAW LEGS (Updated for Visibility) ---
    if (h.state !== 'trip') {
        // Use brighter colors for boots so they are visible on dark floor
        ctx.fillStyle = '#94a3b8'; // Light Grey boots
        if (h.type === 'guard' || h.type === 'elite') ctx.fillStyle = '#475569'; // Darker grey for mil

        const legW = bodyW * 0.45; // Bigger feet
        const legH = 8;
        let leftLegOffset = 0;
        let rightLegOffset = 0;

        // Walking Animation (Exaggerated)
        if (h.state === 'run' || Math.abs(h.velocity.x) > 0.1 || Math.abs(h.velocity.y) > 0.1) {
            const walkTime = Date.now() * 0.02 + h.animOffset;
            leftLegOffset = Math.sin(walkTime) * 6;
            rightLegOffset = Math.sin(walkTime + Math.PI) * 6;
        }

        // Draw Left Foot
        ctx.beginPath();
        ctx.ellipse(-bodyW/3, -leftLegOffset, legW, legW * 1.2, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Draw Right Foot
        ctx.beginPath();
        ctx.ellipse(bodyW/3, -rightLegOffset, legW, legW * 1.2, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();
    }

    // --- DRAW BODY ---
    // Translate up to draw body standing on ground
    ctx.translate(0, -zHeight);
    
    ctx.fillStyle = h.color;
    // Body Block
    ctx.fillRect(-bodyW/2, 0, bodyW, zHeight);
    
    // --- DRAW HEAD ---
    ctx.fillStyle = h.type === 'elite' ? '#333' : COLORS.SCIENTIST_SKIN;
    ctx.beginPath();
    ctx.arc(0, -2, h.radius * 0.9, 0, Math.PI * 2);
    ctx.fill();
    
    // --- DRAW WEAPON (If armed) ---
    if (h.canShoot) {
        ctx.fillStyle = '#000';
        ctx.save();
        // Rotate gun towards monster relative to body
        // We are already translated to head position, need to untranslate rotation slightly for aim check
        // Or just aim simply
        const angleToMonster = Math.atan2(monsterRef.current.pos.y - h.pos.y, monsterRef.current.pos.x - h.pos.x);
        
        // If tripped, gun points random
        if (h.state === 'trip') {
             // drop gun visual
        } else {
             ctx.translate(0, zHeight * 0.4); // Hand level
             ctx.rotate(angleToMonster - rotation); // Counter body rotation if any, aim at target
             ctx.fillRect(0, -2, 24, 6); // Gun barrel
        }
        ctx.restore();
    }
    
    ctx.restore();
  };

  const drawMonster = (ctx: CanvasRenderingContext2D, m: Monster) => {
    const screenY = m.pos.y;
    
    drawShadow(ctx, m.pos.x, m.pos.y, m.radius * 1.5);

    const zHeight = m.visualHeight;
    const layers = 8;
    
    const isEating = flashRef.current > 0;
    const isHurt = hurtFlashRef.current > 0;

    if (isEating) flashRef.current--;
    if (isHurt) hurtFlashRef.current--;

    // Outer Glow
    ctx.shadowBlur = 20;
    ctx.shadowColor = COLORS.MONSTER_GLOW;

    for (let i = 0; i < layers; i++) {
        const t = i / (layers - 1);
        const r = m.radius * (1 - t * 0.4); 
        const yOffset = screenY - (zHeight * t);
        
        if (isHurt) {
            ctx.fillStyle = COLORS.MONSTER_HURT;
        } else if (isEating) {
            ctx.fillStyle = COLORS.MONSTER_RAGE;
        } else {
            ctx.fillStyle = COLORS.MONSTER;
        }
        
        // Slight organic wobble
        const wobble = Math.sin(Date.now() * 0.01 + i) * 2;
        ctx.beginPath();
        ctx.arc(m.pos.x + wobble, yOffset, r, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.shadowBlur = 0;
    
    // Core Eyes
    ctx.fillStyle = COLORS.MONSTER_CORE;
    const headY = screenY - zHeight;
    ctx.beginPath();
    ctx.arc(m.pos.x - m.radius*0.3, headY, m.radius*0.15, 0, Math.PI*2);
    ctx.arc(m.pos.x + m.radius*0.3, headY, m.radius*0.15, 0, Math.PI*2);
    ctx.fill();
  };

  const drawParticle = (ctx: CanvasRenderingContext2D, p: Particle) => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      const screenY = p.y - p.z;
      ctx.arc(p.x, screenY, p.size, 0, Math.PI * 2);
      ctx.fill();
  };

  const tick = useCallback(() => { update(); draw(); requestRef.current = requestAnimationFrame(tick); }, [update, draw]);

  // --- EFFECT SEPARATION ---
  
  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      initGame();
    }
  }, [gameState, initGame]);

  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      requestRef.current = requestAnimationFrame(tick);
    }
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [gameState, tick]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => keysPressed.current.add(e.key.toLowerCase());
    const up = (e: KeyboardEvent) => keysPressed.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    const rs = () => { if (canvasRef.current) { canvasRef.current.width = window.innerWidth; canvasRef.current.height = window.innerHeight; }};
    window.addEventListener('resize', rs); rs();
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('resize', rs); };
  }, []);

  return <canvas ref={canvasRef} className="block cursor-none" />;
};

export default GameCanvas;