import { GameScene, Camera } from 'engine';
import { GeneratorController } from '../objects/generator-controller';
import { defaultGenerator } from '../objects/default-generator';

export class StartScene extends GameScene {
    constructor() {
        super();
    }
    
    private initialized = false;
    
    start() {
        super.start();
        
        if (this.initialized) return;
        this.initialized = true;
        
        let camera = this.camera = new Camera(this);
        camera.clearColor = 'black';
        
        let generator = new GeneratorController();
        this.addObject(generator);
        generator.generate(defaultGenerator);
    }
}
