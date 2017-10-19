import { GameObject, GraphicsAdapter } from 'engine';

export class GeneratorController extends GameObject {
    constructor() {
        super('GeneratorController', {
            renderCamera: 'none'
        });
    }
    
    renderImpl(adapter: GraphicsAdapter) {
        adapter.clear('orange');
    }
}
