// js/main.js

import Player from './player.js';
import InputHandler from './input.js';
import Room from './room.js';
import { levelData } from './levels.js';
import { InventoryUI, drawInteractionPrompt } from './ui.js';

// --- SETUP ---
const startScreen = document.getElementById('start-screen');
const startButton = document.getElementById('start-button');
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// --- GAME STATE & OBJECTS ---
let gameState = 'START'; // Can be 'START', 'PLAYING', 'INVENTORY'
let player = null; // Player is initialized later, after the first canvas resize
const input = new InputHandler();
let currentRoom = null;
const ui = new InventoryUI(null); // The player is linked to the UI after initialization

// --- CAMERA SETUP ---
const camera = {
    x: 0,
    y: 0,
    width: 0,  // The camera's viewport width, set on resize
    height: 0, // The camera's viewport height, set on resize
    
    // Function to update camera position to follow the player
    update: function(player, room) {
        // Center camera on the player
        this.x = player.x + player.width / 2 - this.width / 2;
        
        // Clamp camera to room boundaries to prevent showing empty space
        if (this.x < 0) {
            this.x = 0;
        }
        if (this.x > room.width - this.width) {
            this.x = room.width - this.width;
        }
    }
};

// --- NEW: RESIZE HANDLER ---
/**
 * This function is called whenever the browser window is resized.
 * It adjusts the canvas dimensions and updates any relevant game objects.
 */
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Update camera viewport size to match the new canvas size
    camera.width = canvas.width;
    camera.height = canvas.height;

    // Initialize the player and link it to the UI the first time this runs.
    if (!player) {
        player = new Player(canvas.width, canvas.height);
        ui.player = player; // Now the UI has a reference to the player
    } else {
        // If the player already exists, update its knowledge of the game's dimensions.
        player.gameWidth = canvas.width;
        player.gameHeight = canvas.height;
    }
    
    // If the game is paused in the inventory, redraw it immediately to prevent stretching.
    if (gameState === 'INVENTORY') {
        ui.draw(ctx, canvas.width, canvas.height);
    }
}

// --- ROOM MANAGEMENT ---
function loadRoom(roomNumber) {
    const roomData = levelData[roomNumber];
    if (!roomData) {
        console.error(`Room ${roomNumber} not found! Defaulting to Room 1.`);
        if (roomNumber !== 1) loadRoom(1); 
        return;
    }
    currentRoom = new Room(roomData);
    player.setPosition(currentRoom.playerStart.x, currentRoom.playerStart.y);
    console.log(`Entered Room: ${currentRoom.id} (${currentRoom.name})`);
}

// --- CORE GAME LOOP ---
function gameLoop() {
    // The game loop's behavior depends on the current gameState
    if (gameState === 'PLAYING' && currentRoom) {
        // --- IN-GAME LOGIC ---
        player.update(input, { width: currentRoom.width, height: currentRoom.height });
        const targetRoom = currentRoom.checkCollisions(player); 
        if (targetRoom !== null) {
            loadRoom(targetRoom);
        }
        camera.update(player, currentRoom);

        // --- DRAWING ---
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(-camera.x, -camera.y);
        
        currentRoom.draw(ctx);
        player.draw(ctx);
        drawInteractionPrompt(ctx, player, currentRoom);
        
        ctx.restore();

    } else if (gameState === 'INVENTORY') {
        // --- INVENTORY LOGIC ---
        // Pauses the game by only drawing the UI.
        ui.draw(ctx, canvas.width, canvas.height);
    }
    
    requestAnimationFrame(gameLoop);
}

// --- INTERACTION & EVENT HANDLING ---
function handleInteraction() {
    const interactionRange = 75;
    if (!currentRoom) return;

    for (let i = currentRoom.interactables.length - 1; i >= 0; i--) {
        const item = currentRoom.interactables[i];
        const dx = (player.x + player.width / 2) - (item.x + item.width / 2);
        const distance = Math.abs(dx);

        if (distance < interactionRange) {
            player.collectItem(item);
            currentRoom.interactables.splice(i, 1);
            return;
        }
    }
}

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'e') {
        if (gameState === 'PLAYING') gameState = 'INVENTORY';
        else if (gameState === 'INVENTORY') gameState = 'PLAYING';
    }
    if (key === 'f' && gameState === 'PLAYING') {
        handleInteraction();
    }
});

canvas.addEventListener('click', (e) => {
    if (gameState !== 'INVENTORY') return;
    const rect = canvas.getBoundingClientRect();
    ui.handleClick(e.clientX - rect.left, e.clientY - rect.top, canvas.width, canvas.height);
});

// --- START GAME LOGIC ---
function startGame() {
    startScreen.classList.add('hidden');
    canvas.style.display = 'block';
    
    // Perform the initial resize to set up canvas and player dimensions
    resizeCanvas();
    
    gameState = 'PLAYING';
    loadRoom(1);
    gameLoop();
}

// Set up the event listeners that start the game and handle resizing
window.addEventListener('resize', resizeCanvas);
startButton.addEventListener('click', startGame);