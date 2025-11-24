
export enum GameState {
  MENU,
  PLAYING,
  GAME_OVER,
  VICTORY
}

export enum PropType {
  SERVER,
  CRYO_TANK,
  DESK
}

export interface Vector2 {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  pos: Vector2;
  velocity: Vector2;
  radius: number;
  visualHeight: number;
  color: string;
}

export interface Monster extends Entity {
  hp: number;
  maxHp: number;
  level: number;
  exp: number;
  nextLevelExp: number;
  damage: number;
}

export type HumanState = 'idle' | 'run' | 'trip' | 'cower' | 'shiver';

export interface Human extends Entity {
  type: 'scientist' | 'guard' | 'soldier' | 'elite';
  state: HumanState;
  stateTimer: number; // Time remaining in current state (e.g., trip duration)
  panic: boolean;
  speed: number;
  direction: number; 
  animOffset: number; // For walking animation
  
  // Combat stats
  canShoot: boolean;
  attackRange: number;
  attackCooldown: number;
  maxCooldown: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  color: string;
}

export interface Prop {
  id: string;
  type: PropType;
  x: number;
  y: number;
  width: number;
  height: number; // depth
  visualHeight: number;
  hp: number;
  isDead: boolean;
}

export interface Wall {
  id: string;
  x: number; 
  y: number; 
  width: number; 
  height: number; 
  visualHeight: number; 
  hp: number;
  maxHp: number;
  isBreakable: boolean;
  requiredSize: number;
  layerIndex: number; 
}

export interface Particle {
  id: string;
  x: number;
  y: number; 
  z: number; 
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface Camera {
  x: number;
  y: number;
}
