import * as THREE from "three";

export function createFlipperPhysics(
  mesh,
  length,
  height,
  width,
  AmmoLib,
  physicsWorld
) {
  const halfExtents = new AmmoLib.btVector3(
    length,
    height / 2,
    width / 2 + 0.05
  );
  const shape = new AmmoLib.btBoxShape(halfExtents);
  shape.setMargin(0.05);

  const transform = new AmmoLib.btTransform();
  transform.setIdentity();
  transform.setOrigin(
    new AmmoLib.btVector3(mesh.position.x, mesh.position.y, mesh.position.z)
  );

  const worldQuat = new THREE.Quaternion();
  mesh.getWorldQuaternion(worldQuat);
  transform.setRotation(
    new AmmoLib.btQuaternion(worldQuat.x, worldQuat.y, worldQuat.z, worldQuat.w)
  );

  const motionState = new AmmoLib.btDefaultMotionState(transform);

  const rbInfo = new AmmoLib.btRigidBodyConstructionInfo(
    0,
    motionState,
    shape,
    new AmmoLib.btVector3(0, 0, 0)
  );

  const body = new AmmoLib.btRigidBody(rbInfo);

  body.setCollisionFlags(2);
  body.setActivationState(4);

  mesh.userData.physicsBody = body;
  physicsWorld.addRigidBody(body);
}

export function initPhysics(AmmoLib) {
  const collisionConfiguration = new AmmoLib.btDefaultCollisionConfiguration();
  const dispatcher = new AmmoLib.btCollisionDispatcher(collisionConfiguration);
  const broadphase = new AmmoLib.btDbvtBroadphase();
  const solver = new AmmoLib.btSequentialImpulseConstraintSolver();

  const physicsWorld = new AmmoLib.btDiscreteDynamicsWorld(
    dispatcher,
    broadphase,
    solver,
    collisionConfiguration
  );
  physicsWorld.setGravity(new AmmoLib.btVector3(0, -9.8, 0));

  const transformAux1 = new AmmoLib.btTransform();

  return { physicsWorld, transformAux1 };
}

export function createBallWithPhysics({
  radius,
  mass,
  pos,
  quat,
  material,
  scale = 0.7,
  scene,
  loader,
  AmmoLib,
  margin,
  createRigidBody,
  physicsWorld,
  rigidBodies,
}) {
  const object = new THREE.Group();
  object.position.copy(pos);
  object.quaternion.copy(quat);
  scene.add(object);

  loader.load("models/ball.glb", (gltf) => {
    const model = gltf.scene;
    model.scale.set(scale, scale, scale);

    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    object.add(model);
  });

  const shape = new AmmoLib.btSphereShape(radius);
  shape.setMargin(margin);

  createRigidBody(
    object,
    shape,
    mass,
    pos,
    quat,
    undefined,
    undefined,
    AmmoLib,
    physicsWorld,
    rigidBodies
  );

  return object;
}

export function createRigidBody(
  object,
  physicsShape,
  mass,
  pos,
  quat,
  vel,
  angVel,
  AmmoLib,
  physicsWorld,
  rigidBodies
) {
  object.updateMatrixWorld(true);

  const worldPos = pos
    ? pos.clone()
    : object.getWorldPosition(new THREE.Vector3());
  const worldQuat = quat
    ? quat.clone()
    : object.getWorldQuaternion(new THREE.Quaternion());

  const transform = new AmmoLib.btTransform();
  transform.setIdentity();
  transform.setOrigin(
    new AmmoLib.btVector3(worldPos.x, worldPos.y, worldPos.z)
  );
  transform.setRotation(
    new AmmoLib.btQuaternion(worldQuat.x, worldQuat.y, worldQuat.z, worldQuat.w)
  );

  const motionState = new AmmoLib.btDefaultMotionState(transform);

  const localInertia = new AmmoLib.btVector3(0, 0, 0);
  if (mass > 0) physicsShape.calculateLocalInertia(mass, localInertia);

  const rbInfo = new AmmoLib.btRigidBodyConstructionInfo(
    mass,
    motionState,
    physicsShape,
    localInertia
  );
  const body = new AmmoLib.btRigidBody(rbInfo);

  body.setFriction(0.5);

  if (vel) body.setLinearVelocity(new AmmoLib.btVector3(vel.x, vel.y, vel.z));
  if (angVel)
    body.setAngularVelocity(
      new AmmoLib.btVector3(angVel.x, angVel.y, angVel.z)
    );

  object.userData.physicsBody = body;
  object.userData.collided = false;

  if (mass > 0) {
    rigidBodies.push(object);
    body.setActivationState(4);
  }

  physicsWorld.addRigidBody(body);

  return body;
}

export function addStaticPhysics({
  mesh,
  shape,
  createRigidBody,
  AmmoLib,
  physicsWorld,
  rigidBodies,
}) {
  const pos = mesh.position;
  const quat = mesh.quaternion;

  createRigidBody(
    mesh,
    shape,
    0,
    pos,
    quat,
    undefined,
    undefined,
    AmmoLib,
    physicsWorld,
    rigidBodies
  );
}

export function updatePhysics(
  deltaTime,
  physicsWorld,
  rigidBodies,
  transformAux1,
  leftFlipperGroup,
  rightFlipperGroup,
  AmmoLib
) {
  if (!physicsWorld) return;

  physicsWorld.stepSimulation(deltaTime, 10);

  rigidBodies.forEach((obj) => {
    const body = obj.userData.physicsBody;
    const ms = body.getMotionState();
    if (ms) {
      ms.getWorldTransform(transformAux1);
      const p = transformAux1.getOrigin();
      const q = transformAux1.getRotation();
      obj.position.set(p.x(), p.y(), p.z());
      obj.quaternion.set(q.x(), q.y(), q.z(), q.w());
    }
  });

  [leftFlipperGroup, rightFlipperGroup].forEach((flipperGroup) => {
    if (!flipperGroup) return;

    const rotationDelta = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(0, flipperGroup.userData.currentDeltaY || 0, 0)
    );

    flipperGroup.quaternion
      .copy(flipperGroup.userData.baseQuaternion)
      .multiply(rotationDelta);

    const body = flipperGroup.userData.physicsBody;
    const transform = new AmmoLib.btTransform();
    transform.setIdentity();
    transform.setOrigin(
      new AmmoLib.btVector3(
        flipperGroup.position.x,
        flipperGroup.position.y,
        flipperGroup.position.z
      )
    );
    transform.setRotation(
      new AmmoLib.btQuaternion(
        flipperGroup.quaternion.x,
        flipperGroup.quaternion.y,
        flipperGroup.quaternion.z,
        flipperGroup.quaternion.w
      )
    );

    body.getMotionState().setWorldTransform(transform);
    body.setWorldTransform(transform);
    body.activate();
  });
}
