import * as THREE from "three";

let uniforms, myTex; 

// code from Sky Kim
const container = document.getElementById("myContainer");

// renderer setting
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// create my world (scene)
const scene = new THREE.Scene();

// camera setting
const fov = 90;
const aspect = window.innerWidth / window.innerHeight;
const near = 1;
const far = 500;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.set(0, 0, 20);
camera.up.set(0, 1, 0);
camera.lookAt(0, 0, 0);
camera.matrixAutoUpdate = false;

const myLight = new THREE.DirectionalLight( 0xffffff, 1.0 );
myLight.position.set(0, 0, 100);
myLight.target.position.set( 0, 0, 0 );
myLight.name = "myLight";
scene.add(myLight);

const amLight = new THREE.AmbientLight( 0x404040 ); // soft white light
scene.add( amLight );

// geometry setting
const geometry = new THREE.BufferGeometry();

const indices = [];
const vertices = [];

const uvs = [
      0, 0, 
      0, 0, 
      1, 0, 
      1, 1, 
      1, 0, 
      0, 1, 
      1, 1, 
      0, 0, 
];

vertices.push(-5, 5, -5); // 0
vertices.push(-5, 5, 5); // 1
vertices.push(5, 5, 5); // 2
vertices.push(5, 5, -5); // 3
vertices.push(-5, -5, -5); // 4
vertices.push(-5, -5, 5); // 5
vertices.push(5, -5, 5); // 6
vertices.push(5, -5, -5); // 7

// left
indices.push(1, 0, 5);
indices.push(0, 4, 5);

// right
indices.push(3, 2, 7);
indices.push(2, 6, 7);

// bottom
indices.push(4, 7, 5);
indices.push(7, 6, 5);

// top
indices.push(1, 2, 0);
indices.push(2, 3, 0);

// back
indices.push(0, 3, 4);
indices.push(3, 7, 4);

// front
indices.push(2, 1, 6);
indices.push(1, 5, 6);

geometry.setIndex(indices);
geometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(vertices, 3)
);
geometry.setAttribute(
  "uv",
  new THREE.Float32BufferAttribute(uvs, 2)
);
geometry.computeVertexNormals();

// material setting
//const material = new THREE.MeshBasicMaterial({ wireframe: true });
// const material = new THREE.MeshPhongMaterial( { color: 0xffffff, wireframe: false, flatShading: true } );
const material = new THREE.RawShaderMaterial( {
  uniforms: {//global variable 
    time: { value: 1.0 },
    myTestParam:{calue:1765},  //html에 uniform 추가
    myTestVec3:{value:new THREE.Vector3(0,1,0)},
    myTexImg: {value:myTexture},//이거 안 넣으면 txt Mapping 사진으로 안 됨
    // modelViewMatrix: {value:cube.modelViewMatrix} //built-in
    modelMat: {value: new THREE.Matrix4()},
    myAmb:{value:}
  },
  vertexShader: document.getElementById( 'vertexShader' ).textContent,
  fragmentShader: document.getElementById( 'fragmentShader' ).textContent,
  side: THREE.DoubleSide,
  transparent: true
} );

// https://threejs.org/docs/index.html?q=texture#api/en/textures/Texture 
const textureLoader = new THREE.TextureLoader();
const myTexture = textureLoader.load( './img.jpg' );
material.map = myTexture;

const genCubeUrls = function ( prefix, postfix ) {

    return [
        prefix + 'px' + postfix, prefix + 'nx' + postfix,
        prefix + 'py' + postfix, prefix + 'ny' + postfix,
        prefix + 'pz' + postfix, prefix + 'nz' + postfix
    ];

};
const urls = genCubeUrls( '../textureimg/', '.png' );
const cubeTextureLoader = new THREE.CubeTextureLoader();
const cubeMap = cubeTextureLoader.load(urls);

const envRectMap = textureLoader.load('../cityscape-environment-map-hdri-map-equirectangular-projection-spherical-panorama-77476507.jpg');
envRectMap.mapping = THREE.EquirectangularReflectionMapping;

scene.background = envRectMap;


const cubeGeo = new THREE.BoxGeometry(10, 10, 10);
console.log(cubeGeo.getAttribute('normal'));

const material2 = new THREE.MeshStandardMaterial( { metalness: 1.0,
roughness: 0,
envMapIntensity: 1.0, envMap: envRectMap} );
material.envMap = envRectMap;

// cube model
const cube = new THREE.Mesh(cubeGeo, material); // geometry. 구조: medelViewMatrix: Matrix4. vtxShader에서 매핑
cube.matrixAutoUpdate = false;  
// 원래 자동으로 렌더 시마다 local mtrx 계산하는데 사용자 지정 mtrx 사용하므로 false로 함.matrixWorld가 업데이트 됨
// .position, .qtnr이면 true로
scene.add(cube);  


// add an AxesHelper to scene
scene.add(new THREE.AxesHelper(10));

// render a scene using a camera before drawing the next frame on the screen
renderer.setAnimationLoop(() => {
  cube.updateMatrixWorld(); 
  material.uniforms.modelMat.value=cube.matrixWorld;
  //cube.matrerial
  renderer.render(scene, camera);
});

// the coordinate of the previous mouse pointer
let prevPointer = new THREE.Vector2();

// flags to check if a mouse button is pressed
let isLeftMouseDown = false;
let isRightMouseDown = false;

// whether move the camera or the cube
let moveCamera = false;

// convert the coordinate from screen space to world space
function screenToWorld(x, y) {
  return new THREE.Vector3(
    (x / window.innerWidth) * 2 - 1,
    (-y / window.innerHeight) * 2 + 1,
    -1
  ).unproject(camera);
}

// update the aspect ratio and the size of the renderer's output canvas on window resize
window.onresize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};

// disable contextmenu event
document.oncontextmenu = () => {
  return false;
};

// update the previous mouse pointer coordinate and mouse button flags when mouse button is pressed
document.onmousedown = (e) => {
  prevPointer.x = e.clientX;
  prevPointer.y = e.clientY;
  switch (e.button) {
    case 0:
      isLeftMouseDown = true;
      break;
    case 2:
      isRightMouseDown = true;
      break;
  }
};

// move the camera or the cube when a mouse is moved while the button is pressed
document.onmousemove = (e) => {
  if (isLeftMouseDown || isRightMouseDown) {
    let view = new THREE.Vector3();
    let cameraPosition = new THREE.Vector3();
    let cubePosition = new THREE.Vector3();
    let cameraToCube = new THREE.Vector3();
    let prevToCurr = new THREE.Vector3();

    camera.getWorldDirection(view); // the world space direction in which the camera is looking
    camera.getWorldPosition(cameraPosition); // the position of the camera in world space
    cube.getWorldPosition(cubePosition); // the position of the cube in world space
    cameraToCube.subVectors(cubePosition, cameraPosition); // the world space direction from the camera to the cube

    // convert the coordinate of the mouse pointer from screen space to world space
    let prevPosition = screenToWorld(prevPointer.x, prevPointer.y);
    let currPosition = screenToWorld(e.clientX, e.clientY);

    prevToCurr.subVectors(currPosition, prevPosition); // the world space direction from prevPosition to currPosition

    // the point p: the intersection of the near plane and a line passing through the point cameraPosition and parallel to the vector cameraToCube
    let nearDistance = near / Math.cos(view.angleTo(cameraToCube)); // the distance from camera to the point p on the near plane
    let cubeDistance = cameraToCube.length(); // the distance from camera to cube

    if (isLeftMouseDown) {
      // if a left button is pressed
      let rotationMatrix = new THREE.Matrix4();

      let axis = new THREE.Vector3().crossVectors(prevToCurr, view).normalize(); // compute axis by cross product of prevToCurr and view
      let angle = (Math.PI / 2) * prevToCurr.length(); // compute angle by multiplying length of prevToCurr by the appropriate value

      if (moveCamera) {
        // rotate the camera
        rotationMatrix.makeRotationFromQuaternion(
          new THREE.Quaternion().setFromAxisAngle(axis, -angle)
        ); // set rotationMatrix as rotation transform around axis by negative angle radians

        camera.matrix.premultiply(rotationMatrix); // pre-multipliy camera's local transform matrix by rotationMatrix
      } else {
        // rotate the cube
        rotationMatrix.makeRotationFromQuaternion(
          new THREE.Quaternion().setFromAxisAngle(axis, angle)
        ); // set rotationMatrix as rotation transform around axis by angle radians

        // pre-multiply the rotation component of the cube's local transform matrix by rotationMatrix,
        // then set the position component of the cube's local transform matrix from cubePosition
        cube.matrix
          .extractRotation(cube.matrix)
          .premultiply(rotationMatrix)
          .setPosition(cubePosition);
      }
    } else if (isRightMouseDown) {
      // if a right button is pressed
      let translationMatrix = new THREE.Matrix4();

      let distanceRatio = cubeDistance / nearDistance; // ratio of cubeDistance and nearDistance

      // the amount to translate is determined according to cubePosition
      prevToCurr.multiplyScalar(distanceRatio);

      if (moveCamera) {
        // translate the camera
        translationMatrix.makeTranslation(
          -prevToCurr.x,
          -prevToCurr.y,
          -prevToCurr.z
        );

        camera.matrix.premultiply(translationMatrix); // pre-multipliy camera's local transform matrix by rotationMatrix
      } else {
        // translate the cube
        translationMatrix.makeTranslation(
          prevToCurr.x,
          prevToCurr.y,
          prevToCurr.z
        );

        cube.matrix.premultiply(translationMatrix); // pre-multipliy cube's local transform matrix by rotationMatrix
      }
    }

    // update prevPointer with the current coordinate of the mouse pointer
    prevPointer.x = e.clientX;
    prevPointer.y = e.clientY;
  }
};

// update mouse button flags when mouse button is released
document.onmouseup = () => {
  isLeftMouseDown = false;
  isRightMouseDown = false;
};

// transalte the camera forward and backward with a mouse wheel
document.onwheel = (e) => {
  let translationMatrix = new THREE.Matrix4();

  if (moveCamera) {
    let view = new THREE.Vector3();
    camera.getWorldDirection(view); // the world space direction in which the camera is looking
    view.multiplyScalar(-e.deltaY / 150);

    translationMatrix.makeTranslation(view.x, view.y, view.z);

    camera.matrix.premultiply(translationMatrix); // pre-multipliy camera's local transform matrix by rotationMatrix
  }
};

// press "1" to move the cube and press "2" to move the camera
document.onkeydown = (e) => {
  switch (e.key) {
    case "1":
      moveCamera = false;
      break;
    case "2":
      moveCamera = true;
      break;
  }
};