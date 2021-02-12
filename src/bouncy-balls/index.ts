import * as CANNON from 'cannon';
//import * as OIMO from 'oimo';
//import * as Ammo from 'ammo';
import * as BABYLON from 'babylonjs';

const fps = document.getElementById('fps');
const canvas = <HTMLCanvasElement>document.getElementById('renderCanvas');

const engine = new BABYLON.Engine(canvas, true);

const scene = createScene();

engine.runRenderLoop(() => {
    fps.innerHTML = engine.getFps().toFixed() + " fps";
    scene.render();
})

window.addEventListener('resize', () => {
    engine.resize();
})

function createScene(): BABYLON.Scene {
    const BALL_COUNT = 200;

    const GROUND_SIZE = 200;
    const DROP_ZONE_SIZE = 100;

    const scene = new BABYLON.Scene(engine);

    const physics = new BABYLON.CannonJSPlugin(undefined, undefined, CANNON);
    //const physics = new BABYLON.OimoJSPlugin(undefined, OIMO);
    //const physics = new BABYLON.AmmoJSPlugin(undefined, Ammo);
    
    scene.enablePhysics(
        new BABYLON.Vector3(0, -10, 0),
        physics
    );
    //physics.setTimeStep(1/60); // <-- default

    const camera = new BABYLON.ArcRotateCamera(
        'camera',
        -Math.PI/1.9,
        Math.PI/2.3,
        150,
        BABYLON.Vector3.Zero(),
        scene
    );
    camera.attachControl(canvas, true);

    const hemiLight = new BABYLON.HemisphericLight(
        'hemiLight', 
        new BABYLON.Vector3(0, 1, 0),
        scene
    );
    hemiLight.intensity = .7;

    const pointLight = new BABYLON.PointLight(
        'pointLight',
        new BABYLON.Vector3(
            -10, 
            50, 
            -10
        ),
        scene
    );
    pointLight.intensity = .3;

    const ground = BABYLON.MeshBuilder.CreatePlane(
        'ground',
        {
            width: GROUND_SIZE,
            height: GROUND_SIZE
        },
        scene
    );
    ground.rotate(BABYLON.Axis.X, Math.PI/2);
    let groundMat = new BABYLON.StandardMaterial(
        'groundMat', scene
    );
    groundMat.diffuseColor = new BABYLON.Color3(.1, .5, .5);
    ground.material = groundMat;
    ground.physicsImpostor = new BABYLON.PhysicsImpostor(
        ground,
        BABYLON.PhysicsImpostor.BoxImpostor,
        {
            mass: 0, // static imposter (good for floors)
            friction: .5,
            restitution: .9 // very bouncy
        },
        scene
    )
    const rearBarrier = BABYLON.MeshBuilder.CreateBox(
        'rearBarrier',
        { 
            width: GROUND_SIZE, 
            height: GROUND_SIZE/10, 
            depth: GROUND_SIZE/10 
        },
        scene
    );
    rearBarrier.position.y = GROUND_SIZE/20;
    rearBarrier.position.z = GROUND_SIZE/2-GROUND_SIZE/20;
    rearBarrier.physicsImpostor = new BABYLON.PhysicsImpostor(
        rearBarrier,
        BABYLON.PhysicsImpostor.BoxImpostor,
        {
            mass: 0,
            friction: .5,
            restitution: .9
        },
        scene
    );

    for (let i = 0; i < BALL_COUNT; i++) {
        const sphere = BABYLON.MeshBuilder.CreateSphere(
            `ball${i}`,
            { },
            scene
        );
        const sphereMat = new BABYLON.StandardMaterial(
            `sphereMath${i}`, scene
        );
        sphere.material = sphereMat;
        sphere.position = new BABYLON.Vector3(
            Math.random()*DROP_ZONE_SIZE-DROP_ZONE_SIZE/2,
            Math.random()*DROP_ZONE_SIZE+5,
            Math.random()*DROP_ZONE_SIZE-DROP_ZONE_SIZE/2
        );
        sphere.physicsImpostor = new BABYLON.PhysicsImpostor(
            sphere,
            BABYLON.PhysicsImpostor.SphereImpostor,
            {
                mass: Math.random()*5+5, // kg
                restitution: (Math.random()*5)/100
            },
            scene
        );
        sphere.physicsImpostor.registerOnPhysicsCollide(
            ground.physicsImpostor, (thisCollider, against) => {
                (thisCollider.object as any).material.diffuseColor = 
                    new BABYLON.Color3(
                        Math.random(),
                        Math.random(),
                        Math.random()
                    );
            }
        )

        let force = new BABYLON.Vector3( // force
            Math.random()*50, 
            Math.random(), 
            Math.random()*50
        );
        let centreContact = sphere.getAbsolutePosition();
        sphere.physicsImpostor.applyImpulse(
            force,
            new BABYLON.Vector3(
                centreContact.x + Math.random(),
                centreContact.y + Math.random(),
                centreContact.z + Math.random()
            )
        );
    }

    // https://doc.babylonjs.com/how_to/using_the_physics_engine
    // https://doc.babylonjs.com/how_to/forces
    // https://doc.babylonjs.com/how_to/soft_bodies
    // https://doc.babylonjs.com/how_to/using_advanced_physics_features
    // https://github.com/schteppe/cannon.js/blob/master/examples/worker.html

    return scene;
}




