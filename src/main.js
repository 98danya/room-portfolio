import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Reflector } from "three/addons/objects/Reflector.js";

const canvas = document.querySelector("#experience-canvas");
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

let mirrorMesh;
const scene = new THREE.Scene();

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

/*
const videoElement = document.createElement("video");
videoElement.src = "/textures/video/pixel_loading_bar.mp4";
videoElement.loop = true;
videoElement.muted = true;
videoElement.playsInline = true;
videoElement.autoplay = true;
videoElement.play();

const VideoTexture = new THREE.VideoTexture(videoElement);
VideoTexture.colorSpace = THREE.SRGBColorSpace;
VideoTexture.flipY = false;
*/

loader.load("/models/room-portfolio.glb", (glb) => {
  glb.scene.traverse((child) => {
    if (child.isMesh) {
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
    } else {
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
camera.position.set(18, 12,21);

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.update();
controls.target.set(0, 3, 0)

window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

const render = () => {
  controls.update();

  renderer.render(scene, camera);

  window.requestAnimationFrame(render);
};

render();
