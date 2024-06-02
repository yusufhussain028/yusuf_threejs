import * as THREE from 'three';
import { DragControls } from 'three/examples/jsm/controls/DragControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 10;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let draggingVertex = null;
let vertexSpheres = [];
let lines = [];
let polygonMesh;

const planeGeometry = new THREE.PlaneGeometry(100, 100);
const planeMaterial = new THREE.MeshBasicMaterial({ visible: false });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
scene.add(plane);

function createLine(start, end) {
  const material = new THREE.LineBasicMaterial({ color: 0x0000ff });
  const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
  const line = new THREE.Line(geometry, material);
  scene.add(line);
  lines.push(line);
  return line;
}

function updateLines() {
  for (let i = 0; i < vertexSpheres.length; i++) {
    const start = vertexSpheres[i].position;
    const end = vertexSpheres[(i + 1) % vertexSpheres.length].position;
    lines[i].geometry.setFromPoints([start, end]);
  }
}

function updatePolygon() {
  if (polygonMesh) {
    scene.remove(polygonMesh);
  }

  if (vertexSpheres.length < 3) return;

  let polygonShape = new THREE.Shape();
  polygonShape.moveTo(vertexSpheres[0].position.x, vertexSpheres[0].position.y);
  for (let i = 1; i < vertexSpheres.length; i++) {
    polygonShape.lineTo(vertexSpheres[i].position.x, vertexSpheres[i].position.y);
  }
  polygonShape.lineTo(vertexSpheres[0].position.x, vertexSpheres[0].position.y);

  const polygonGeometry = new THREE.ShapeGeometry(polygonShape);
  const polygonMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
  polygonMesh = new THREE.Mesh(polygonGeometry, polygonMaterial);
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
  draggingVertex = event.object;
  draggingVertex.userData.startPosition = draggingVertex.position.clone();
});

dragControls.addEventListener("drag", function (event) {
  const draggedObject = event.object;
  const index = vertexSpheres.indexOf(draggedObject);
  const originalPosition = draggedObject.userData.startPosition.clone();
  const newPosition = draggedObject.position.clone();

  if (isCrossing(newPosition, index)) {
    draggedObject.position.copy(originalPosition);
  } else {
    updateLines();
    updatePolygon();
  }
});

dragControls.addEventListener("dragend", function (event) {
  draggingVertex = null;
});

window.addEventListener('mousedown', onMouseDown, false);
window.addEventListener('mouseup', onMouseUp, false);
window.addEventListener('mousemove', onMouseMove, false);

function onMouseDown(event) {
  if (draggingVertex) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects([plane]);

  if (intersects.length > 0) {
    const intersect = intersects[0];
    const point = new THREE.Vector3().copy(intersect.point);

    const sphereGeometry = new THREE.SphereGeometry(0.1, 32, 32);
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.copy(point);
    scene.add(sphere);
    vertexSpheres.push(sphere);

    if (vertexSpheres.length > 1) {
      createLine(vertexSpheres[vertexSpheres.length - 2].position, point);
    }
    if (vertexSpheres.length > 2) {
      createLine(vertexSpheres[vertexSpheres.length - 1].position, vertexSpheres[0].position);
      updatePolygon();
    }

    dragControls.getObjects().push(sphere);
  }
}

function onMouseMove(event) {
  if (!draggingVertex || vertexSpheres.length <= 1) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects([plane]);

  if (intersects.length > 0) {
    const intersect = intersects[0];
    const newPosition = intersect.point.clone();

    const index = vertexSpheres.indexOf(draggingVertex);
    const originalPosition = draggingVertex.userData.startPosition.clone();

    if (isCrossing(newPosition, index)) {
      draggingVertex.position.copy(originalPosition);
    } else {
      draggingVertex.position.copy(newPosition);
      updateLines();
      updatePolygon();
    }
  }
}

function onMouseUp(event) {
  draggingVertex = null;
}

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
