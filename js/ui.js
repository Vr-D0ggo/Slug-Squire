// js/ui.js

/**
 * Handles the drawing and interaction logic for the multi-screen, responsive inventory UI.
 */
export class InventoryUI {
    constructor(player) {
        this.player = player;
        this.currentPage = 0;
        this.maxPages = 2; // Page 0: Bug Parts, Page 1: Coming Soon
        // When an item is clicked, we show a small context menu near the cursor
        // popupItem holds { item, x, y, mode: 'menu' | 'stats' }
        this.popupItem = null;

        this.itemRects = [];
        this.slotRects = {};
        this.images = {}; // cache for item images
    }

    /**
     * The main drawing function for the UI. It decides what to show based on the current state.
     * @param {CanvasRenderingContext2D} ctx The canvas context to draw on.
     * @param {number} canvasWidth The current width of the canvas.
     * @param {number} canvasHeight The current height of the canvas.
     */
    draw(ctx, canvasWidth, canvasHeight) {
        // Draw the main inventory background frame, filling the screen
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.strokeStyle = '#aaa';
        ctx.strokeRect(10, 10, canvasWidth - 20, canvasHeight - 20);

        // If a popup/menu is active, draw it on top. Otherwise, draw the current inventory page.
        if (this.popupItem) {
            if (this.popupItem.mode === 'stats') {
                this.drawItemStatsPopup(ctx, canvasWidth, canvasHeight);
            } else {
                this.drawItemMenu(ctx);
            }
        } else {
            switch(this.currentPage) {
                case 0:
                    this.drawBugPartsPage(ctx, canvasWidth, canvasHeight);
                    break;
                case 1:
                    this.drawComingSoonPage(ctx, canvasWidth, canvasHeight);
                    break;
            }
            this.drawNavArrows(ctx, canvasWidth, canvasHeight);
        }
    }

    /**
     * Draws the content for the "Bug Parts" inventory page (Page 0).
     */
    drawBugPartsPage(ctx, canvasWidth, canvasHeight) {
        // Draw Title, centered horizontally
        ctx.fillStyle = '#e0e0e0';
        ctx.font = '30px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('Bug Parts', canvasWidth / 2, 50);

        // Draw inventory items as gray boxes
        const boxSize = 60;
        const startX = 50;
        const startY = 100;
        const maxPerColumn = Math.floor((canvasHeight - startY - 40) / (boxSize + 10));
        this.itemRects = [];

        this.player.inventory.forEach((item, index) => {
            const col = Math.floor(index / maxPerColumn);
            const row = index % maxPerColumn;
            const x = startX + col * (boxSize + 10);
            const y = startY + row * (boxSize + 10);
            ctx.fillStyle = '#555';
            ctx.fillRect(x, y, boxSize, boxSize);
            ctx.strokeStyle = '#888';
            ctx.strokeRect(x, y, boxSize, boxSize);
            this.drawItemIcon(ctx, item, x + boxSize / 2, y + boxSize / 2, boxSize * 0.6);
            this.itemRects.push({ item: item, rect: { x, y, width: boxSize, height: boxSize } });
        });

        if (this.player.inventory.length === 0) {
            ctx.fillStyle = '#888';
            ctx.font = '22px Georgia';
            ctx.textAlign = 'left';
            ctx.fillText('Nothing collected yet...', startX, startY);
        }
        
        // --- Player Preview (Dynamically Positioned in Top Right) ---
        const previewBoxWidth = 300;
        const previewBoxHeight = 300;
        const previewBoxX = canvasWidth - previewBoxWidth - 30;
        const previewBoxY = 40;
        this.previewRect = { x: previewBoxX, y: previewBoxY, width: previewBoxWidth, height: previewBoxHeight };
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(previewBoxX, previewBoxY, previewBoxWidth, previewBoxHeight);
        const previewX = previewBoxX + (previewBoxWidth - this.player.width) / 2;
        const previewY = previewBoxY + (previewBoxHeight - this.player.height) / 2;
        this.player.draw(ctx, previewX, previewY, true);

        const slotSize = 60;
        // Place equipment slots around the preview similar to Fly Knight
        this.slotRects = {
            arms: {
                type: 'arms',
                x: previewBoxX + 10,
                y: previewBoxY + (previewBoxHeight - slotSize) / 2,
                width: slotSize,
                height: slotSize
            },
            weapon: {
                type: 'weapon',
                x: previewBoxX + previewBoxWidth - slotSize - 10,
                y: previewBoxY + (previewBoxHeight - slotSize) / 2,
                width: slotSize,
                height: slotSize
            },
            legs: {
                type: 'legs',
                x: previewBoxX + (previewBoxWidth - slotSize) / 2,
                y: previewBoxY + previewBoxHeight - slotSize - 10,
                width: slotSize,
                height: slotSize
            },
            wings: {
                type: 'wings',
                x: previewBoxX + (previewBoxWidth - slotSize) / 2,
                y: previewBoxY + 10,
                width: slotSize,
                height: slotSize
            },
            armor: {
                type: 'armor',
                x: previewBoxX + 10,
                y: previewBoxY + previewBoxHeight - slotSize - 10,
                width: slotSize,
                height: slotSize
            },
            ability: {
                type: 'ability',
                x: previewBoxX + previewBoxWidth - slotSize - 10,
                y: previewBoxY + previewBoxHeight - slotSize - 10,
                width: slotSize,
                height: slotSize
            },
            trinket: {
                type: 'trinket',
                x: previewBoxX - slotSize - 10,
                y: previewBoxY + (previewBoxHeight - slotSize) / 2,
                width: slotSize,
                height: slotSize
            }
        };

        Object.values(this.slotRects).forEach(slot => {
            ctx.fillStyle = '#555';
            ctx.fillRect(slot.x, slot.y, slot.width, slot.height);
            ctx.strokeStyle = 'white';
            ctx.strokeRect(slot.x, slot.y, slot.width, slot.height);
            const equipped = this.player.stagedEquipment[slot.type] || this.player.equipped[slot.type];
            if (equipped) {
                this.drawItemIcon(ctx, equipped, slot.x + slot.width/2, slot.y + slot.height/2, slot.width*0.6);
            }
        });


        // --- Shed Exoskeleton Button ---
        this.shedButtonRect = { x: previewBoxX, y: previewBoxY + previewBoxHeight + 20, width: previewBoxWidth, height: 50 };
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // The button is only active if the player is at a nest
        if (this.player.atNest) {
            ctx.fillStyle = '#27ae60'; // Active Green
            ctx.strokeStyle = 'white';
        } else {
            ctx.fillStyle = '#555'; // Inactive Gray
            ctx.strokeStyle = '#888';
        }
        ctx.fillRect(this.shedButtonRect.x, this.shedButtonRect.y, this.shedButtonRect.width, this.shedButtonRect.height);
        ctx.strokeRect(this.shedButtonRect.x, this.shedButtonRect.y, this.shedButtonRect.width, this.shedButtonRect.height);
        
        ctx.fillStyle = this.player.atNest ? 'white' : '#999';
        ctx.font = '24px Georgia';
        ctx.fillText('Shed Exoskeleton', this.shedButtonRect.x + this.shedButtonRect.width / 2, this.shedButtonRect.y + 25);
    }
    
    /**
     * Draws the popup window for a selected item, centered on the screen.
     */
    drawItemStatsPopup(ctx, canvasWidth, canvasHeight) {
        const popupWidth = 300, popupHeight = 300;
        const popupX = (canvasWidth - popupWidth) / 2;
        const popupY = (canvasHeight - popupHeight) / 2;

        ctx.fillStyle = '#2c3e50';
        ctx.strokeStyle = '#95a5a6';
        ctx.lineWidth = 2;
        ctx.fillRect(popupX, popupY, popupWidth, popupHeight);
        ctx.strokeRect(popupX, popupY, popupWidth, popupHeight);

        ctx.fillStyle = 'white';
        ctx.font = '28px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText(this.popupItem.item.name, popupX + popupWidth / 2, popupY + 40);

        // Close button
        const closePopupRect = { x: popupX + popupWidth - 25, y: popupY + 5, width: 20, height: 20 };
        this.closePopupRect = closePopupRect;
        ctx.font = '20px Arial';
        ctx.fillText('X', closePopupRect.x + 10, closePopupRect.y + 15);

        this.drawItemIcon(ctx, this.popupItem.item, popupX + popupWidth / 2, popupY + 90, 60);
        ctx.font = '20px Georgia';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        let yPos = popupY + 150;
        if (this.player.isEvolved) {
            for (const [stat, value] of Object.entries(this.popupItem.item.stats)) {
                const displayValue = stat === 'Weight' ? `${value} mg` : value;
                ctx.fillText(`${stat}: ${displayValue}`, popupX + 30, yPos);
                yPos += 30;
            }
        } else {
            ctx.fillStyle = '#ffc107';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText("Please evolve to use this item.", popupX + popupWidth / 2, popupY + popupHeight / 2);
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
            ctx.fillStyle = 'white';
        }
        ctx.font = '16px Georgia';
        ctx.fillText(this.popupItem.item.description, popupX + 30, yPos);
        ctx.textBaseline = 'alphabetic'; // Reset baseline
    }

    drawItemMenu(ctx) {
        const menuWidth = 100;
        const buttonHeight = 30;
        const x = this.popupItem.x;
        const y = this.popupItem.y;

        this.menuButtonRects = {
            equip: { x, y, width: menuWidth, height: buttonHeight },
            stats: { x, y: y + buttonHeight, width: menuWidth, height: buttonHeight }
        };

        ctx.fillStyle = '#2c3e50';
        ctx.strokeStyle = '#95a5a6';
        ctx.lineWidth = 2;
        ctx.fillRect(x, y, menuWidth, buttonHeight * 2);
        ctx.strokeRect(x, y, menuWidth, buttonHeight * 2);

        ctx.fillStyle = 'white';
        ctx.font = '16px Georgia';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Equip', x + menuWidth / 2, y + buttonHeight / 2);
        ctx.fillText('See Stats', x + menuWidth / 2, y + buttonHeight * 1.5);
        ctx.textBaseline = 'alphabetic';
    }

    drawComingSoonPage(ctx, canvasWidth, canvasHeight) {
        ctx.fillStyle = '#e0e0e0';
        ctx.font = '40px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('Coming Soon', canvasWidth / 2, canvasHeight / 2);
    }

    drawNavArrows(ctx, canvasWidth, canvasHeight) {
        const rightArrowRect = { x: canvasWidth - 60, y: canvasHeight/2 - 15, width: 40, height: 30 };
        const leftArrowRect = { x: 20, y: canvasHeight/2 - 15, width: 40, height: 30 };
        ctx.fillStyle = '#fff';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (this.currentPage < this.maxPages - 1) {
            ctx.fillText('▶', rightArrowRect.x + 20, rightArrowRect.y + 15);
        }
        if (this.currentPage > 0) {
            ctx.fillText('◀', leftArrowRect.x + 20, leftArrowRect.y + 15);
        }
        ctx.textBaseline = 'alphabetic';
    }

    drawItemIcon(ctx, item, centerX, centerY, size) {
        if (item.image) {
            let img = this.images[item.image];
            if (!img) {
                img = new Image();
                img.src = item.image;
                this.images[item.image] = img;
            }
            if (img.complete) {
                ctx.drawImage(img, centerX - size/2, centerY - size/2, size, size);
            }
        } else if (item.type === 'ability') {
            ctx.fillStyle = item.color;
            ctx.beginPath();
            ctx.arc(centerX, centerY, size/2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = '#ccc';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = `${size}px Arial`;
            let text = 'I';
            if (item.type === 'arms') text = 'A';
            else if (item.type === 'legs') text = 'L';
            else if (item.type === 'weapon') text = 'S';
            else if (item.type === 'wings') text = 'W';
            else if (item.type === 'armor') text = 'C';
            else if (item.type === 'trinket') text = 'T';
            ctx.fillText(text, centerX, centerY);
        }
    }

    /**
     * Handles all click events, now requiring canvas dimensions to recalculate button positions.
     * @returns {boolean} - True if the shed button was clicked, otherwise false.
     */
    handleClick(x, y, canvasWidth, canvasHeight) {
        if (this.popupItem) {
            if (this.popupItem.mode === 'menu') {
                const { equip, stats } = this.menuButtonRects || {};
                if (equip && this.isClickInside(x, y, equip)) {
                    const item = this.popupItem.item;
                    if (item.type === 'weapon') {
                        const isEquipped = this.player.equipped.weapon === item;
                        if (isEquipped) { this.player.unequipWeapon(); }
                        else { this.player.equipWeapon(item); }
                    } else {
                        const isStaged = this.player.stagedEquipment[item.type] === item;
                        if (isStaged) { this.player.unstageItem(item.type); }
                        else { this.player.stageItem(item); }
                    }
                    this.popupItem = null;
                } else if (stats && this.isClickInside(x, y, stats)) {
                    this.popupItem.mode = 'stats';
                } else {
                    this.popupItem = null;
                }
            } else if (this.popupItem.mode === 'stats') {
                if (this.closePopupRect && this.isClickInside(x, y, this.closePopupRect)) {
                    this.popupItem = null;
                }
            }
        } else {
            for (const itemRect of this.itemRects) {
                if (this.isClickInside(x, y, itemRect.rect)) {
                    this.popupItem = { item: itemRect.item, x, y, mode: 'menu' };
                    return false;
                }
            }

            for (const slot of Object.values(this.slotRects)) {
                if (this.isClickInside(x, y, slot)) {
                    if (this.player.stagedEquipment[slot.type]) {
                        this.player.unstageItem(slot.type);
                    } else if (this.player.equipped[slot.type]) {
                        if (slot.type === 'weapon') this.player.unequipWeapon();
                        else this.player.removeEquipment(slot.type);
                    }
                    return false;
                }
            }

            if (this.player.atNest && this.shedButtonRect && this.isClickInside(x, y, this.shedButtonRect)) {
                this.player.shedExoskeleton();
                return true;
            }

            const rightArrowRect = { x: canvasWidth - 60, y: canvasHeight/2 - 15, width: 40, height: 30 };
            const leftArrowRect = { x: 20, y: canvasHeight/2 - 15, width: 40, height: 30 };
            if (this.currentPage < this.maxPages - 1 && this.isClickInside(x, y, rightArrowRect)) this.currentPage++;
            if (this.currentPage > 0 && this.isClickInside(x, y, leftArrowRect)) this.currentPage--;
        }
        return false;
    }

    /**
     * Helper function to check if a click (x,y) is within a given rectangle.
     */
    isClickInside(x, y, rect) {
        return x > rect.x && x < rect.x + rect.width && y > rect.y && y < rect.y + rect.height;
    }

}

/**
 * A separate function for drawing the in-game interaction prompt.
 */
export function drawInteractionPrompt(ctx, player, room, interactKey = 'F') {
    const interactionRange = 75;
    let promptDrawn = false; // Prevents multiple prompts from drawing over each other

    // Nests get priority for interaction prompts
    room.nests.forEach(nest => {
        if (promptDrawn) return;
        const dx = (player.x + player.width / 2) - (nest.x + nest.width / 2);
        const dy = (player.y + player.height / 2) - (nest.y + nest.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < nest.width) {
            ctx.fillStyle = 'white';
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`Press ${interactKey.toUpperCase()} to Rest`, player.x + player.width / 2, player.y - 20);
            promptDrawn = true;
        }
    });

    // If a nest prompt wasn't drawn, check for items
    room.interactables.forEach(item => {
        if (promptDrawn) return;
        const dx = (player.x + player.width / 2) - (item.x + item.width / 2);
        const dy = (player.y + player.height / 2) - (item.y + item.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < interactionRange) {
            ctx.fillStyle = 'white';
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`Press ${interactKey.toUpperCase()} to Interact`, player.x + player.width / 2, player.y - 20);
            promptDrawn = true;
        }
    });
}