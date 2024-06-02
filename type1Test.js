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

function isCrossing(newPosition, index) {
  const newPositions = vertexSpheres.map((sphere, i) => (i === index ? newPosition : sphere.position));
  const lines = newPositions.map((pos, i) => [pos, newPositions[(i + 1) % newPositions.length]]);

  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      if (i !== (j + 1) % lines.length && j !== (i + 1) % lines.length) {
        if (doLinesIntersect(lines[i][0], lines[i][1], lines[j][0], lines[j][1])) {
          return true;
        }
      }
    }
  }
  return false;
}

function doLinesIntersect(p1, p2, q1, q2) {
  const o1 = orientation(p1, p2, q1);
  const o2 = orientation(p1, p2, q2);
  const o3 = orientation(q1, q2, p1);
  const o4 = orientation(q1, q2, p2);

  if (o1 !== o2 && o3 !== o4) return true;

  if (o1 === 0 && onSegment(p1, q1, p2)) return true;
  if (o2 === 0 && onSegment(p1, q2, p2)) return true;
  if (o3 === 0 && onSegment(q1, p1, q2)) return true;
  if (o4 === 0 && onSegment(q1, p2, q2)) return true;

  return false;
}

function orientation(p, q, r) {
  const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
  if (val === 0) return 0;
  return val > 0 ? 1 : 2;
}

function onSegment(p, q, r) {
  return q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) &&
         q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y);
}

const dragControls = new DragControls(vertexSpheres, camera, renderer.domElement);

dragControls.addEventListener("dragstart", function (event) {
  event.object.userData.startPosition = event.object.position.clone();
});

dragControls.addEventListener("drag", function (event) {
  const draggedObject = event.object;
  const index = vertexSpheres.indexOf(draggedObject);
  const originalPosition = draggedObject.userData.startPosition.clone();
  const newPosition = draggedObject.position.clone();

  if (isCrossing(newPosition, index)) {
    draggedObject.position.copy(originalPosition);
  } else {
    updatePolygon();
  }
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
