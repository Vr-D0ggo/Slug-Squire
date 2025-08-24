// js/levels.js

import { items } from './items.js';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const ROOM1_WIDTH = 2600;
const ROOM2_WIDTH = 1600; // Room is now twice as wide
const ROOM2_HEIGHT = 2400; // Room is now deeper

export const levelData = {
    1: {
        id: 1,
        name: "Long Drainage Pipe",
        width: ROOM1_WIDTH,
        height: CANVAS_HEIGHT,
        backgroundColor: '#34495e',
        playerStart: { x: 30, y: 540 },
        platforms: [
            { x: 0, y: 580, width: 1200, height: 20, color: '#7f8c8d' },
            // Fill the gap after the initial rock steps
            { x: 1200, y: 580, width: 100, height: 20, color: '#7f8c8d' },
            // Split the long floor segment to create a hole that leads to room 2
            { x: 1300, y: 580, width: 800, height: 20, color: '#7f8c8d' },
            { x: 2200, y: 580, width: ROOM1_WIDTH - 2200, height: 20, color: '#7f8c8d' },
            { x: 0, y: 0, width: ROOM1_WIDTH, height: 20, color: '#7f8c8d' },
            // Small stone to test jumping (scaled to 60% height)
            { x: 1080, y: 565, width: 40, height: 15, color: '#95a5a6' },
            // Taller stone one player width away (scaled to 60% height)
            { x: 1160, y: 550, width: 40, height: 30, color: '#95a5a6' },
            // Additional stones where the old wall used to be
            { x: 1960, y: 565, width: 40, height: 15, color: '#95a5a6' },
            { x: 2040, y: 550, width: 40, height: 30, color: '#95a5a6' },
        ],
        walls: [
            { x: ROOM1_WIDTH - 10, y: 0, width: 10, height: CANVAS_HEIGHT, color: '#27ae60', targetRoom: 1 },
            { x: 0, y: 0, width: 10, height: CANVAS_HEIGHT, color: '#7f8c8d', targetRoom: null },
            // Invisible trigger at the bottom of the hole to change rooms
            { x: 2100, y: 580, width: 100, height: 20, color: 'rgba(0,0,0,0)', targetRoom: 2 },
        ],
        powerups: [
            { id: 'power_goop_1', x: 1000, y: 570, width: 50, height: 10, color: '#2ecc71', type: 'evolution_power', respawnType: 'never' }
        ],
        interactables: [
            { ...items.arms.brokenArms, uid: 'broken_arms_1', respawnType: 'never', x: 600, y: 570 },
            { ...items.legs.brokenLegs, uid: 'broken_legs_1', respawnType: 'never', x: 850, y: 570 },
            { ...items.abilities.spittingSpiderAbdomen, uid: 'spider_sa_1', respawnType: 'never', x: 930, y: 560 },
            { ...items.wings.leafWings, uid: 'leaf_wings_1', respawnType: 'never', x: 970, y: 560 },
            { ...items.armor.antExoskeleton, uid: 'ant_exoskeleton_1', respawnType: 'never', x: 1010, y: 560 },
            // Sword near the first skink spawn
            { ...items.swords.usedQtip, uid: 'qtip_sword_1', respawnType: 'never', x: 1300, y: 560 }
        ],
        nests: [
            { id: 'nest_1', x: 900, y: 550, width: 120, height: 30, hasEggs: false, color: '#8d6e63' }
        ],
        enemies: [
            { id: 'skink_1', type: "little_brown_skink", x: 1300, y: 550, respawnType: 'room' },
            { id: 'skink_2', type: "little_brown_skink", x: 1800, y: 550, respawnType: 'room' }
        ],
    },
    2: {
        id: 2,
        name: "The Great Shaft",
        width: ROOM2_WIDTH,
        height: ROOM2_HEIGHT,
        backgroundColor: '#3e2723', // Dark, earthy cave background
        playerStart: { x: ROOM2_WIDTH / 2, y: 100 }, // Start near the top center
        platforms: [
            // --- Irregular Wall Construction (using platforms for collision) ---
            // Main Wall Color: '#6d4c41'
            // Left Wall (Top to Bottom)
            { x: 200, y: 0, width: 250, height: 200, color: '#6d4c41' },
            { x: 0, y: 250, width: 200, height: 300, color: '#6d4c41' },
            { x: 200, y: 200, width: 100, height: 400, color: '#6d4c41' },
            { x: 250, y: 600, width: 80, height: 500, color: '#6d4c41' },
            { x: 280, y: 1100, width: 100, height: 600, color: '#6d4c41' },
            { x: 200, y: 1700, width: 150, height: 400, color: '#6d4c41' }, // Bulge from drawing
            { x: 150, y: 2100, width: 100, height: 300, color: '#6d4c41' }, // Made bottom wall thinner for wider space

            // Right Wall (Top to Bottom)
            { x: ROOM2_WIDTH - 450, y: 0, width: 250, height: 250, color: '#6d4c41' },
            { x: ROOM2_WIDTH - 200, y: 250, width: 200, height: 400, color: '#6d4c41' },
            { x: ROOM2_WIDTH - 250, y: 650, width: 80, height: 450, color: '#6d4c41' },
            { x: ROOM2_WIDTH - 350, y: 1100, width: 100, height: 300, color: '#6d4c41' },
            { x: ROOM2_WIDTH - 350, y: 1450, width: 100, height: 550, color: '#6d4c41' },
            { x: ROOM2_WIDTH - 250, y: 2000, width: 70, height: 400, color: '#6d4c41' }, // Made bottom wall thinner for wider space

            // --- Ledges down the shaft ---
            // Ledge Color: '#a1887f'
            // Left Side Ledges
            { x: 300, y: 300, width: 120, height: 25, color: '#a1887f' },
            { x: 330, y: 550, width: 150, height: 25, color: '#a1887f' },
            { x: 330, y: 800, width: 100, height: 25, color: '#a1887f' },
            { x: 340, y: 850, width: 130, height: 25, color: '#a1887f' },
            { x: 380, y: 1200, width: 110, height: 25, color: '#a1887f' },
            { x: 390, y: 1260, width: 140, height: 25, color: '#a1887f' },
            { x: 350, y: 1750, width: 120, height: 25, color: '#a1887f' },
            { x: 350, y: 1850, width: 150, height: 25, color: '#a1887f' },
            { x: 360, y: 1950, width: 100, height: 25, color: '#a1887f' },

            // Right Side Ledges
            { x: ROOM2_WIDTH - 420, y: 450, width: 100, height: 20, color: '#a1887f' },
            { x: ROOM2_WIDTH - 400, y: 700, width: 120, height: 20, color: '#a1887f' },
            { x: ROOM2_WIDTH - 450, y: 1000, width: 150, height: 20, color: '#a1887f' },
            { x: ROOM2_WIDTH - 480, y: 1400, width: 130, height: 20, color: '#a1887f' },
            { x: ROOM2_WIDTH - 460, y: 1460, width: 110, height: 20, color: '#a1887f' },
            { x: ROOM2_WIDTH - 430, y: 1800, width: 100, height: 20, color: '#a1887f' },
            { x: ROOM2_WIDTH - 450, y: 1860, width: 120, height: 20, color: '#a1887f' },
            { x: ROOM2_WIDTH - 400, y: 2100, width: 100, height: 20, color: '#a1887f' },
            { x: ROOM2_WIDTH - 420, y: 2160, width: 120, height: 20, color: '#a1887f' },
            
            // --- NEW BOTTOM STRUCTURE ---
            // New, taller central "pipe" structure
            { x: 700, y: 1900, width: 50, height: 500, color: '#6d4c41' },
            { x: 850, y: 1900, width: 50, height: 500, color: '#6d4c41' },

            // New floating platforms at the bottom, matching the drawing
            { x: 400, y: 2250, width: 150, height: 20, color: '#a1887f' },
            { x: 450, y: 2320, width: 120, height: 20, color: '#a1887f' },
            { x: ROOM2_WIDTH - 550, y: 2250, width: 150, height: 20, color: '#a1887f' },
            { x: ROOM2_WIDTH - 570, y: 2320, width: 120, height: 20, color: '#a1887f' },

            // Absolute bottom floor
            { x: 0, y: ROOM2_HEIGHT - 10, width: ROOM2_WIDTH, height: 10, color: '#5d4037' },
        ],
        walls: [
            // Top and Side Exits
            { x: 450, y: 0, width: ROOM2_WIDTH - 900, height: 20, color: 'rgba(0,0,0,0)', targetRoom: 1 },
            { x: 0, y: 200, width: 20, height: 50, color: 'rgba(0,0,0,0)', targetRoom: null }, // Was 5
            { x: ROOM2_WIDTH - 20, y: 1250, width: 20, height: 200, color: 'rgba(0,0,0,0)', targetRoom: null }, // Was 6

            // --- NEW/MODIFIED BOTTOM EXITS ---
            // Bottom Far Left Exit (goes nowhere for now)
            { x: 0, y: ROOM2_HEIGHT - 100, width: 20, height: 80, color: 'rgba(0,0,0,0)', targetRoom: null }, // Was 7
            
            // Bottom Path Exits (large triggers on the floor, go nowhere for now)
            { x: 20, y: ROOM2_HEIGHT - 40, width: 680, height: 30, color: 'rgba(0,0,0,0)', targetRoom: null }, // Was 3
            { x: 900, y: ROOM2_HEIGHT - 40, width: 680, height: 30, color: 'rgba(0,0,0,0)', targetRoom: null }, // Was 4

            // NEW: Central Pipe Exit
            { x: 750, y: 1900, width: 100, height: 20, color: 'rgba(0,0,0,0)', targetRoom: 8 },
        ],
        powerups: [],
        interactables: [],
        nests: [],
        enemies: [],
    },
};