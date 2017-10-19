import { GameObject, GraphicsAdapter, DefaultGraphicsAdapter } from 'engine';
import { GeneratorStage } from './generator-stage';
import { delay } from '../util/delay';

const MILLIS_BETWEEN_STAGES = 100;
const MILLIS_BETWEEN_REPEATS = 50;
const MILLIS_BETWEEN_PASSES = 10;
const CELLS_PER_PASS = 65536;
const SHOULD_WRAP = false;

export class GeneratorController extends GameObject {
    constructor() {
        super('GeneratorController', {
            renderCamera: 'none'
        });
        (<any>window).generator = this;
    }
    
    private isGenerating = false;
    async generate(stages: GeneratorStage[]) {
        if (this.isGenerating) throw new Error(`Can't begin a new generation until the previous one has finished.`);
        if (!stages || !stages.length) throw new Error(`Can't generate without at least one stage`);
        this.isGenerating = true;
        
        this.currentColors.clear();
        
        this.current = [[0]];
        this.currentWidth = 1;
        this.currentHeight = 1;
        
        this.stages = stages;
        for (let q = 0; q < stages.length; this.currentStageIdx = ++q) {
            await delay(MILLIS_BETWEEN_STAGES);
            await this.completeStage(stages[q]);
        }
        this.isGenerating = false;
    }
    private async completeStage(stage: GeneratorStage) {
        if (!stage) throw new Error(`Can't generate without a stage`);
        
        let completed: number;
        switch (stage.type) {
        case 'colorize':
            for (let key in Object.keys(stage.colors)) {
                this.currentColors.set(+key, stage.colors[+key]);
            }
            break;
            
        case 'randomize':
            completed = 0;
            let totalWeight = 0;
            for (let choice of stage.choose) {
                if (typeof choice === 'number') totalWeight++;
                else totalWeight += choice.weight;
            }
            for (let q = 0; q < this.currentWidth; q++) {
                for (let w = 0; w < this.currentHeight; w++) {
                    completed++;
                    let rnd = Math.random() * totalWeight;
                    let value = -1;
                    for (let choice of stage.choose) {
                        if (typeof choice === 'number') rnd -= 1;
                        else rnd -= choice.weight;
                        if (rnd < 0) {
                            value = (typeof choice === 'number' ? choice : choice.value);
                            break;
                        }
                    }
                    if (value === -1) throw new Error(`Something happened... not sure what`);
                    this.set(q, w, value);
                    if (completed > CELLS_PER_PASS) {
                        completed = 0;
                        this.playheadX = q;
                        this.playheadY = w;
                        await delay(MILLIS_BETWEEN_PASSES);
                    }
                }
            }
            break;
            
        case 'subdivide':
            if (typeof stage.sections !== 'number' || stage.sections <= 0 || Math.ceil(stage.sections) !== stage.sections) {
                throw new Error(`Invalid value for subdivide sections. Must be a positive integer`);
            }
            this.subdivide(stage.sections);
            break;
            
        case 'pass':
            this.createPass();
            completed = 0;
            for (let q = 0; q < this.currentWidth; q++) {
                for (let w = 0; w < this.currentHeight; w++) {
                    completed++;
                    let result = stage.action(this, q, w);
                    if (typeof result === 'number' && result !== -1) this.set(q, w, result);
                    if (completed > CELLS_PER_PASS) {
                        completed = 0;
                        this.playheadX = q;
                        this.playheadY = w;
                        await delay(MILLIS_BETWEEN_PASSES);
                    }
                }
            }
            this.destroyPass();
            break;
            
        case 'repeat':
            for (let q = 0; q < stage.times; q++) {
                if (q !== 0) await delay(MILLIS_BETWEEN_REPEATS);
                await this.completeStage(stage.stage);
            }
            break;
            
        default:
            throw new Error(`Unknown generator stage: ${JSON.stringify(stage)}`);
        }
    }
    
    private currentColors = new Map<number, string>();
    
    private current: number[][];
    private currentWidth: number;
    private currentHeight: number;
    
    private isInPass = false;
    private currentPass: number[][] | null;
    
    private stages: GeneratorStage[];
    private currentStageIdx = 0;
    
    private createPass() {
        if (this.isInPass) throw new Error(`Can't create multiple pass buffers`);
        this.isInPass = true;
        this.currentPass = [];
        for (let q = 0; q < this.currentWidth; q++) {
            let col = [];
            this.currentPass.push(col);
            for (let w = 0; w < this.currentHeight; w++) {
                col.push(this.current[q][w]);
            }
        }
    }
    private destroyPass() {
        if (!this.isInPass) throw new Error(`Can't destroy a pass without creating it first`);
        this.isInPass = false;
        this.current = this.currentPass;
        this.currentPass = null;
    }
    
    private subdivide(scale: number) {
        let newWidth = Math.ceil(this.currentWidth * scale);
        let newHeight = Math.ceil(this.currentHeight * scale);
        let newArr = [];
        for (let q = 0; q < newWidth; q++) {
            let col = [];
            newArr.push(col);
            for (let w = 0; w < newHeight; w++) {
                col.push(this.current[Math.floor(q / scale)][Math.floor(w / scale)]);
            }
        }
        this.current = newArr;
        this.currentWidth = newWidth;
        this.currentHeight = newHeight;
    }
    
    set(x: number, y: number, value: number, ignoreOutOfBounds = false) {
        if (x < 0 || y < 0 || x >= this.currentWidth || y >= this.currentHeight) {
            if (ignoreOutOfBounds) return;
            throw new Error(`Coordinates are outside of current map: [${x}, ${y}]`);
        }
        if (this.isInPass) this.currentPass[x][y] = value;
        else this.current[x][y] = value;
    }
    get(x: number, y: number) {
        if (SHOULD_WRAP) {
            x %= this.currentWidth;
            y %= this.currentHeight;
            if (x < 0) x = this.currentWidth + x;
            if (y < 0) y = this.currentHeight + y;
            return this.current[x][y];
        }
        else {
            if (x < 0 || y < 0 || x >= this.currentWidth || y >= this.currentHeight) {
                throw new Error(`Coordinates are outside of current map: [${x}, ${y}]`);
            }
            return this.current[x][y];
        }
    }
    try(x: number, y: number, defaultValue: number) {
        if (SHOULD_WRAP) return this.get(x, y);
        else {
            if (x < 0 || y < 0 || x >= this.currentWidth || y >= this.currentHeight) return defaultValue;
            return this.current[x][y];
        }
    }
    getForRendering(x: number, y: number) {
        if (x < 0 || y < 0 || x >= this.currentWidth || y >= this.currentHeight) {
            throw new Error(`Coordinates are outside of current map: [${x}, ${y}]`);
        }
        try {
            if (this.isInPass) return this.currentPass[x][y];
            else return this.current[x][y];
        }
        catch (e) {
            console.log(`Failed to retrieve [${x}, ${y}]. isInPass: ${this.isInPass}. col:`, this.current[x], 'typeof x', typeof x);
            this.broke = true;
            throw e;
        }
    }
    
    private playheadX = 0;
    private playheadY = 0;
    
    private broke = false;
    renderImpl(adapter: GraphicsAdapter) {
        if (this.broke) return;
        let [canvasWidth, canvasHeight] = this.game.canvasSize;
        if (!(adapter instanceof DefaultGraphicsAdapter)) throw new Error('Not implemented');
        let context = adapter.context;
        
        context.strokeStyle = 'black';
        context.lineWidth = .5;
        
        context.imageSmoothingEnabled = true;
        
        let scale = Math.min(canvasWidth, canvasHeight) / Math.max(this.currentWidth, this.currentHeight);
        for (let q = 0; q < this.currentWidth; q++) {
            for (let w = 0; w < this.currentHeight; w++) {
                let val = this.getForRendering(q, w);
                let color = this.currentColors.get(val) || 'red';
                context.fillStyle = color;
                context.fillRect(q * scale, w * scale, scale * 1.1, scale * 1.1);
                if (this.isInPass) context.strokeRect(q * scale, w * scale, scale, scale);
            }
        }
        
        if (this.isInPass) {
            context.fillStyle = 'rgba(255, 0, 0, .8)';
            context.fillRect(this.playheadX * scale, this.playheadY * scale, scale * 1.1, scale * 1.1);
            context.fillStyle = 'rgba(255, 0, 0, .4)';
            context.fillRect((this.playheadX - 4) * scale, (this.playheadY - 4) * scale, scale * 9, scale * 9);
        }
        
        context.fillStyle = 'rgba(0, 0, 0, .6)';
        context.fillRect(0, 0, 100, 20);
        context.fillStyle = 'white';
        context.textBaseline = 'top';
        context.textAlign = 'left';
        let stageMsg = `Stage ${this.currentStageIdx} of ${this.stages.length}`;
        if (this.currentStageIdx === this.stages.length) stageMsg = 'Complete';
        context.fillText(stageMsg, 4, 4);
    }
}
