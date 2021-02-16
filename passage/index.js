import BABYLON from "../snowpack/pkg/babylonjs.js.js";
import "../snowpack/pkg/babylonjs-loaders.js.js";
const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);
const scene = new BABYLON.Scene(engine);
const camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2.1, 20, BABYLON.Vector3.Zero(), scene);
camera.attachControl(true);
const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
BABYLON.SceneLoader.ImportMeshAsync("", "/meshes/", "passage-v1.glb").then(() => {
  console.log("glb loaded!");
});
engine.runRenderLoop(() => {
  scene.render();
});
window.addEventListener("resize", () => {
  engine.resize();
});
