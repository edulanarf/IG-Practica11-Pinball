export const piedrasData = [
  { modelo: "models/roca1.glb", pos: [-8.5, 1.5, 13.9], scale: 0.5, rotY: 0 },
  { modelo: "models/roca2.glb", pos: [-6.5, 1.5, 15.9], scale: 0.5, rotY: 0 },
  { modelo: "models/roca3.glb", pos: [-7.5, 1.5, 15], scale: 0.5, rotY: 0 },
  {
    modelo: "models/roca3.glb",
    pos: [-9.5, 1.5, 12.6],
    scale: 0.5,
    rotY: -0.6,
  },
  { modelo: "models/roca1.glb", pos: [-7.5, 2, 15.5], scale: 0.5, rotY: 0 },
  { modelo: "models/roca2.glb", pos: [-8.5, 2, 15], scale: 0.5, rotY: 0 },
  { modelo: "models/roca1.glb", pos: [-9.5, 2, 13.6], scale: 0.5, rotY: -0.6 },
  { modelo: "models/roca3.glb", pos: [-8.6, 2.4, 15.5], scale: 0.5, rotY: 0 },
  {
    modelo: "models/roca2.glb",
    pos: [-9.5, 2.5, 14.6],
    scale: 0.5,
    rotY: -0.6,
  },
  { modelo: "models/roca1.glb", pos: [8.5, 1.5, 13.9], scale: 0.5, rotY: 0 },
  { modelo: "models/roca2.glb", pos: [6.5, 1.5, 15.9], scale: 0.5, rotY: 0 },
  { modelo: "models/roca3.glb", pos: [7.5, 1.5, 15], scale: 0.5, rotY: 0 },
  { modelo: "models/roca3.glb", pos: [9.5, 1.5, 12.6], scale: 0.5, rotY: 0.6 },
  { modelo: "models/roca1.glb", pos: [7.5, 2, 15.5], scale: 0.5, rotY: 0 },
  { modelo: "models/roca2.glb", pos: [8.5, 2, 15], scale: 0.5, rotY: 0 },
  { modelo: "models/roca1.glb", pos: [9.5, 2, 13.6], scale: 0.5, rotY: 0.6 },
  { modelo: "models/roca3.glb", pos: [8.6, 2.4, 15.5], scale: 0.5, rotY: 0 },
  { modelo: "models/roca2.glb", pos: [9.5, 2.5, 14.6], scale: 0.5, rotY: 0.6 },
];

export function loadPiedras(loader, scene) {
  piedrasData.forEach((data) => {
    loader.load(data.modelo, (gltf) => {
      const piedra = gltf.scene;
      piedra.scale.set(data.scale, data.scale, data.scale);
      piedra.position.set(...data.pos);
      piedra.rotation.y = data.rotY;
      scene.add(piedra);
    });
  });
}
