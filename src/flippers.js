import * as THREE from "three";
import { createFlipperPhysics } from "./physics.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const loader = new GLTFLoader();

export function loadFlipper({
  modelPath = "models/pinball_flipper.glb",
  groupPosition = new THREE.Vector3(),
  groupRotationY = 0,
  modelScale = 0.55,
  modelRotationY = 0,
  modelPosition = new THREE.Vector3(0, 0, 0),
  isLeft = true,
  flipperLength = 3,
  flipperHeight = 1,
  flipperWidth = 0.4,
  AmmoLib,
  physicsWorld,
  scene,
}) {
  return new Promise((resolve) => {
    loader.load(modelPath, (gltf) => {
      const model = gltf.scene;
      model.scale.set(modelScale, modelScale, modelScale);
      model.rotation.y = modelRotationY;
      model.position.copy(modelPosition);

      const flipperGroup = new THREE.Group();
      flipperGroup.position.copy(groupPosition);
      flipperGroup.rotation.y = groupRotationY;
      flipperGroup.add(model);
      scene.add(flipperGroup);

      flipperGroup.userData.baseQuaternion = flipperGroup.quaternion.clone();

      createFlipperPhysics(
        flipperGroup,
        flipperLength,
        flipperHeight,
        flipperWidth,
        AmmoLib,
        physicsWorld
      );

      resolve(flipperGroup);
    });
  });
}
