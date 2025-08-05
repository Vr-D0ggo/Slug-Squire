// js/main.js

import Player from './player.js';
import InputHandler from './input.js';
import Room from './room.js';
import { levelData } from './levels.js';
import { InventoryUI, drawInteractionPrompt } from './ui.js';

// --- SETUP ---
const startScreen = document.getElementById('start-screen');
const startButton = document.getElementById('start-button');
const rebindButton = document.getElementById('rebind-button');
const rebindScreen = document.getElementById('rebind-screen');
const leftKeyBtn = document.getElementById('left-key-btn');
const rightKeyBtn = document.getElementById('right-key-btn');
const jumpKeyBtn = document.getElementById('jump-key-btn');
const inventoryKeyBtn = document.getElementById('inventory-key-btn');
const interactKeyBtn = document.getElementById('interact-key-btn');
const saveBindsBtn = document.getElementById('save-binds');
const resetBindsBtn = document.getElementById('reset-binds');
const backButton = document.getElementById('back-button');
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

let gameState = 'START';
let player = null;
const input = new InputHandler();
let currentRoom = null;
const ui = new InventoryUI(null);

const camera = {
    x: 0, y: 0, width: 0, height: 0,
    update: function(player, room) {
        this.x = player.x + player.width / 2 - this.width / 2;
        if (this.x < 0) this.x = 0;
        if (this.x > room.width - this.width) this.x = room.width - this.width;
    }
};

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    camera.width = canvas.width;
    camera.height = canvas.height;
    if (!player) {
        player = new Player(canvas.width, canvas.height);
        ui.player = player;
    } else {
        player.gameWidth = canvas.width;
        player.gameHeight = canvas.height;
    }
    if (gameState === 'INVENTORY') {
        ui.draw(ctx, canvas.width, canvas.height);
    }
}

function loadRoom(roomNumber) {
    const roomData = levelData[roomNumber];
    if (!roomData) {
        if (roomNumber !== 1) loadRoom(1); 
        return;
    }
    currentRoom = new Room(roomData);
    player.setPosition(currentRoom.playerStart.x, currentRoom.playerStart.y);
}

function gameLoop() {
    if (gameState === 'PLAYING' && currentRoom) {
        // --- Proximity check for nests ---
        let isNearNest = false;
        currentRoom.nests.forEach(nest => {
            const dx = (player.x + player.width / 2) - (nest.x + nest.width / 2);
            const dy = (player.y + player.height / 2) - (nest.y + nest.height / 2);
            const distance = Math.sqrt(dx*dx + dy*dy);
            if (distance < nest.width) {
                isNearNest = true;
            }
        });
        player.atNest = isNearNest;

        // --- Game Logic Updates ---
        player.update(input, { width: currentRoom.width, height: currentRoom.height });
        currentRoom.updateEnemies(player);
        const targetRoom = currentRoom.checkCollisions(player);
        if (targetRoom !== null) {
            loadRoom(targetRoom);
        }
        camera.update(player, currentRoom);

        // --- Drawing ---
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(-camera.x, -camera.y);
        currentRoom.draw(ctx);
        player.draw(ctx);
        drawInteractionPrompt(ctx, player, currentRoom);
        ctx.restore();

        // --- UI Overlay ---
        const uiBarWidth = 200;
        const uiBarHeight = 20;
        const uiRatio = player.health / player.maxHealth;
        ctx.fillStyle = '#550000';
        ctx.fillRect(20, 20, uiBarWidth, uiBarHeight);
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(20, 20, uiBarWidth * uiRatio, uiBarHeight);
        ctx.strokeStyle = '#000000';
        ctx.strokeRect(20, 20, uiBarWidth, uiBarHeight);
    } else if (gameState === 'INVENTORY') {
        ui.draw(ctx, canvas.width, canvas.height);
    }
    
    requestAnimationFrame(gameLoop);
}

function handleInteraction() {
    if (!currentRoom) return;

    // --- Nest Interaction (Highest Priority) ---
    for (const nest of currentRoom.nests) {
        const dx = (player.x + player.width / 2) - (nest.x + nest.width / 2);
        const distance = Math.abs(dx);
        if (distance < nest.width / 2) {
            console.log("Interacting with nest.");
            player.health = player.maxHealth;
            nest.hasEggs = true;
            // Set staged equipment to currently equipped gear when opening menu at nest
            Object.assign(player.stagedEquipment, player.equipped);
            gameState = 'INVENTORY';
            return; // Stop after interacting with a nest
        }
    }

    // --- Item Interaction ---
    for (let i = currentRoom.interactables.length - 1; i >= 0; i--) {
        const item = currentRoom.interactables[i];
        const dx = (player.x + player.width / 2) - (item.x + item.width / 2);
        const distance = Math.abs(dx);
        if (distance < 75) {
            player.collectItem(item);
            currentRoom.interactables.splice(i, 1);
            return;
        }
    }
}

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key === input.bindings.inventory && gameState !== 'START') {
        if (gameState === 'PLAYING') {
            // When opening inventory away from a nest, clear staging
            if (!player.atNest) {
                player.stagedEquipment = { arms: null, legs: null };
            }
            gameState = 'INVENTORY';
        } else if (gameState === 'INVENTORY') {
            gameState = 'PLAYING';
        }
    }
    if (key === input.bindings.interact && gameState === 'PLAYING') {
        handleInteraction();
    }
});

let mouseDown = false;
canvas.addEventListener('mousedown', (e) => {
    if (gameState !== 'INVENTORY') return;
    const rect = canvas.getBoundingClientRect();
    ui.handleMouseDown(e.clientX - rect.left, e.clientY - rect.top);
    mouseDown = true;
});
canvas.addEventListener('mousemove', (e) => {
    if (gameState !== 'INVENTORY' || !mouseDown) return;
    const rect = canvas.getBoundingClientRect();
    ui.handleMouseMove(e.clientX - rect.left, e.clientY - rect.top);
});
canvas.addEventListener('mouseup', (e) => {
    if (gameState !== 'INVENTORY') return;
    const rect = canvas.getBoundingClientRect();
    const shedClicked = ui.handleMouseUp(e.clientX - rect.left, e.clientY - rect.top, canvas.width, canvas.height);
    mouseDown = false;
    if (shedClicked) {
        gameState = 'PLAYING';
    }
});

function startGame() {
    startScreen.classList.add('hidden');
    rebindScreen.classList.add('hidden');
    canvas.style.display = 'block';
    resizeCanvas();
    gameState = 'PLAYING';
    loadRoom(1);
    gameLoop();
}

window.addEventListener('resize', resizeCanvas);
startButton.addEventListener('click', startGame);

function updateBindDisplay() {
    leftKeyBtn.textContent = input.bindings.left.toUpperCase();
    rightKeyBtn.textContent = input.bindings.right.toUpperCase();
    jumpKeyBtn.textContent = input.bindings.jump.toUpperCase();
    inventoryKeyBtn.textContent = input.bindings.inventory.toUpperCase();
    interactKeyBtn.textContent = input.bindings.interact.toUpperCase();
}

rebindButton.addEventListener('click', () => {
    startScreen.classList.add('hidden');
    rebindScreen.classList.remove('hidden');
    updateBindDisplay();
});

backButton.addEventListener('click', () => {
    rebindScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
});

leftKeyBtn.addEventListener('click', () => {
    input.startRebind('left');
});
rightKeyBtn.addEventListener('click', () => {
    input.startRebind('right');
});
jumpKeyBtn.addEventListener('click', () => {
    input.startRebind('jump');
});
inventoryKeyBtn.addEventListener('click', () => {
    input.startRebind('inventory');
});
interactKeyBtn.addEventListener('click', () => {
    input.startRebind('interact');
});

input.onRebindComplete = updateBindDisplay;

saveBindsBtn.addEventListener('click', () => {
    input.saveBindings();
});

resetBindsBtn.addEventListener('click', () => {
    input.resetBindings();
});
