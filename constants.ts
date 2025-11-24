
export const CANVAS_WIDTH = window.innerWidth;
export const CANVAS_HEIGHT = window.innerHeight;

// World Gen: Concentric Layers
export const LAYER_COUNT = 5;
export const CENTER_ROOM_SIZE = 600; 
export const LAYER_THICKNESS = 450;  
export const WALL_SEGMENT_SIZE = 100;

export const WORLD_WIDTH = CENTER_ROOM_SIZE + (LAYER_COUNT * LAYER_THICKNESS * 2);
export const WORLD_HEIGHT = CENTER_ROOM_SIZE + (LAYER_COUNT * LAYER_THICKNESS * 2);

// Physics Constants (Simplified)
export const TERMINAL_VELOCITY = -20;

// Visual 3D constants
export const VISUAL_Z_SCALE = 1.0; 
export const WALL_HEIGHT = 100;     
export const WALL_THICKNESS = 40;  

export const INITIAL_MONSTER_SIZE = 25; 
export const GROWTH_PER_HUMAN = 2.5;    
export const HUMAN_SIZE = 16;           
export const HUMAN_HEIGHT = 45;         
export const HUMAN_SPEED = 3.0;
export const MONSTER_SPEED = 7.5;

// Combat Constants
export const PROJECTILE_SPEED = 14; // Faster, more bullet-like
export const DAMAGE_SOLDIER = 1.5; 
export const DAMAGE_ELITE = 3.0;
export const RANGE_SOLDIER = 400;
export const RANGE_ELITE = 500;
export const COOLDOWN_SOLDIER = 90; 
export const COOLDOWN_ELITE = 45;   

export const COLORS = {
  // Action/Sci-Fi Theme
  BACKGROUND: '#020617', // Very dark slate/blue
  GRID_LINE: '#1e293b',
  GRID_GLOW: 'rgba(56, 189, 248, 0.05)', // Faint blue glow

  MONSTER: '#7c3aed', // Violet
  MONSTER_CORE: '#ffffff',
  MONSTER_GLOW: 'rgba(124, 58, 237, 0.6)',
  MONSTER_RAGE: '#ef4444', 
  MONSTER_HURT: '#ffffff',

  // Characters
  SCIENTIST_COAT: '#e2e8f0', // Bright white/grey
  SCIENTIST_SKIN: '#fca5a5',
  GUARD_UNIFORM: '#1e3a8a', // Deep Blue
  SOLDIER_UNIFORM: '#15803d', // Tactical Green
  ELITE_UNIFORM: '#0f172a',   // Spec Ops Black
  
  // Combat
  PROJECTILE: '#facc15', // Yellow Tracer
  PROJECTILE_ELITE: '#f97316', // Orange Tracer
  PROJECTILE_GLOW: 'rgba(250, 204, 21, 0.5)',

  // Environment
  WALL_BASE: '#334155',
  WALL_TOP: '#475569',
  WALL_STRIPE: '#facc15', // Hazard Yellow
  WALL_STRIPE_DARK: '#000000',
  WALL_GLASS: 'rgba(56, 189, 248, 0.4)',
  WALL_BROKEN: '#1e293b',
  
  // Props
  SERVER_BODY: '#0f172a',
  SERVER_LIGHT: '#22c55e',
  CRYO_LIQUID: '#06b6d4',
  
  BLOOD: '#dc2626',
  SPARK: '#fcd34d',
  
  SHADOW: 'rgba(0,0,0,0.5)'
};

export const KEYS = {
  UP: ['w', 'arrowup'],
  DOWN: ['s', 'arrowdown'],
  LEFT: ['a', 'arrowleft'],
  RIGHT: ['d', 'arrowright']
};