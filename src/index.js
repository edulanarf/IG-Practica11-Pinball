import * as THREE from "three";
import Ammo from "ammojs-typed";
import { gsap } from "gsap";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  onWindowResize,
  createRenderer,
  createLights,
  createStaticTriangleMesh,
  curvedPlane,
} from "/src/utility.js";

import {
  createPlayfield,
  addTowers,
  createWall,
  createStaticWall,
  loadBackground,
} from "/src/graphics.js";

import { loadPiedras } from "/src/stones.js";
import { loadFlipper } from "./flippers.js";
import {
  initPhysics,
  createBallWithPhysics,
  createRigidBody,
  addStaticPhysics,
  updatePhysics,
} from "./physics.js";

import * as TWEEN from "@tweenjs/tween.js";

let camera, scene, renderer;
let physicsWorld;
let rigidBodies = [];
let margin = 0.05;
let wallThickness = 0.9;
let wallHeight = 2;

let transformAux1;

let playfield;
let AmmoLib;

let plunger,
  ball,
  isCharging = false,
  chargeStartTime = 0;

let leftFlipperGroup, rightFlipperGroup;

const loader = new GLTFLoader();

Ammo().then((AmmoLoaded) => {
  AmmoLib = AmmoLoaded;
  const physics = initPhysics(AmmoLib);
  physicsWorld = physics.physicsWorld;
  transformAux1 = physics.transformAux1;

  start();
});

function start() {
  initGraphics();
  createPlunger();
  initInput();
}

function initGraphics() {
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.2,
    2000
  );
  camera.position.set(0, 20, -22);
  camera.lookAt(0, 0, 0);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbfd1e5);
  renderer = createRenderer();

  createLights(scene);

  createPinballTable();
  /*
  loadBackground(scene, "models/room.glb", {
    position: new THREE.Vector3(0, 0, -30),
    scale: new THREE.Vector3(50, 50, 50),
    rotation: new THREE.Euler(-Math.PI / 30, 0, 0),
  }).then((bg) => {
    console.log("Fondo 3D cargado", bg);
  });
  */
  animate();

  window.addEventListener("resize", () => onWindowResize(renderer, camera));
}

function animate() {
  window.requestAnimationFrame(animate);

  updatePhysics(
    1 / 60,
    physicsWorld,
    rigidBodies,
    transformAux1,
    leftFlipperGroup,
    rightFlipperGroup,
    AmmoLib
  );
  renderer.render(scene, camera);
}

async function createPinballTable() {
  const tableGroup = new THREE.Group();

  const result = createPlayfield({
    tableGroup,
    AmmoLib,
    physicsWorld,
    rigidBodies,
    createRigidBody,
  });
  playfield = result.playfield;
  const { tableWidth, tableLength } = result;

  addTowers(tableGroup, tableWidth, tableLength, scene);

  // MURO DERECHO
  const rightWall = createStaticWall({
    x: -tableWidth / 2 - wallThickness / 2,
    z: 0,
    width: wallThickness,
    depth: tableLength,
    height: wallHeight,
    tableGroup,
    modelScale: [22, 4.4, 6],
    modelOffsetY: -0.7,
    modelRotationY: Math.PI / 2,
    rotationX: playfield.rotation.x,
    AmmoLib,
    physicsWorld,
    rigidBodies,
    createRigidBody,
  });

  // MURO IZQUIERDO
  const leftWall = createStaticWall({
    x: tableWidth / 2 + wallThickness / 2,
    z: 0,
    width: wallThickness,
    depth: tableLength,
    height: wallHeight,
    tableGroup,
    modelScale: [22, 4.6, 6],
    modelOffsetY: -0.7,
    modelRotationY: Math.PI / 2,
    rotationX: playfield.rotation.x,
    AmmoLib,
    physicsWorld,
    rigidBodies,
    createRigidBody,
  });

  // MURO DE ARRIBA
  const topWall = createStaticWall({
    x: 0,
    z: tableLength / 2 - wallThickness / 2,
    width: tableWidth,
    depth: wallThickness,
    height: wallHeight,
    tableGroup,
    modelPath: "models/longwall.glb",
    modelScale: [13, 4.4, 6],
    modelOffsetY: -0.8,
    modelRotationY: 0,
    rotationX: playfield.rotation.x,
    AmmoLib,
    physicsPosY: 2.45 + wallThickness / 2,
    physicsWorld,
    rigidBodies,
    createRigidBody,
  });

  // MURO ROTADO IZQUIERDO
  const lefRotatedWall = createWall(
    7.5,
    -12,
    wallThickness,
    6.4,
    wallHeight,
    tableGroup
  );
  lefRotatedWall.rotation.x = playfield.rotation.x;
  lefRotatedWall.rotation.y = 1;
  lefRotatedWall.position.y = -0.1;
  const lefRotatedWallShape = new AmmoLib.btBoxShape(
    new AmmoLib.btVector3(wallThickness / 2, wallHeight / 2, 6 / 2)
  );
  loader.load("models/longwall.glb", (gltf) => {
    const wallModel = gltf.scene;
    wallModel.scale.set(4.4, 4.4, 6);
    wallModel.position.set(0, -0.87, 0);
    wallModel.rotation.y = Math.PI / 2;
    lefRotatedWall.add(wallModel);
  });

  addStaticPhysics({
    mesh: lefRotatedWall,
    shape: lefRotatedWallShape,
    createRigidBody,
    AmmoLib,
    physicsWorld,
    rigidBodies,
  });

  //MURO ROTADO DERECHO
  const rightRotatedWall = createWall(
    -5.2,
    -12,
    wallThickness,
    6.4,
    wallHeight,
    tableGroup
  );
  rightRotatedWall.rotation.x = playfield.rotation.x;
  rightRotatedWall.rotation.y = -1;
  rightRotatedWall.position.y = -0.1;
  const rightRotatedWallShape = new AmmoLib.btBoxShape(
    new AmmoLib.btVector3(wallThickness / 2, wallHeight / 2, 6 / 2)
  );

  loader.load("models/longwall.glb", (gltf) => {
    const wallModel = gltf.scene;
    wallModel.scale.set(4.4, 4.4, 6);
    wallModel.position.set(0, -0.87, 0);
    wallModel.rotation.y = Math.PI / 2;
    rightRotatedWall.add(wallModel);
  });
  addStaticPhysics({
    mesh: rightRotatedWall,
    shape: rightRotatedWallShape,
    createRigidBody,
    AmmoLib,
    physicsWorld,
    rigidBodies,
  });

  // MURO DE LANZAMIENTO
  const shootLane = createStaticWall({
    x: -tableWidth / 2 + 2,
    z: -tableLength / 2 + tableLength / 4,
    width: wallThickness,
    depth: tableLength / 2,
    height: wallHeight,
    tableGroup,
    modelPath: "models/longwall.glb",
    modelScale: [10.8, 4.4, 6],
    modelOffsetY: -0.7,
    modelRotationY: Math.PI / 2,
    rotationX: playfield.rotation.x,
    AmmoLib,
    physicsPosY: 0.25,
    physicsWorld,
    rigidBodies,
    createRigidBody,
  });

  // PLANO PARA EL MURO CURVO
  const planeGeometry = new THREE.PlaneBufferGeometry(8, 2, 32, 32);
  curvedPlane(planeGeometry, 0.8);
  const material = new THREE.MeshLambertMaterial({
    color: 0xaaaaaa,
    side: THREE.DoubleSide,
  });

  // MURO CURVO DERECHO
  const planeMeshRight = new THREE.Mesh(planeGeometry, material);
  planeMeshRight.position.set(-7.5, 2.35, 13.3);
  planeMeshRight.rotation.set(playfield.rotation.x, -4, 0);
  scene.add(planeMeshRight);

  createStaticTriangleMesh(
    planeMeshRight,
    AmmoLib,
    addStaticPhysics,
    createRigidBody,
    physicsWorld,
    rigidBodies
  );

  // MURO CURVO IZQUIERDO
  const planeMeshLeft = new THREE.Mesh(planeGeometry, material);
  planeMeshLeft.position.set(7.5, 2.35, 13.3);
  planeMeshLeft.rotation.set(playfield.rotation.x, 4, 0);
  scene.add(planeMeshLeft);

  createStaticTriangleMesh(
    planeMeshLeft,
    AmmoLib,
    addStaticPhysics,
    createRigidBody,
    physicsWorld,
    rigidBodies
  );

  // Escondo los planos
  planeMeshRight.visible = false;
  planeMeshLeft.visible = false;

  // PIEDRAS DE LAS CURVAS
  loadPiedras(loader, scene);

  // FLIPPERS
  [leftFlipperGroup, rightFlipperGroup] = await Promise.all([
    loadFlipper({
      groupPosition: new THREE.Vector3(4.9, -0.75, -13.5),
      groupRotationY: -0.3,
      modelRotationY: 3.2,
      modelPosition: new THREE.Vector3(-1.6, 0, -0.4),
      AmmoLib,
      physicsWorld,
      scene,
    }),
    loadFlipper({
      groupPosition: new THREE.Vector3(-2.7, -0.75, -13.6),
      groupRotationY: 0.3,
      modelRotationY: 0,
      modelPosition: new THREE.Vector3(1.6, 0, -0.4),
      AmmoLib,
      physicsWorld,
      scene,
    }),
  ]);

  scene.add(tableGroup);
}

function initInput() {
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") startCharging();
  });

  window.addEventListener("keyup", (e) => {
    if (e.code === "Space") releaseShot();
  });

  window.addEventListener("keydown", (e) => {
    if (e.code === "ArrowLeft") moveFlipper(leftFlipperGroup, 0.6, 0.1);
    if (e.code === "ArrowRight") moveFlipper(rightFlipperGroup, -0.6, 0.1);
  });

  window.addEventListener("keyup", (e) => {
    if (e.code === "ArrowLeft") moveFlipper(leftFlipperGroup, 0, 0.1);
    if (e.code === "ArrowRight") moveFlipper(rightFlipperGroup, 0, 0.1);
  });
}

function createPlunger() {
  const geo = new THREE.CylinderGeometry(0.5, 0.5, 2, 32);
  const mat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
  plunger = new THREE.Mesh(geo, mat);
  plunger.position.set(-9, -0.5, -15);
  plunger.rotation.x = Math.PI / 2;
  scene.add(plunger);

  plunger.basePosition = plunger.position.clone();

  const shape = new AmmoLib.btCylinderShape(new AmmoLib.btVector3(0.5, 1, 0.5));

  const transform = new AmmoLib.btTransform();
  transform.setIdentity();
  transform.setOrigin(
    new AmmoLib.btVector3(
      plunger.position.x,
      plunger.position.y,
      plunger.position.z
    )
  );
  transform.setRotation(
    new AmmoLib.btQuaternion(
      plunger.quaternion.x,
      plunger.quaternion.y,
      plunger.quaternion.z,
      plunger.quaternion.w
    )
  );

  const motionState = new AmmoLib.btDefaultMotionState(transform);

  const mass = 0;
  const localInertia = new AmmoLib.btVector3(0, 0, 0);

  const rbInfo = new AmmoLib.btRigidBodyConstructionInfo(
    mass,
    motionState,
    shape,
    localInertia
  );
  const body = new AmmoLib.btRigidBody(rbInfo);

  body.setCollisionFlags(2);
  body.setActivationState(4);

  plunger.userData.physicsBody = body;

  physicsWorld.addRigidBody(body);
}

function prepareBall() {
  if (!ball) {
    const radius = 0.5;
    const mass = 1;
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const pos = new THREE.Vector3(-9, -0.5, -14);
    const quat = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(playfield.rotation.x, 0, 0)
    );
    ball = createBallWithPhysics({
      radius: 0.5,
      mass: 1,
      pos: new THREE.Vector3(-9, -0.5, -14),
      quat: new THREE.Quaternion().setFromEuler(
        new THREE.Euler(playfield.rotation.x, 0, 0)
      ),
      material: new THREE.MeshStandardMaterial({ color: 0xff0000 }),
      scene,
      loader,
      AmmoLib,
      margin,
      createRigidBody,
      physicsWorld,
      rigidBodies,
    });
  }
}

function startCharging() {
  if (!isCharging) {
    isCharging = true;
    chargeStartTime = performance.now();
    prepareBall();

    movePlunger(-1, 2);
  }
}

function releaseShot() {
  if (isCharging) {
    isCharging = false;
    const elapsed = (performance.now() - chargeStartTime) / 1000;
    const charge = Math.min(elapsed, 2) / 2;
    const minImpulse = 8;
    const maxImpulse = 45;
    const impulseStrength = minImpulse + charge * (maxImpulse - minImpulse);

    movePlunger(1, 0.2);

    const impulse = new AmmoLib.btVector3(0, 0, impulseStrength);
    ball.userData.physicsBody.setActivationState(1);
    ball.userData.physicsBody.setLinearVelocity(impulse);

    ball = null;
    chargeStartTime = 0;
  }
}

function movePlunger(offsetZ, duration) {
  if (plunger.currentTween) plunger.currentTween.kill();

  const startZ = plunger.position.z;
  const targetZ = plunger.basePosition.z + offsetZ;

  plunger.currentTween = gsap.to(plunger.position, {
    z: targetZ,
    duration: duration,
    ease: "power1.inOut",
    onUpdate: () => {
      const transform = new AmmoLib.btTransform();
      transform.setIdentity();
      transform.setOrigin(
        new AmmoLib.btVector3(
          plunger.position.x,
          plunger.position.y,
          plunger.position.z
        )
      );
      transform.setRotation(
        new AmmoLib.btQuaternion(
          plunger.quaternion.x,
          plunger.quaternion.y,
          plunger.quaternion.z,
          plunger.quaternion.w
        )
      );
      plunger.userData.physicsBody.setWorldTransform(transform);
    },
    onComplete: () => {
      if (offsetZ > 0) plunger.position.z = plunger.basePosition.z;
    },
  });
}

function moveFlipper(flipperMesh, targetDeltaY, duration = 0.1) {
  gsap.to(flipperMesh.userData, {
    currentDeltaY: targetDeltaY,
    duration: duration,
    ease: "power1.inOut",
  });
}
