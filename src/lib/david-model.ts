import * as THREE from "three";

export const DAVID_MODEL = "/projects/david-sculpture/david.glb";
export const DAVID_POSTER = "/projects/david-sculpture/portrait.png";
export type SculptureFinish = "mixed" | "plaster" | "chrome";

/** Work on owned geometry; the shared GLTF cache remains immutable. */
export function prepareDavid(scene: THREE.Object3D) {
  scene.updateMatrixWorld(true);
  const parts: THREE.BufferGeometry[] = [];
  scene.traverse(object => {
    if (object instanceof THREE.Mesh) parts.push(object.geometry.clone().applyMatrix4(object.matrixWorld));
  });
  if (!parts.length) throw new Error("The sculpture has no mesh geometry.");
  const bounds = new THREE.Box3();
  parts.forEach(part => { part.computeBoundingBox(); bounds.union(part.boundingBox!); });
  const center = bounds.getCenter(new THREE.Vector3()), size = bounds.getSize(new THREE.Vector3());
  const scale = 2.5 / Math.max(size.x, size.y, size.z);
  parts.forEach(part => {
    part.translate(-center.x, -center.y, -center.z);
    if (size.z > size.y) part.rotateX(-Math.PI / 2);
    part.scale(scale, scale, scale); part.translate(0, 1.25, 0);
    part.computeVertexNormals(); part.computeBoundingBox();
  });
  // The sulphur-yellow eye band follows the actual scan, as in the source VJ.
  const probeMaterial = new THREE.MeshBasicMaterial();
  const probes = parts.map(part => new THREE.Mesh(part, probeMaterial));
  probes.forEach(mesh => mesh.updateMatrixWorld());
  const ray = new THREE.Raycaster(), tape = new THREE.PlaneGeometry(2.36, .21, 64, 4);
  const vertices = tape.attributes.position, depth: number[] = [];
  for (let column = 0; column <= 64; column++) {
    let front = -.52;
    for (let row = 0; row <= 4; row++) {
      ray.set(new THREE.Vector3(-1.18 + column * 2.36 / 64, 1.56 + (row / 4 - .5) * .21, 3), new THREE.Vector3(0, 0, -1));
      const hit = ray.intersectObjects(probes, false)[0];
      if (hit) front = Math.max(front, hit.point.z + .045);
    }
    depth.push(front);
  }
  for (let i = 0; i < vertices.count; i++) {
    const column = i % 65;
    vertices.setXYZ(i, vertices.getX(i), vertices.getY(i) + 1.56,
      Math.max(...depth.slice(Math.max(0, column - 2), Math.min(65, column + 3))));
  }
  tape.computeVertexNormals(); probeMaterial.dispose();
  return { parts, tape, dispose: () => { parts.forEach(part => part.dispose()); tape.dispose(); } };
}

export function sculptureMaterial(finish: SculptureFinish) {
  const material = new THREE.MeshPhysicalMaterial({ color: "#e3ded1", roughness: finish === "chrome" ? .2 : .58,
    metalness: finish === "chrome" ? .96 : .08, clearcoat: .32, clearcoatRoughness: .2 });
  if (finish === "mixed") {
    material.onBeforeCompile = shader => {
      shader.vertexShader = "varying vec3 vSculpture;\n" + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvSculpture = position;");
      shader.fragmentShader = "varying vec3 vSculpture;\n" + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace("#include <metalnessmap_fragment>", `#include <metalnessmap_fragment>
        float plated = smoothstep(1.72, 1.84, vSculpture.y + .05*sin(vSculpture.x*14.) + .04*cos(vSculpture.z*16.));
        metalnessFactor = mix(.08, .98, plated);`);
      shader.fragmentShader = shader.fragmentShader.replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>
        roughnessFactor = mix(.58, .19, smoothstep(1.72,1.84,vSculpture.y+.05*sin(vSculpture.x*14.)+.04*cos(vSculpture.z*16.)));`);
    };
    material.customProgramCacheKey = () => "david-plaster-chrome-v1";
  }
  return material;
}
