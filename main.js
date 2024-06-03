import * as THREE from 'three';
import { DragControls } from 'three/examples/jsm/controls/DragControls.js';
import { userData } from 'three/examples/jsm/nodes/Nodes.js';

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
} // adding the verices to empty array vertices

const vertexSpheres = vertices.map((vertex) => {
  const sphereGeometry = new THREE.SphereGeometry(0.1, 32, 32);
  const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xf00ff0 });
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  sphere.position.copy(vertex);
  scene.add(sphere);
  return sphere;
}); // styling the vertex point size and color

let polygonShape = new THREE.Shape();
polygonShape.moveTo(vertices[0].x, vertices[0].y);
for (let i = 1; i < vertices.length; i++) {
  polygonShape.lineTo(vertices[i].x, vertices[i].y);
}
polygonShape.lineTo(vertices[0].x, vertices[0].y);
// from 0 to length drawing the line by iterating with loop

const polygonGeometry = new THREE.ShapeGeometry(polygonShape);
const polygonMaterial = new THREE.MeshBasicMaterial({ color: 0xff0f00, side: THREE.DoubleSide });
let polygonMesh = new THREE.Mesh(polygonGeometry, polygonMaterial);
scene.add(polygonMesh);

function updatePolygon() {
  polygonShape = new THREE.Shape();
  polygonShape.moveTo(vertexSpheres[0].position.x, vertexSpheres[0].position.y);
  //move the vertex which is clicked or dragged
  for (let i = 1; i < vertexSpheres.length; i++) {
    polygonShape.lineTo(vertexSpheres[i].position.x, vertexSpheres[i].position.y);
  }
  polygonShape.lineTo(vertexSpheres[0].position.x, vertexSpheres[0].position.y);
  //closed the shape by joining the last vertex to first

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
        // check for non-adjacent line
        if (doLinesIntersect(lines[i][0], lines[i][1], lines[j][0], lines[j][1])) {
          //if intersects
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

  if (o1 !== o2 && o3 !== o4) return true; // if true then the segment intersects

  if (o1 === 0 && onSegment(p1, q1, p2)) return true;
  if (o2 === 0 && onSegment(p1, q2, p2)) return true;
  if (o3 === 0 && onSegment(q1, p1, q2)) return true;
  if (o4 === 0 && onSegment(q1, p2, q2)) return true;
  // to check overlapping and collinear

  return false;
}

function orientation(p, q, r) {
  const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
  //  concept of the cross product in vector mathematics, to get orientation of 2 vector from same point
  if (val === 0) return 0;
  return val > 0 ? 1 : 2;
  //0 for collinear, 1 for clockwise and 2 for anticlockwise
}

function onSegment(p, q, r) {
  return q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) &&
         q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y);
}

const dragControls = new DragControls(vertexSpheres, camera, renderer.domElement);

dragControls.addEventListener("dragstart", function (event) {
  console.log("userData :",event.object.userData);
  event.object.userData.startPosition = event.object.position.clone();
});

dragControls.addEventListener("drag", function (event) {
  console.log("evObj:",event.object);
  const draggedObject = event.object;
  const index = vertexSpheres.indexOf(draggedObject);
  //position of dragged sphere to check which vertex is moved
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
  // called to update the camera position
});
