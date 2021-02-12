import * as BABYLON from 'babylonjs';
import { Machine, interpret } from 'xstate';

const canvas = <HTMLCanvasElement>document.getElementById('renderCanvas');

const engine = new BABYLON.Engine(canvas);

const scene = createScene();

engine.runRenderLoop(() => {
    scene.render();
})

window.addEventListener('resize', () => {
    engine.resize();
});

function createScene(): BABYLON.Scene {
    const scene = new BABYLON.Scene(engine);

    const camera = new BABYLON.ArcRotateCamera(
        'camera',
        -Math.PI/1.6,
        Math.PI/2,
        10,
        BABYLON.Vector3.Zero(),
        scene
    );
    camera.attachControl(canvas, true);

    const hemiLight = new BABYLON.HemisphericLight(
        'hemiLight',
        new BABYLON.Vector3(-1, .5, -2),
        scene
    );

    const lightBox = BABYLON.MeshBuilder.CreateBox(
        'lightBox',
        { width: 1.1, height: 3.6 },
        scene
    );
    const boxMat = new BABYLON.StandardMaterial('boxMat', scene);
    boxMat.diffuseColor = new BABYLON.Color3(.2, .2, .2);
    lightBox.material = boxMat;

    const context = {
        flashInterval: 500,
        off: new BABYLON.StandardMaterial('offMat', scene),
        red: new BABYLON.StandardMaterial('redMat', scene),
        amber: new BABYLON.StandardMaterial('amberMat', scene),
        green: new BABYLON.StandardMaterial('greenMat', scene)
    }

    context.off.diffuseColor = new BABYLON.Color3(.2, .2, .2);

    context.red.diffuseColor = new BABYLON.Color3(1, 0, 0);
    context.red.emissiveColor = context.red.diffuseColor;

    context.amber.diffuseColor = BABYLON.Color3.FromInts(255, 50, 0);
    context.amber.emissiveColor = context.amber.diffuseColor;
    
    context.green.diffuseColor = new BABYLON.Color3(0, 1, 0);
    context.green.emissiveColor = context.green.diffuseColor;
    
    const redBall = BABYLON.MeshBuilder.CreateSphere(
        'redBall',
        { },
        scene
    );
    redBall.position = new BABYLON.Vector3(0, 1.1, -.5);
    redBall.material = context.off;
    
    const amberBall = BABYLON.MeshBuilder.CreateSphere(
        'amberBall',
        { },
        scene
    );
    amberBall.position = new BABYLON.Vector3(0, 0, -.5);
    amberBall.material = context.off;
    
    const greenBall = BABYLON.MeshBuilder.CreateSphere(
        'greenBall',
        { },
        scene
    );
    greenBall.position = new BABYLON.Vector3(0, -1.1, -.5);
    greenBall.material = context.off;

    const lightMachine = Machine(
        {
            id: 'light',
            initial: 'red',
            context: context,
            states: {
                red: {
                    on: { CHANGE: 'green' },
                    entry: ['switchOn', 'notifyRed'],
                    exit: ['switchOff']
                },
                amber: {
                    on: { CHANGE: 'red' },
                    entry: ['switchOn', 'notifyAmber'],
                    exit: ['switchOff'],
                    activities: ['flashing']
                },
                green: {
                    on: { CHANGE: 'amber' },
                    entry: ['switchOn', 'notifyGreen'],
                    exit: ['switchOff']
                }
            }
        },
        {
            actions: {
                switchOn: (context, event, meta) => {
                    switch (meta.state.value) {
                        case 'red':
                            redBall.material = context.red;
                            break;
                        case 'amber':
                            amberBall.material = context.amber;
                            break;
                        case 'green':
                            greenBall.material = context.green;
                            break;
                    }
                },
                switchOff: (context, event, meta) => {
                    switch (meta.state.history.value) {
                        case 'red':
                            redBall.material = context.off;
                            break;
                        case 'amber':
                            amberBall.material = context.off;
                            break;
                        case 'green':
                            greenBall.material = context.off;
                            break;
                    }
                },
                notifyRed: (context, event, meta) => {
                    console.log('notify: red');
                },
                notifyAmber: (context, event, meta) => {
                    console.log('notify: amber');
                },
                notifyGreen: (context, event, meta) => {
                    console.log('notify: green');
                }
            },
            activities: {
                flashing: (context) => {
                    const interval = setInterval(() => {
                        amberBall.material = 
                            amberBall.material == context.off ? 
                            context.amber : context.off;
                    }, context.flashInterval);
                    return () => clearInterval(interval);
                }
            }
        }
    );

    const lightService = interpret(lightMachine);
    
    lightService.start();

    const TIMEOUT = 3;
    let elapsed = 0;
    let interval = setInterval(() => {
        if (elapsed++ < TIMEOUT) {
            return;
        }

        let state = lightService.send('CHANGE');
        console.log(state);
        elapsed = 0;
    }, 1000)

    

    return scene;
}

