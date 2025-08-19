// js/levels.js

import { items } from './items.js';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const ROOM1_WIDTH = 2600;
const ROOM2_HEIGHT = 1800;

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
            { x: 1300, y: 580, width: ROOM1_WIDTH - 1300, height: 20, color: '#7f8c8d' },
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
            { x: 2100, y: 580, width: 100, height: 20, color: '#000000', targetRoom: 2 },
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
        // NEW: Array for nests
        nests: [
            {
                id: 'nest_1',
                x: 900, y: 550, // Before the rocks
                width: 120,
                height: 30,
                hasEggs: false,
                color: '#8d6e63'
            }
        ],
        enemies: [
            { id: 'skink_1', type: "little_brown_skink", x: 1300, y: 550, respawnType: 'room' },
            { id: 'skink_2', type: "little_brown_skink", x: 1800, y: 550, respawnType: 'room' }
        ],
    },
    2: {
        id: 2,
        name: "Deep Drop",
        width: CANVAS_WIDTH,
        height: ROOM2_HEIGHT,
        backgroundColor: '#1a1a1a',
        playerStart: { x: CANVAS_WIDTH / 2, y: 0 },
        platforms: [
            { x: 300, y: 100, width: 40, height: 15, color: '#95a5a6' },
            { x: 340, y: 200, width: 40, height: 30, color: '#95a5a6' },
            { x: 380, y: 300, width: 40, height: 15, color: '#95a5a6' },
            { x: 420, y: 400, width: 40, height: 30, color: '#95a5a6' },
            { x: 460, y: 500, width: 40, height: 15, color: '#95a5a6' },
            { x: 0, y: ROOM2_HEIGHT - 20, width: CANVAS_WIDTH, height: 20, color: '#7f8c8d' },
        ],
        walls: [
            { x: 0, y: 0, width: 10, height: ROOM2_HEIGHT, color: '#7f8c8d', targetRoom: null },
            { x: CANVAS_WIDTH - 10, y: 0, width: 10, height: ROOM2_HEIGHT, color: '#7f8c8d', targetRoom: null },
        ],
        powerups: [],
        interactables: [],
        nests: [],
        enemies: [],
    },
};