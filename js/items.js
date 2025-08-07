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
    swords: {
        usedQtip: {
            id: 'used_q_tip',
            name: 'Used Q-tip',
            type: 'weapon',
            width: 60,
            height: 10,
            color: '#ffffff',
            tipColor: '#ffff00',
            stats: { Weight: 28, Sharpness: 1 },
            description: 'You probably should not touch the yellow end.'
        }
    },
    armor: {
        // future armor items can go here
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
