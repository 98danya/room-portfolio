import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "./utils/OrbitControls";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Reflector } from "three/addons/objects/Reflector.js";
import { gsap } from "gsap";

const canvas = document.querySelector("#experience-canvas");
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

let mirrorMesh;
const scene = new THREE.Scene();

const raycasterObjects = [];
let currentIntersects = [];

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const textureLoader = new THREE.TextureLoader();

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/");

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

const textureMap = {
  First: {
    day: "/textures/LightMode_Texture.webp",
    night: "/textures/DarkMode_Texture.webp",
  },
};

const loadedTextures = {
  day: {},
  night: {},
};

let lpMesh = null;

Object.entries(textureMap).forEach(([key, paths]) => {
  const dayTexture = textureLoader.load(paths.day);
  dayTexture.flipY = false;
  dayTexture.colorSpace = THREE.SRGBColorSpace;
  loadedTextures.day[key] = dayTexture;

  const nightTexture = textureLoader.load(paths.night);
  nightTexture.flipY = false;
  nightTexture.colorSpace = THREE.SRGBColorSpace;
  loadedTextures.night[key] = nightTexture;
});

const posterOneTexture = textureLoader.load("/textures/posters/poster1.jpg");
posterOneTexture.flipY = false;
posterOneTexture.colorSpace = THREE.SRGBColorSpace;

const posterTwoTexture = textureLoader.load("/textures/posters/poster2.jpg");
posterTwoTexture.flipY = false;
posterTwoTexture.colorSpace = THREE.SRGBColorSpace;

const posterThirdTexture = textureLoader.load("/textures/posters/poster3.jpg");
posterThirdTexture.flipY = false;
posterThirdTexture.colorSpace = THREE.SRGBColorSpace;

window.addEventListener("mousemove", (e) => {
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener(
  "touchstart",
  (e) => {
    e.preventDefault();
    pointer.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
  },
  { passive: false }
);

window.addEventListener(
  "touchend",
  (e) => {
    e.preventDefault();
    handleRaycasterInteraction;
  },
  { passive: false }
);

function handleRaycasterInteraction() {
  if (currentIntersects.length > 0) {
    const object = currentIntersects[0].object;
    if (object.name.includes("Raycaster")) {
      playRaycasterAnimation(object, true);
    }
  }
}

loader.load("/models/room-portfolio.glb", (glb) => {
  if (!glb || !glb.scene) {
    console.error("GLB file loaded but contains no scene.");
    return;
  }
  glb.scene.traverse((child) => {
    if (child.isMesh) {
      if (child.name.includes("Raycaster")) {
        raycasterObjects.push(child);
        child.userData.initialScale = new THREE.Vector3().copy(child.scale);
        child.userData.initialRotation = new THREE.Vector3().copy(
          child.rotation
        );
        child.userData.initialPosition = new THREE.Vector3().copy(
          child.position
        );
      }
      if (child.name.includes("Poster_1")) {
        child.material = new THREE.MeshBasicMaterial({ map: posterOneTexture });
        child.material.map.minFilter = THREE.LinearFilter;
      }
      if (child.name.includes("Poster_2")) {
        child.material = new THREE.MeshBasicMaterial({ map: posterTwoTexture });
        child.material.map.minFilter = THREE.LinearFilter;
      }
      if (child.name.includes("Poster_3")) {
        child.material = new THREE.MeshBasicMaterial({ map: posterThirdTexture });
        child.material.map.minFilter = THREE.LinearFilter;
      }
      if (child.name.includes("Mirror")) {
        const mirrorGeo = child.geometry;
        const mirrorPos = child.position.clone();
        const mirrorRot = child.rotation.clone();
        const mirrorScale = child.scale.clone();

        child.parent?.remove(child);

        const reflector = new Reflector(mirrorGeo, {
          clipBias: 0.003,
          textureWidth: sizes.width * window.devicePixelRatio,
          textureHeight: sizes.height * window.devicePixelRatio,
          color: 0x889999,
          side: THREE.DoubleSide,
        });

        reflector.position.copy(mirrorPos);
        reflector.rotation.copy(mirrorRot);
        reflector.scale.copy(mirrorScale);

        scene.add(reflector);
      }
      if (child.name.includes("Recordplayer_LP")) {
        lpMesh = child;
        lpMesh.flipY = false;
      }

      Object.keys(textureMap).forEach((key) => {
        if (child.name.includes(key)) {
          const material = new THREE.MeshBasicMaterial({
            map: loadedTextures.day[key],
          });

          child.material = material;

          if (child.material.map) {
            child.material.map.minFilter = THREE.LinearFilter;
          }
        }
      });
    }

    scene.add(glb.scene);
  });
});

const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.1,
  1000
);
camera.position.set(18, 12, 21);

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const controls = new OrbitControls(camera, renderer.domElement);
controls.minDistance = 5;
controls.maxDistance = 50;
controls.minPolarAngle = 0;
controls.maxPolarAngle = Math.PI / 2;
controls.minAzimuthAngle = 0;
controls.maxAzimuthAngle = Math.PI /2;

controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.update();
controls.target.set(0, 3, 0);

window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

function playRaycasterAnimation(object, isRaycastering) {
  let scale = 1.1;
  gsap.killTweensOf(object.scale);
  gsap.killTweensOf(object.rotation);
  gsap.killTweensOf(object.position);

  if (isRaycastering) {
    gsap.to(object.scale, {
      x: object.userData.initialScale.x * scale,
      y: object.userData.initialScale.y * scale,
      z: object.userData.initialScale.z * scale,
      duration: 0.5,
      ease: "back.out(2)",
    });

    gsap.to(object.rotation, {
      y: object.userData.initialRotation.y + Math.PI / 16, 
      duration: 0.5,
      ease: "power2.out",
    });
  } else {
    gsap.to(object.scale, {
      x: object.userData.initialScale.x,
      y: object.userData.initialScale.y,
      z: object.userData.initialScale.z,
      duration: 0.3,
      ease: "bounce.out(1.8)",
    });

    gsap.to(object.rotation, {
      y: object.userData.initialRotation.y,
      duration: 0.3,
      ease: "power2.out",
    });
  }
}

const render = () => {
  controls.update();

  if (lpMesh) {
    lpMesh.rotation.y += 0.08;
  }

  raycaster.setFromCamera(pointer, camera);
  currentIntersects = raycaster.intersectObjects(raycasterObjects);

  if (currentIntersects.length > 0) {
    const hovered = currentIntersects[0].object;

    if (hovered.name.includes("Raycaster")) {
      if (!hovered.userData.isHovered) {
        hovered.userData.isHovered = true;
        playRaycasterAnimation(hovered, true);
      }
    }

    document.body.style.cursor = "pointer";
  } else {
    raycasterObjects.forEach((obj) => {
      if (obj.userData.isHovered) {
        obj.userData.isHovered = false;
        playRaycasterAnimation(obj, false);
      }
    });

    document.body.style.cursor = "default";
  }

  renderer.render(scene, camera);
  window.requestAnimationFrame(render);
};

render();
