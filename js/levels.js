// js/levels.js

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const ROOM1_WIDTH = 2000;

export const levelData = {
    1: {
        id: 1,
        name: "Long Drainage Pipe",
        width: ROOM1_WIDTH, 
        height: CANVAS_HEIGHT,
        backgroundColor: '#34495e', 
        playerStart: { x: 30, y: 560 }, 
        platforms: [
            { x: 0, y: 580, width: ROOM1_WIDTH, height: 20, color: '#7f8c8d' },
            { x: 0, y: 0, width: ROOM1_WIDTH, height: 20, color: '#7f8c8d' },
        ],
        walls: [
            { x: ROOM1_WIDTH - 10, y: 0, width: 10, height: CANVAS_HEIGHT, color: '#27ae60', targetRoom: 1 },
            { x: 0, y: 0, width: 10, height: CANVAS_HEIGHT, color: '#7f8c8d', targetRoom: null },
        ],
        powerups: [
            { x: 1000, y: 570, width: 50, height: 10, color: '#2ecc71', type: 'evolution_power' }
        ],
        interactables: [
            {
                id: 'ant_arms',
                name: 'Broken Arms',
                type: 'arms',
                x: 600, y: 570, width: 30, height: 10, color: '#111',
                stats: { Attack: 0, Defense: 0, Weight: 5 }
            },
            {
                id: 'ant_legs',
                name: 'Broken Legs',
                type: 'legs',
                x: 850, y: 570, width: 30, height: 10, color: '#111',
                stats: { Jump: 1, Speed: 1, Weight: 7 }
            }
        ],
        // NEW: Array for nests
        nests: [
            {
                id: 'nest_1',
                x: 150, y: 550, // Near the start
                width: 120, // Approx 3x player base width
                height: 30, // Approx 1x player base height
                hasEggs: false,
                color: '#8d6e63' // A muddy brown
            }
        ]
    },
};