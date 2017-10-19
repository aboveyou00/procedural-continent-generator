import { Game } from 'engine';
import { StartScene } from './scenes/start.scene';

export class ProceduralContinentGenerator extends Game {
    constructor(framesPerSecond = 30) {
        super({
            framesPerSecond: 30
        });
    }

    start() {
        super.start();
        this.changeScene(new StartScene());
    }
}
