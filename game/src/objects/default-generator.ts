import { GeneratorStage } from './generator-stage';
import { GeneratorController } from './generator-controller';

function simplifyLand(seaThreshold: number, landThreshold: number, randomOffset = 0) {
    return function(controller: GeneratorController, x: number, y: number) {
        let adjacentWater = 0;
        let defaultValue = controller.get(x, y);
        for (let q = -1; q <= 1; q++) {
            for (let w = -1; w <= 1; w++) {
                adjacentWater += (controller.try(x + q, y + w, defaultValue) === 0 ? 1 : 0);
            }
        }
        if (randomOffset !== 0) adjacentWater += (Math.random() * randomOffset) - (randomOffset / 2);
        if (adjacentWater > seaThreshold) return 0;
        else if (adjacentWater < landThreshold) return 1;
        else return defaultValue;
    }
}

export const defaultGenerator: GeneratorStage[] = [
    {
        type: 'colorize',
        colors: {
            0: 'blue',
            1: 'green'
        }
    },
    {
        type: 'subdivide',
        sections: 16
    },
    {
        type: 'randomize',
        choose: [
            { value: 0, weight: 1 },
            { value: 1, weight: 1 }
        ]
    },
    {
        type: 'pass',
        action: simplifyLand(6, 3)
    },
    {
        type: 'subdivide',
        sections: 2
    },
    {
        type: 'pass',
        action: simplifyLand(4, 5, 6)
    },
    {
        type: 'subdivide',
        sections: 2
    },
    {
        type: 'pass',
        action: simplifyLand(4, 5, 5)
    },
    {
        type: 'pass',
        action: simplifyLand(5, 4, 5)
    },
    {
        type: 'subdivide',
        sections: 4
    },
    {
        type: 'pass',
        action: simplifyLand(4, 5, 2)
    }
];
