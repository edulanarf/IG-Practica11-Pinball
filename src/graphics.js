import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { addStaticPhysics } from "/src/physics.js";

export function createPlayfield({
  tableGroup,
  AmmoLib,
  physicsWorld,
  rigidBodies,
  createRigidBody,
}) {
  const tableWidth = 20;
  const tableLength = 34;

  const playfieldGeo = new THREE.BoxGeometry(tableWidth, 0.5, tableLength);
  const playfieldMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
  const playfield = new THREE.Mesh(playfieldGeo, playfieldMat);

  playfield.receiveShadow = true;
  playfield.rotation.x = -Math.PI / 30;
  playfield.position.set(0, 0, 0);
  tableGroup.add(playfield);

  const bbox = new THREE.Box3().setFromObject(playfield);
  const size = new THREE.Vector3();
  bbox.getSize(size);

  const playfieldShape = new AmmoLib.btBoxShape(
    new AmmoLib.btVector3(tableWidth / 2, 0.25, tableLength / 2)
  );
  addStaticPhysics({
    mesh: playfield,
    shape: playfieldShape,
    AmmoLib,
    physicsWorld,
    rigidBodies,
    createRigidBody,
  });

  return { playfield, size, tableWidth, tableLength };
}

export function addTowers(tableGroup, tableWidth, tableLength, scene) {
  const loader = new GLTFLoader();
  loader.load("models/Tower.glb", (gltf) => {
    const towerModel = gltf.scene;

    towerModel.traverse((child) => {
      if (child.isMesh) {
        child.material.emissive = new THREE.Color(0x333333);
        child.material.emissiveIntensity = 0.5;
        child.material.needsUpdate = true;
      }
    });

    scene.add(tableGroup);

    towerModel.scale.set(0.6, 0.6, 0.6);

    const positions = [
      [tableWidth / 2, 2, tableLength / 2],
      [-tableWidth / 2, 2, tableLength / 2],
    ];

    positions.forEach((pos) => {
      const tower = towerModel.clone();
      tower.position.set(pos[0], pos[1], pos[2]);
      tableGroup.add(tower);
    });
  });
}

export function createWall(
  x,
  z,
  width,
  depth,
  wallHeight,
  tableGroup,
  rotY = 0
) {
  const geo = new THREE.BoxGeometry(width, wallHeight, depth);
  const mat = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const wall = new THREE.Mesh(geo, mat);
  wall.castShadow = true;
  wall.receiveShadow = true;
  wall.position.set(x, wallHeight / 2, z);
  wall.rotation.y = rotY;
  tableGroup.add(wall);

  return wall;
}

export function createStaticWall({
  x,
  z,
  width,
  depth,
  height,
  tableGroup,
  modelPath = "models/longwall.glb",
  modelScale = [1, 1, 1],
  modelOffsetY = 0,
  modelRotationY = 0,
  rotationX = 0,
  rotationY = 0,
  AmmoLib,
  physicsWorld,
  rigidBodies,
  createRigidBody,
  physicsPosY = null,
}) {
  const loader = new GLTFLoader();

  const wallY = height / 2;
  const wall = createWall(x, z, width, depth, height, tableGroup);
  wall.rotation.x = rotationX;

  const posY = physicsPosY !== null ? physicsPosY : wallY;
  wall.position.y = posY;

  let shape = new AmmoLib.btBoxShape(
    new AmmoLib.btVector3(width / 2, height / 2, depth / 2)
  );

  addStaticPhysics({
    mesh: wall,
    shape,
    AmmoLib,
    physicsWorld,
    rigidBodies,
    createRigidBody,
  });

  loader.load(modelPath, (gltf) => {
    const wallModel = gltf.scene;
    wallModel.scale.set(...modelScale);
    wallModel.position.set(0, modelOffsetY, 0);
    wallModel.rotation.y = modelRotationY;
    wall.add(wallModel);
  });

  return wall;
}

export function loadBackground(scene, modelPath, options = {}) {
  const loader = new GLTFLoader();
  const {
    position = new THREE.Vector3(0, 0, -50),
    scale = new THREE.Vector3(1, 1, 1),
    rotation = new THREE.Euler(0, 0, 0),
  } = options;

  return new Promise((resolve, reject) => {
    loader.load(
      modelPath,
      (gltf) => {
        const backgroundGroup = new THREE.Group();
        backgroundGroup.add(gltf.scene);

        backgroundGroup.position.copy(position);
        backgroundGroup.scale.copy(scale);
        backgroundGroup.rotation.copy(rotation);

        scene.add(backgroundGroup);

        resolve(backgroundGroup);
      },
      undefined,
      (error) => {
        console.error("Error cargando el fondo 3D:", error);
        reject(error);
      }
    );
  });
}
