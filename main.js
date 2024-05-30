import * as THREE from 'three';
import { DragControls } from 'three/examples/jsm/controls/DragControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 10;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const radius = 2;
const vertices = [];
for (let i = 0; i < 6; i++) {
  const angle = (i / 6) * Math.PI * 2;
  vertices.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0));
}

const vertexSpheres = vertices.map((vertex) => {
  const sphereGeometry = new THREE.SphereGeometry(0.1, 32, 32);
  const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  sphere.position.copy(vertex);
  scene.add(sphere);
  return sphere;
});

let polygonShape = new THREE.Shape();
polygonShape.moveTo(vertices[0].x, vertices[0].y);
for (let i = 1; i < vertices.length; i++) {
  polygonShape.lineTo(vertices[i].x, vertices[i].y);
}
polygonShape.lineTo(vertices[0].x, vertices[0].y);

const polygonGeometry = new THREE.ShapeGeometry(polygonShape);
const polygonMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
let polygonMesh = new THREE.Mesh(polygonGeometry, polygonMaterial);
scene.add(polygonMesh);

function updatePolygon() {
  polygonShape = new THREE.Shape();
  polygonShape.moveTo(vertexSpheres[0].position.x, vertexSpheres[0].position.y);
  for (let i = 1; i < vertexSpheres.length; i++) {
    polygonShape.lineTo(vertexSpheres[i].position.x, vertexSpheres[i].position.y);
  }
  polygonShape.lineTo(vertexSpheres[0].position.x, vertexSpheres[0].position.y);

  scene.remove(polygonMesh);
  polygonGeometry.dispose();
  polygonMesh = new THREE.Mesh(new THREE.ShapeGeometry(polygonShape), polygonMaterial);
  scene.add(polygonMesh);
}

const dragControls = new DragControls(vertexSpheres, camera, renderer.domElement);

dragControls.addEventListener("drag", function (event) {
  updatePolygon();
});

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});
