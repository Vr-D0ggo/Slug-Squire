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
            { x: 1000, y: 570, width: 50, height: 10, color: '#2ecc71', type: 'evolution_power' } // Renamed type
        ],
        // UPDATED: Two separate interactable items with stats
        interactables: [
            {
                id: 'ant_arms',
                name: 'Ant Arms',
                type: 'arms', // To know which slot it fits in
                x: 600, y: 570, width: 30, height: 10, color: '#111',
                stats: { Attack: 0, Defense: 0, Weight: 5 }
            },
            {
                id: 'ant_legs',
                name: 'Ant Legs',
                type: 'legs', // To know which slot it fits in
                x: 850, y: 570, width: 30, height: 10, color: '#111',
                stats: { Jump: 1, Speed: 1, Weight: 7 }
            }
        ]
    },
};