// js/main.js

import Player from './player.js';
import InputHandler from './input.js';
import Room from './room.js';
import { levelData } from './levels.js';
import { InventoryUI, drawInteractionPrompt } from './ui.js';
import { getItemById } from './items.js';

// --- SETUP ---
const startScreen = document.getElementById('start-screen');
const startButton = document.getElementById('start-button');
const rebindButton = document.getElementById('rebind-button');
const rebindScreen = document.getElementById('rebind-screen');
const saveScreen = document.getElementById('save-screen');
const slotButtons = Array.from(document.querySelectorAll('.save-slot'));
const deleteButtons = Array.from(document.querySelectorAll('.delete-slot'));
const saveBackButton = document.getElementById('save-back-button');
const deleteConfirm = document.getElementById('delete-confirm');
const confirmDeleteBtn = document.getElementById('confirm-delete');
const cancelDeleteBtn = document.getElementById('cancel-delete');
const leftKeyBtn = document.getElementById('left-key-btn');
const rightKeyBtn = document.getElementById('right-key-btn');
const jumpKeyBtn = document.getElementById('jump-key-btn');
const inventoryKeyBtn = document.getElementById('inventory-key-btn');
const interactKeyBtn = document.getElementById('interact-key-btn');
const attackKeyBtn = document.getElementById('attack-key-btn');
const lookupKeyBtn = document.getElementById('lookup-key-btn');
const lookdownKeyBtn = document.getElementById('lookdown-key-btn');
const saveBindsBtn = document.getElementById('save-binds');
const resetBindsBtn = document.getElementById('reset-binds');
const backButton = document.getElementById('back-button');
const canvas = document.getElementById('game-canvas');
canvas.setAttribute('tabindex', '0');
const ctx = canvas.getContext('2d');

// Pause and settings menus
const pauseMenu = document.getElementById('pause-menu');
const resumeButton = document.getElementById('resume-button');
const settingsButton = document.getElementById('settings-button');
const exitButton = document.getElementById('exit-button');
const settingsMenu = document.getElementById('settings-menu');
const tabKeybinds = document.getElementById('tab-keybinds');
const tabVisuals = document.getElementById('tab-visuals');
const tabSfx = document.getElementById('tab-sfx');
const settingsKeybinds = document.getElementById('settings-keybinds');
const settingsVisuals = document.getElementById('settings-visuals');
const settingsSfx = document.getElementById('settings-sfx');
const brightnessSlider = document.getElementById('brightness-slider');

let currentSlot = null;
let deleteTarget = null;

let gameState = 'START';
let previousState = 'START';
let player = null;
const input = new InputHandler();
let currentRoom = null;
const ui = new InventoryUI(null);

// Track which objects have been removed based on respawn rules
let respawnData = { bench: {}, permanent: {} };

let deathSequence = null; // { phase: 'fall'|'fadeout'|'fadein', timer: number, alpha: number }
let animationFrameId = null;

// Day/Night cycle (15 min each)
const DAY_DURATION = 15 * 60 * 1000;
const NIGHT_DURATION = 15 * 60 * 1000;
let cycleStart = Date.now();
let isDay = true;

const camera = {
    x: 0, y: 0, width: 0, height: 0,
    update: function(player, room) {
        this.x = player.x + player.width / 2 - this.width / 2;
        this.y = player.y + player.height / 2 - this.height / 2;
        if (this.x < 0) this.x = 0;
        if (this.y < 0) this.y = 0;
        if (this.x > room.width - this.width) this.x = room.width - this.width;
        if (this.y > room.height - this.height) this.y = room.height - this.height;
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
    const perma = respawnData.permanent[roomNumber] || [];
    const benchRemoved = respawnData.bench[roomNumber] || [];
    currentRoom.interactables = currentRoom.interactables.filter(obj => !perma.includes(obj.uid) && !benchRemoved.includes(obj.uid));
    currentRoom.powerups = currentRoom.powerups.filter(obj => !perma.includes(obj.id) && !benchRemoved.includes(obj.id));
    currentRoom.enemies = currentRoom.enemies.filter(obj => !perma.includes(obj.id) && !benchRemoved.includes(obj.id));
    player.setPosition(currentRoom.playerStart.x, currentRoom.playerStart.y);
}

function loadSave(slot) {
    const slots = JSON.parse(localStorage.getItem('saveSlots') || '[]');
    return slots[slot] || {
        inventory: [],
        equipped: { arms: null, legs: null, weapon: null, wings: null, armor: null, ability: null, trinket: null },
        isEvolved: false,
        stats: { items: 0, bosses: 0, money: 0 },
        lastNest: null,
        respawnData: { bench: {}, permanent: {} }
    };
}

function saveGame() {
    if (currentSlot === null || !player) return;
    const slots = JSON.parse(localStorage.getItem('saveSlots') || '[]');
    slots[currentSlot] = {
        inventory: player.inventory.map(i => i.id),
        equipped: {
            arms: player.equipped.arms ? player.equipped.arms.id : null,
            legs: player.equipped.legs ? player.equipped.legs.id : null,
            weapon: player.equipped.weapon ? player.equipped.weapon.id : null,
            wings: player.equipped.wings ? player.equipped.wings.id : null,
            armor: player.equipped.armor ? player.equipped.armor.id : null,
            ability: player.equipped.ability ? player.equipped.ability.id : null,
            trinket: player.equipped.trinket ? player.equipped.trinket.id : null
        },
        isEvolved: player.isEvolved,
        stats: {
            items: player.itemsCollected,
            bosses: player.bossesDefeated,
            money: player.money
        },
        lastNest: player.lastNest,
        respawnData
    };
    localStorage.setItem('saveSlots', JSON.stringify(slots));
}

function updateSlotButtons() {
    const slots = JSON.parse(localStorage.getItem('saveSlots') || '[]');
    slotButtons.forEach((btn, i) => {
        const data = slots[i];
        if (data) {
            const stats = data.stats || {};
            btn.textContent = 'Slot ' + (i + 1) + ' - Items: ' + (stats.items || 0) +
                ' Bosses: ' + (stats.bosses || 0) + ' Meat: ' + (stats.money || 0);
        } else {
            btn.textContent = 'Slot ' + (i + 1) + ' - Empty';
        }
    });
}

function showSettingsTab(tab) {
    [settingsKeybinds, settingsVisuals, settingsSfx].forEach(s => s.classList.add('hidden'));
    [tabKeybinds, tabVisuals, tabSfx].forEach(b => b.classList.remove('active'));
    switch (tab) {
        case 'visuals':
            settingsVisuals.classList.remove('hidden');
            tabVisuals.classList.add('active');
            break;
        case 'sfx':
            settingsSfx.classList.remove('hidden');
            tabSfx.classList.add('active');
            break;
        default:
            settingsKeybinds.classList.remove('hidden');
            tabKeybinds.classList.add('active');
    }
}

function openSettings() {
    previousState = gameState;
    settingsMenu.classList.remove('hidden');
    pauseMenu.classList.add('hidden');
    startScreen.classList.add('hidden');
    rebindScreen.classList.remove('hidden');
    showSettingsTab('keybinds');
    gameState = 'SETTINGS';
}

function gameLoop() {
    if (gameState === 'PLAYING' && currentRoom) {
        const now = Date.now();
        const elapsed = now - cycleStart;
        if (isDay && elapsed > DAY_DURATION) {
            isDay = false;
            cycleStart = now;
        } else if (!isDay && elapsed > NIGHT_DURATION) {
            isDay = true;
            cycleStart = now;
        }
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
        player.updateProjectiles(currentRoom.enemies);
        const targetRoom = currentRoom.checkCollisions(player, respawnData, saveGame);

        if (player.health <= 0 && !deathSequence) {
            player.die();
            deathSequence = { phase: 'fall', timer: 0, alpha: 0 };
            gameState = 'DYING';
        } else if (targetRoom !== null) {
            loadRoom(targetRoom);
        }
        camera.update(player, currentRoom);

        // --- Drawing ---
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(-camera.x, -camera.y);
        currentRoom.draw(ctx);
        player.draw(ctx);
        player.drawProjectiles(ctx);
        drawInteractionPrompt(ctx, player, currentRoom, input.bindings.interact);
        ctx.restore();

        if (!isDay) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

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
        // Draw meat (money) below health bar
        const meatSize = 16;
        const meatX = 20;
        const meatY = 20 + uiBarHeight + 10;
        const cx = meatX + meatSize / 2;
        const cy = meatY + meatSize / 2;
        ctx.fillStyle = '#e07a7a';
        ctx.beginPath();
        ctx.arc(cx, cy, meatSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, cy, meatSize * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - meatSize * 0.15, cy);
        ctx.lineTo(cx + meatSize * 0.15, cy);
        ctx.moveTo(cx, cy - meatSize * 0.15);
        ctx.lineTo(cx, cy + meatSize * 0.15);
        ctx.stroke();
        ctx.fillStyle = '#000';
        ctx.font = '16px sans-serif';
        ctx.textBaseline = 'middle';
        ctx.fillText(player.money, meatX + meatSize + 5, meatY + meatSize / 2);
    } else if (gameState === 'INVENTORY') {
        ui.draw(ctx, canvas.width, canvas.height);
    } else if (gameState === 'DYING') {
        if (deathSequence.phase === 'fall') {
            player.update(input, { width: currentRoom.width, height: currentRoom.height });
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.translate(-camera.x, -camera.y);
            currentRoom.draw(ctx);
            player.draw(ctx);
            player.drawProjectiles(ctx);
            ctx.restore();
            if (player.deathTime > 30) {
                deathSequence.phase = 'fadeout';
            }
        } else if (deathSequence.phase === 'fadeout') {
            deathSequence.alpha += 0.02;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.translate(-camera.x, -camera.y);
            currentRoom.draw(ctx);
            player.draw(ctx);
            player.drawProjectiles(ctx);
            ctx.restore();
            ctx.fillStyle = `rgba(0,0,0,${deathSequence.alpha})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            if (deathSequence.alpha >= 1) {
                if (player.lastNest) {
                    loadRoom(player.lastNest.roomId);
                    const groundY = player.lastNest.groundY;
                    const spawnY = groundY - player.height - player.getLegHeight();
                    player.setPosition(player.lastNest.x, spawnY);
                } else {
                    loadRoom(1);
                }
                currentRoom.checkCollisions(player, respawnData, saveGame);
                player.health = player.maxHealth;
                player.isDead = false;
                deathSequence.phase = 'fadein';
            }
        } else if (deathSequence.phase === 'fadein') {
            deathSequence.alpha -= 0.02;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.translate(-camera.x, -camera.y);
            currentRoom.draw(ctx);
            player.draw(ctx);
            player.drawProjectiles(ctx);
            ctx.restore();
            ctx.fillStyle = `rgba(0,0,0,${Math.max(deathSequence.alpha,0)})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            if (deathSequence.alpha <= 0) {
                deathSequence = null;
                gameState = 'PLAYING';
            }
        }
    }
    
    animationFrameId = requestAnimationFrame(gameLoop);
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
            const groundY = player.y + player.height + player.getLegHeight();
            player.lastNest = {
                roomId: currentRoom.id,
                x: player.x,
                groundY
            };
            // Reset bench-respawned objects and reload room
            respawnData.bench = {};
            loadRoom(currentRoom.id);
            player.setPosition(player.lastNest.x, groundY - player.height - player.getLegHeight());
            currentRoom.checkCollisions(player, respawnData, saveGame);
            saveGame();
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
            if (item.respawnType === 'never') {
                if (!respawnData.permanent[currentRoom.id]) respawnData.permanent[currentRoom.id] = [];
                respawnData.permanent[currentRoom.id].push(item.uid);
            } else if (item.respawnType === 'bench') {
                if (!respawnData.bench[currentRoom.id]) respawnData.bench[currentRoom.id] = [];
                respawnData.bench[currentRoom.id].push(item.uid);
            }
            saveGame();
            return;
        }
    }
}

window.addEventListener('keydown', (e) => {
    const key = e.key;
    if (key === 'Escape') {
        e.preventDefault();
        if (gameState === 'PLAYING' || gameState === 'INVENTORY') {
            pauseMenu.classList.remove('hidden');
            gameState = 'PAUSED';
        } else if (gameState === 'PAUSED') {
            pauseMenu.classList.add('hidden');
            gameState = 'PLAYING';
        } else if (gameState === 'SETTINGS') {
            settingsMenu.classList.add('hidden');
            if (previousState === 'PAUSED') {
                pauseMenu.classList.remove('hidden');
            } else {
                startScreen.classList.remove('hidden');
            }
            gameState = previousState;
        }
        canvas.focus();
    }
    if (key.toLowerCase() === input.bindings.attack && gameState === 'PLAYING') {
        const removed = player.attack(currentRoom.enemies, respawnData, currentRoom);
        if (removed) saveGame();
    }
    if (key === input.bindings.ability && gameState === 'PLAYING') {
        player.useAbility();
    }
});

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key === input.bindings.inventory && gameState !== 'START') {
        if (gameState === 'PLAYING') {
            // When opening inventory away from a nest, clear staging
            if (!player.atNest) {
                player.stagedEquipment = { arms: null, legs: null, weapon: null, wings: null, armor: null, ability: null, trinket: null };
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

canvas.addEventListener('mousedown', (e) => {
    if (gameState !== 'INVENTORY') return;
    const rect = canvas.getBoundingClientRect();
    const shedClicked = ui.handleClick(e.clientX - rect.left, e.clientY - rect.top, canvas.width, canvas.height);
    if (shedClicked) {
        gameState = 'PLAYING';
        saveGame();
    }
});

// Mouse tracking removed: aiming no longer uses cursor

function startGame(slotIndex) {
    currentSlot = slotIndex;
    saveScreen.classList.add('hidden');
    startScreen.classList.add('hidden');
    pauseMenu.classList.add('hidden');
    settingsMenu.classList.add('hidden');
    canvas.style.display = 'block';
    resizeCanvas();
    canvas.focus();
    const data = loadSave(slotIndex);
    respawnData = data.respawnData || { bench: {}, permanent: {} };
    player.itemsCollected = data.stats.items || 0;
    player.bossesDefeated = data.stats.bosses || 0;
    player.money = data.stats.money || 0;
    player.meat = player.money;
    player.inventory = (data.inventory || []).map(id => getItemById(id)).filter(Boolean);
    player.equipped = {
        arms: data.equipped.arms ? getItemById(data.equipped.arms) : null,
        legs: data.equipped.legs ? getItemById(data.equipped.legs) : null,
        weapon: data.equipped.weapon ? getItemById(data.equipped.weapon) : null,
        wings: data.equipped.wings ? getItemById(data.equipped.wings) : null,
        armor: data.equipped.armor ? getItemById(data.equipped.armor) : null,
        ability: data.equipped.ability ? getItemById(data.equipped.ability) : null,
        trinket: data.equipped.trinket ? getItemById(data.equipped.trinket) : null
    };
    if (data.isEvolved || player.equipped.arms || player.equipped.legs || player.equipped.weapon || player.equipped.wings || player.equipped.armor) {
        player.evolve();
    }
    gameState = 'PLAYING';
    const nest = data.lastNest;
    if (nest) {
        loadRoom(nest.roomId);
        const spawnY = nest.groundY - player.height - player.getLegHeight();
        player.setPosition(nest.x, spawnY);
        player.lastNest = nest;
        currentRoom.checkCollisions(player, respawnData, saveGame);
    } else {
        loadRoom(1);
        player.lastNest = { roomId: currentRoom.id, x: player.x, groundY: player.y + player.height + player.getLegHeight() };
        currentRoom.checkCollisions(player, respawnData, saveGame);
    }
}

window.addEventListener('resize', resizeCanvas);

startButton.addEventListener('click', () => {
    startScreen.classList.add('hidden');
    updateSlotButtons();
    saveScreen.classList.remove('hidden');
});
saveBackButton.addEventListener('click', () => {
    saveScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
});
slotButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const slot = parseInt(btn.dataset.slot);
        startGame(slot);
    });
});
deleteButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        deleteTarget = parseInt(btn.dataset.slot);
        deleteConfirm.classList.remove('hidden');
    });
});
confirmDeleteBtn.addEventListener('click', () => {
    if (deleteTarget !== null) {
        const slots = JSON.parse(localStorage.getItem('saveSlots') || '[]');
        slots[deleteTarget] = null;
        localStorage.setItem('saveSlots', JSON.stringify(slots));
        updateSlotButtons();
    }
    deleteConfirm.classList.add('hidden');
    deleteTarget = null;
});
cancelDeleteBtn.addEventListener('click', () => {
    deleteConfirm.classList.add('hidden');
    deleteTarget = null;
});

function updateBindDisplay() {
    leftKeyBtn.textContent = input.bindings.left.toUpperCase();
    rightKeyBtn.textContent = input.bindings.right.toUpperCase();
    jumpKeyBtn.textContent = input.bindings.jump.toUpperCase();
    inventoryKeyBtn.textContent = input.bindings.inventory.toUpperCase();
    interactKeyBtn.textContent = input.bindings.interact.toUpperCase();
    attackKeyBtn.textContent = input.bindings.attack.toUpperCase();
    lookupKeyBtn.textContent = input.bindings.lookUp.toUpperCase();
    lookdownKeyBtn.textContent = input.bindings.lookDown.toUpperCase();
}

rebindButton.addEventListener('click', () => {
    updateBindDisplay();
    openSettings();
});

backButton.addEventListener('click', () => {
    settingsMenu.classList.add('hidden');
    if (previousState === 'PAUSED') {
        pauseMenu.classList.remove('hidden');
        gameState = 'PAUSED';
    } else {
        startScreen.classList.remove('hidden');
        gameState = 'START';
    }
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
attackKeyBtn.addEventListener('click', () => {
    input.startRebind('attack');
});
lookupKeyBtn.addEventListener('click', () => {
    input.startRebind('lookUp');
});
lookdownKeyBtn.addEventListener('click', () => {
    input.startRebind('lookDown');
});

input.onRebindComplete = updateBindDisplay;

saveBindsBtn.addEventListener('click', () => {
    input.saveBindings();
});

resetBindsBtn.addEventListener('click', () => {
    input.resetBindings();
});

resumeButton.addEventListener('click', () => {
    pauseMenu.classList.add('hidden');
    gameState = 'PLAYING';
    canvas.focus();
});

settingsButton.addEventListener('click', () => {
    updateBindDisplay();
    openSettings();
});
exitButton.addEventListener('click', () => {
    saveGame();
    pauseMenu.classList.add('hidden');
    canvas.style.display = 'none';
    startScreen.classList.remove('hidden');
    gameState = 'START';
});

tabKeybinds.addEventListener('click', () => { updateBindDisplay(); showSettingsTab('keybinds'); });
tabVisuals.addEventListener('click', () => showSettingsTab('visuals'));
tabSfx.addEventListener('click', () => showSettingsTab('sfx'));

brightnessSlider.addEventListener('input', () => {
    const val = brightnessSlider.value / 100;
    canvas.style.filter = `brightness(${val})`;
});

window.addEventListener('beforeunload', saveGame);

// start the animation loop once
gameLoop();
