import * as THREE from "three";

export function onWindowResize(renderer, camera) {
  camera.aspect = window.innerWidth / window.innerHeight;
  renderer.setSize(window.innerWidth, window.innerHeight);
}

export function createRenderer() {
  const renderer = new THREE.WebGLRenderer({ antialias: true });

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;

  document.body.appendChild(renderer.domElement);

  return renderer;
}

export function createLights(scene) {
  scene.add(new THREE.AmbientLight(0x707070, 4));
  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(0, 20, 0);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(1024, 1024);

  const d = 14;
  const cam = dirLight.shadow.camera;
  cam.left = -d;
  cam.right = d;
  cam.top = d;
  cam.bottom = -d;
  cam.near = 2;
  cam.far = 50;

  scene.add(dirLight);
}

export function createStaticTriangleMesh(
  mesh,
  AmmoLib,
  addStaticPhysics,
  createRigidBody,
  physicsWorld,
  rigidBodies
) {
  const triangleMesh = new AmmoLib.btTriangleMesh();
  const posAttr = mesh.geometry.attributes.position;

  for (let i = 0; i < posAttr.count; i += 3) {
    const v0 = new AmmoLib.btVector3(
      posAttr.getX(i),
      posAttr.getY(i),
      posAttr.getZ(i)
    );
    const v1 = new AmmoLib.btVector3(
      posAttr.getX(i + 1),
      posAttr.getY(i + 1),
      posAttr.getZ(i + 1)
    );
    const v2 = new AmmoLib.btVector3(
      posAttr.getX(i + 2),
      posAttr.getY(i + 2),
      posAttr.getZ(i + 2)
    );
    triangleMesh.addTriangle(v0, v1, v2, true);
  }

  const shape = new AmmoLib.btBvhTriangleMeshShape(triangleMesh, true, true);

  addStaticPhysics({
    mesh,
    shape,
    createRigidBody,
    AmmoLib,
    physicsWorld,
    rigidBodies,
  });

  return shape;
}

export function curvedPlane(g, z) {
  const p = g.parameters;
  const hw = p.width * 0.5;

  const a = new THREE.Vector2(-hw, 0);
  const b = new THREE.Vector2(0, z);
  const c = new THREE.Vector2(hw, 0);

  const ab = new THREE.Vector2().subVectors(a, b);
  const bc = new THREE.Vector2().subVectors(b, c);
  const ac = new THREE.Vector2().subVectors(a, c);

  const r =
    (ab.length() * bc.length() * ac.length()) / (2 * Math.abs(ab.cross(ac)));

  const center = new THREE.Vector2(0, z - r);
  const baseV = new THREE.Vector2().subVectors(a, center);
  const baseAngle = baseV.angle() - Math.PI * 0.5;
  const arc = baseAngle * 2;

  const uv = g.attributes.uv;
  const pos = g.attributes.position;
  const mainV = new THREE.Vector2();

  for (let i = 0; i < uv.count; i++) {
    const uvRatio = 1 - uv.getX(i);
    const y = pos.getY(i);
    mainV.copy(c).rotateAround(center, arc * uvRatio);
    pos.setXYZ(i, mainV.x, y, -mainV.y);
  }
  pos.needsUpdate = true;
}
