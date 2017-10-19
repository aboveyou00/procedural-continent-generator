import { GeneratorController } from './generator-controller';

export type ColorizeGeneratorStage = {
    type: 'colorize',
    colors: {
        [key: number]: string
    }
};
export type RandomizeGeneratorStage = {
    type: 'randomize',
    predicate?: (controller: GeneratorController, x: number, y: number) => boolean,
    choose: number[] | { value: number, weight: number }[]
};
export type SubdivideGeneratorStage = {
    type: 'subdivide',
    sections?: number
};
export type PassGeneratorStage = {
    type: 'pass',
    action: (controller: GeneratorController, x: number, y: number) => void | number
};
export type RepeatGeneratorStage = {
    type: 'repeat',
    times: number,
    stage: GeneratorStage
};

export type GeneratorStage = ColorizeGeneratorStage | RandomizeGeneratorStage | SubdivideGeneratorStage | PassGeneratorStage | RepeatGeneratorStage;
