// js/ui.js

/**
 * Handles the drawing and interaction logic for the multi-screen, responsive inventory UI.
 */
export class InventoryUI {
    constructor(player) {
        this.player = player;
        this.currentPage = 0;
        this.maxPages = 2; // Page 0: Bug Parts, Page 1: Coming Soon
        this.popupItem = null; // When an item is clicked, it's stored here to draw the popup
    }

    /**
     * The main drawing function for the UI. It now requires canvas dimensions to position elements.
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

        // If a popup is active, draw it on top. Otherwise, draw the current inventory page.
        if (this.popupItem) {
            this.drawItemPopup(ctx, canvasWidth, canvasHeight);
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
     * Draws the content for the "Bug Parts" inventory page.
     */
    drawBugPartsPage(ctx, canvasWidth, canvasHeight) {
        // Draw Title, centered horizontally
        ctx.fillStyle = '#e0e0e0';
        ctx.font = '30px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('Bug Parts', canvasWidth / 2, 50);

        // Draw the list of collected items
        ctx.font = '22px Georgia';
        ctx.textAlign = 'left';
        if (this.player.inventory.length === 0) {
            ctx.fillStyle = '#888';
            ctx.fillText('Nothing collected yet...', 50, 100);
        } else {
            this.player.inventory.forEach((item, index) => {
                const yPos = 100 + (index * 35);
                const isEquipped = (this.player.equipped.legs === item || this.player.equipped.arms === item);
                const prefix = isEquipped ? '[E] ' : '';
                ctx.fillStyle = isEquipped ? '#2ecc71' : '#e0e0e0';
                ctx.fillText(`${prefix}- ${item.name}`, 50, yPos);
            });
        }
        
        // --- Player Preview (Dynamically Positioned in Top Right) ---
        const previewBoxWidth = 220;
        const previewBoxHeight = 220;
        const previewBoxX = canvasWidth - previewBoxWidth - 30; // 30px from the right edge
        const previewBoxY = 40;

        ctx.strokeStyle = '#777';
        ctx.strokeRect(previewBoxX, previewBoxY, previewBoxWidth, previewBoxHeight);
        
        // Center the player preview inside the box
        const previewX = previewBoxX + (previewBoxWidth - this.player.width) / 2;
        const previewY = previewBoxY + (previewBoxHeight - this.player.height) / 2;

        const tempPlayerState = { x: previewX, y: previewY, width: this.player.width, height: this.player.height, isEvolved: this.player.isEvolved };
        this.player.draw.call(tempPlayerState, ctx);
    }
    
    /**
     * Draws the popup window for a selected item, centered on the screen.
     */
    drawItemPopup(ctx, canvasWidth, canvasHeight) {
        const popupWidth = 300, popupHeight = 300;
        const popupX = (canvasWidth - popupWidth) / 2;
        const popupY = (canvasHeight - popupHeight) / 2;

        // Popup background
        ctx.fillStyle = '#2c3e50';
        ctx.strokeStyle = '#95a5a6';
        ctx.lineWidth = 2;
        ctx.fillRect(popupX, popupY, popupWidth, popupHeight);
        ctx.strokeRect(popupX, popupY, popupWidth, popupHeight);

        // Title
        ctx.fillStyle = 'white';
        ctx.font = '28px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText(this.popupItem.name, popupX + popupWidth / 2, popupY + 40);

        // Close button [X]
        const closePopupRect = { x: popupX + popupWidth - 25, y: popupY + 5, width: 20, height: 20 };
        ctx.font = '20px Arial';
        ctx.fillText('X', closePopupRect.x + 10, closePopupRect.y + 15);
        
        // Conditional drawing based on player's evolved state
        if (this.player.isEvolved) {
            // If EVOLVED, show stats and equip button
            ctx.font = '20px Georgia';
            ctx.textAlign = 'left';
            let yPos = popupY + 90;
            for (const [stat, value] of Object.entries(this.popupItem.stats)) {
                ctx.fillText(`${stat}: ${value}`, popupX + 30, yPos);
                yPos += 30;
            }

            const equipButtonRect = { x: popupX + 50, y: popupY + popupHeight - 70, width: 200, height: 40 };
            const isEquipped = this.player.equipped[this.popupItem.type] === this.popupItem;
            const buttonText = isEquipped ? 'Unequip' : 'Equip';
            ctx.fillStyle = isEquipped ? '#c0392b' : '#27ae60';
            ctx.fillRect(equipButtonRect.x, equipButtonRect.y, equipButtonRect.width, equipButtonRect.height);
            
            ctx.fillStyle = 'white';
            ctx.font = '24px Georgia';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(buttonText, equipButtonRect.x + equipButtonRect.width / 2, equipButtonRect.y + 20);
        } else {
            // If NOT EVOLVED, show warning message
            ctx.fillStyle = '#ffc107'; // A gold/warning color
            ctx.font = '20px Georgia';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText("Please evolve to use this item.", popupX + popupWidth / 2, popupY + popupHeight / 2);
        }
        
        ctx.textBaseline = 'alphabetic'; // Reset baseline
    }

    /**
     * Draws the placeholder "Coming Soon" page, centered.
     */
    drawComingSoonPage(ctx, canvasWidth, canvasHeight) {
        ctx.fillStyle = '#e0e0e0';
        ctx.font = '40px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('Coming Soon', canvasWidth / 2, canvasHeight / 2);
    }

    /**
     * Draws the navigation arrows, vertically centered at the screen edges.
     */
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
        ctx.textBaseline = 'alphabetic'; // Reset
    }

    /**
     * Handles all click events, now requiring canvas dimensions to recalculate button positions.
     */
    handleClick(x, y, canvasWidth, canvasHeight) {
        // If a popup is active, we only check for clicks inside the popup
        if (this.popupItem) {
            // We must recalculate the button positions here because they depend on the canvas size
            const popupWidth = 300, popupHeight = 300;
            const popupX = (canvasWidth - popupWidth) / 2;
            const popupY = (canvasHeight - popupHeight) / 2;
            const closePopupRect = { x: popupX + popupWidth - 25, y: popupY + 5, width: 20, height: 20 };
            const equipButtonRect = { x: popupX + 50, y: popupY + popupHeight - 70, width: 200, height: 40 };

            if (this.isClickInside(x, y, closePopupRect)) {
                this.popupItem = null;
                return;
            }
            
            // Only check for equip button click if the player is evolved
            if (this.player.isEvolved && this.isClickInside(x, y, equipButtonRect)) {
                const isEquipped = this.player.equipped[this.popupItem.type] === this.popupItem;
                if (isEquipped) { this.player.unequipItem(this.popupItem.type); }
                else { this.player.equipItem(this.popupItem); }
                this.popupItem = null; // Close popup after action
                return;
            }
        } else {
            // Otherwise, check for clicks on the main inventory page elements

            // Recreate the list of item rectangles to check for clicks
            const itemRects = [];
            this.player.inventory.forEach((item, index) => {
                const yPos = 100 + (index * 35);
                itemRects.push({ item: item, rect: { x: 45, y: yPos - 20, width: 300, height: 30 } });
            });

            for (const itemRect of itemRects) {
                if (this.isClickInside(x, y, itemRect.rect)) {
                    this.popupItem = itemRect.item;
                    return; // Stop after finding the first clicked item
                }
            }

            // Recalculate arrow positions to check for clicks
            const rightArrowRect = { x: canvasWidth - 60, y: canvasHeight/2 - 15, width: 40, height: 30 };
            const leftArrowRect = { x: 20, y: canvasHeight/2 - 15, width: 40, height: 30 };

            if (this.currentPage < this.maxPages - 1 && this.isClickInside(x, y, rightArrowRect)) this.currentPage++;
            if (this.currentPage > 0 && this.isClickInside(x, y, leftArrowRect)) this.currentPage--;
        }
    }

    /**
     * Helper function to check if a click (x,y) is within a given rectangle.
     */
    isClickInside(x, y, rect) {
        return x > rect.x && x < rect.x + rect.width &&
               y > rect.y && y < rect.y + rect.height;
    }
}


/**
 * A separate function for drawing the in-game interaction prompt.
 * It's called from the main game loop, within the camera's translated context.
 */
export function drawInteractionPrompt(ctx, player, room) {
    const interactionRange = 75; // How close the player needs to be

    room.interactables.forEach(item => {
        const dx = (player.x + player.width / 2) - (item.x + item.width / 2);
        const dy = (player.y + player.height / 2) - (item.y + item.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        // If player is close enough, show the prompt above their head
        if (distance < interactionRange) {
            ctx.fillStyle = 'white';
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText("Press F to Interact", player.x + player.width / 2, player.y - 20);
        }
    });
}