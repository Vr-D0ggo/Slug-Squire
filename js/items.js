export const items = {
    arms: {
        brokenArms: {
            id: 'ant_arms',
            name: 'Broken Arms',
            type: 'arms',
            width: 30,
            height: 10,
            color: '#111',
            stats: { AttackPower: 1, AttackSpeed: 1, Weight: 20 },
            description: 'Barely hanging on, but better than nothing.'
        }
    },
    legs: {
        brokenLegs: {
            id: 'ant_legs',
            name: 'Broken Legs',
            type: 'legs',
            width: 30,
            height: 10,
            color: '#111',
            stats: { Speed: 1, JumpPower: 1, Weight: 20 },
            description: 'They wobble, but they walk.'
        }
    },
    wings: {
        // future wing items can go here
    },
    abilities: {
        spittingSpiderAbdomen: {
            id: 'spitting_spider_abdomen',
            name: 'Spitting Spider Abdomen',
            type: 'ability',
            width: 20,
            height: 20,
            color: '#000000',
            stats: { Weight: 30 },
            description: 'Fires webbing that slows foes.'
        }
    },
    swords: {
        usedQtip: {
            id: 'used_q_tip',
            name: 'Used Q-tip',
            type: 'weapon',
            width: 60,
            height: 10,
            color: '#ffffff',
            tipColor: '#ffff00',
            image: 'Qtip.svg',
            stats: { Weight: 28, Sharpness: 1 },
            damage: 5,
            damageType: 'bludgeoning',
            description: 'You probably should not touch the yellow end.'
        }
    },
    armor: {
        basicShell: {
            id: 'basic_shell',
            name: 'Basic Shell',
            type: 'armor',
            width: 30,
            height: 20,
            color: '#888888',
            stats: { Weight: 20 },
            strengths: { bludgeoning: 0.2 },
            weaknesses: { slashing: 0.1 },
            description: 'Offers modest protection.'
        }
    }
};

export function getItemById(id) {
    for (const group of Object.values(items)) {
        for (const item of Object.values(group)) {
            if (item.id === id) return item;
        }
    }
    return null;
}
