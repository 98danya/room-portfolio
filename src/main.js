import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "./utils/OrbitControls";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Reflector } from "three/addons/objects/Reflector.js";
import { gsap } from "gsap";

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";

const canvas = document.querySelector("#experience-canvas");
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

let currentMode = "day";
const scene = new THREE.Scene();

const clickableSigns = [
  "Sign_AboutMe_First",
  "Sign_Projects_First",
  "Sign_ContactMe_First",
];
const raycasterObjects = [];

let currentIntersects = [];

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/");

const manager = new THREE.LoadingManager();
const loader = new GLTFLoader(manager);
const textureLoader = new THREE.TextureLoader(manager);
loader.setDRACOLoader(dracoLoader);

const textureMap = {
  Background: {
    day: "/textures/day/Background_Day.webp",
    night: "/textures/night/Background_Night.webp",
  },
  First: {
    day: "/textures/day/First_Day.webp",
    night: "/textures/night/First_Night.webp",
  },
  Second: {
    day: "/textures/day/Second_Day.webp",
    night: "/textures/night/Second_Night.webp",
  },
};

const loadedTextures = {
  background: {},
  day: {},
  night: {},
};

let lpMesh = null;
let toneArmMesh = null;
let currentHoveredObject = null;
let chairMesh = null;

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

// Posters related

const posterTwoTexture = textureLoader.load("/textures/posters/poster2.jpg");
posterTwoTexture.flipY = false;
posterTwoTexture.colorSpace = THREE.SRGBColorSpace;

const posterThirdTexture = textureLoader.load("/textures/posters/poster3.jpg");
posterThirdTexture.flipY = false;
posterThirdTexture.colorSpace = THREE.SRGBColorSpace;
*/

/**  -------------------------- Modal Stuff -------------------------- */
const modals = {
  aboutme: document.querySelector(".aboutme-modal"),
  projects: document.querySelector(".projects-modal"),
  contactme: document.querySelector(".contactme-modal"),
};

const overlay = document.querySelector(".overlay");

let touchHappened = false;
overlay.addEventListener(
  "touchend",
  (e) => {
    touchHappened = true;
    e.preventDefault();
    const modal = document.querySelector('.modal[style*="display: block"]');
    if (modal) hideModal(modal);
  },
  { passive: false }
);

overlay.addEventListener(
  "click",
  (e) => {
    if (touchHappened) return;
    e.preventDefault();
    const modal = document.querySelector('.modal[style*="display: block"]');
    if (modal) hideModal(modal);
  },
  { passive: false }
);

window.addEventListener("mousemove", (event) => {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener("touchmove", (event) => {
  const touch = event.touches[0];
  pointer.x = (touch.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(touch.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener("click", (event) => {
  if (isModalOpen) return;

  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(raycasterObjects, true);

  if (intersects.length > 0) {
    const clickedObject = intersects[0].object;
    const name = clickedObject.name;

    if (name.includes("Sign_AboutMe_First")) {
      showModal(modals.aboutme);
    } else if (name.includes("Sign_Projects_First")) {
      showModal(modals.projects);
    } else if (name.includes("Sign_ContactMe_First")) {
      if (modals.contactme) {
        showModal(modals.contactme);
      } else {
        console.error("Contact modal is missing from DOM.");
      }
    }
  }
});

document.querySelectorAll(".modal-exit-button").forEach((button) => {
  button.addEventListener("click", (e) => {
    e.preventDefault();
    hideModal(e.target.closest(".modal"));
  });
});

window.addEventListener("touchend", (event) => {
  if (isModalOpen) return;
  touchHappened = true;

  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(raycasterObjects, true);

  if (intersects.length > 0) {
    const clickedObject = intersects[0].object;
    const name = clickedObject.name;

    if (name.includes("Sign_AboutMe_First")) {
      showModal(modals.aboutme);
    } else if (name.includes("Sign_Projects_First")) {
      showModal(modals.projects);
    } else if (name.includes("Sign_ContactMe_First")) {
      showModal(modals.contactme);
    }
  }
});

document.querySelectorAll(".modal-exit-button").forEach((button) => {
  function handleModalExit(e) {
    e.preventDefault();
    const modal = e.target.closest(".modal");

    gsap.to(button, {
      scale: 5,
      duration: 0.5,
      ease: "back.out(2)",
      onStart: () => {
        gsap.to(button, {
          scale: 1,
          duration: 0.5,
          ease: "back.out(2)",
          onComplete: () => {
            gsap.set(button, {
              clearProps: "all",
            });
          },
        });
      },
    });

    hideModal(modal);
  }

  button.addEventListener(
    "touchend",
    (e) => {
      touchHappened = true;
      handleModalExit(e);
    },
    { passive: false }
  );

  button.addEventListener(
    "click",
    (e) => {
      if (touchHappened) return;
      handleModalExit(e);
    },
    { passive: false }
  );
});

let isModalOpen = false;

const showModal = (modal) => {
  console.log("Showing modal:", modal);
  modal.style.display = "block";
  overlay.style.display = "block";

  if (modal === modals.contactme) {
    const form = modal.querySelector('#contact-form');
    const successMessage = modal.querySelector('#form-success');
    const title = modal.querySelector('.form-title');

    if (form && successMessage && title) {
      form.style.display = 'block';
      successMessage.style.display = 'none';
      title.style.display = 'block';
    }
  }

  if (modal) {
    gsap.to(modal, {
      opacity: 1,
      scale: 1,
      duration: 0.5,
      ease: "back.out(2)",
    });
  } else {
    console.warn("Modal is null – cannot animate.");
  }
  isModalOpen = true;
  controls.enabled = false;
};

const hideModal = (modal) => {
  isModalOpen = false;
  controls.enabled = true;

    if (modal === modals.contactme) {
    const form = modal.querySelector('#contact-form');
    const successMessage = modal.querySelector('#form-success');
    const title = modal.querySelector('.form-title');

    if (form && successMessage && title) {
      form.style.display = 'block';
      title.style.display = 'block';
      successMessage.style.display = 'none';
      form.reset();
    }
  }

  gsap.to(overlay, {
    opacity: 0,
    duration: 0.5,
    onComplete: () => {
      overlay.style.display = "none";
    },
  });
  if (modal) {
    gsap.to(modal, {
      opacity: 0,
      scale: 0,
      duration: 0.5,
      ease: "back.in(2)",
      onComplete: () => {
        modal.style.display = "none";
      },
    });
  } else {
    console.warn("Modal is null – cannot animate.");
  }
};

function toggleToTools() {
  document.getElementById("aboutme-content").classList.add("hidden");
  document.getElementById("tools-content").classList.remove("hidden");
}

function toggleToAbout() {
  document.getElementById("tools-content").classList.add("hidden");
  document.getElementById("aboutme-content").classList.remove("hidden");
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('contact-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const form = e.target;
    const data = new FormData(form);

    fetch('https://formspree.io/f/mqaqdqeb', {
      method: 'POST',
      headers: {
        'Accept': 'application/json'
      },
      body: data
    }).then(response => {
      if (response.ok) {
        form.reset();
            document.querySelector('.form-title').style.display = 'none'; 
        document.getElementById('form-success').style.display = 'block';
        form.style.display = 'none';
      } else {
        alert('Oops! Something went wrong.');
      }
    }).catch(error => {
      alert('There was a problem sending your message.');
    });
  });
  document
    .querySelector(".folder-icon")
    ?.addEventListener("click", toggleToTools);
  document
    .querySelector(".return-button")
    ?.addEventListener("click", toggleToAbout);

  function cycleImages(imgElementId, sources, durations) {
    const element = document.getElementById(imgElementId);
    if (!element) return;

    let index = 0;

    function cycle() {
      element.src = sources[index] + "?t=" + Date.now();

      setTimeout(() => {
        index = (index + 1) % sources.length;
        cycle();
      }, durations[index]);
    }

    cycle();
  }

  cycleImages(
    "battleship-gif",
    [
      "/projects/battleship-1.gif",
      "/projects/battleship-2.gif",
      "/projects/battleship-3.gif",
    ],
    [4000, 5000, 4500]
  );

  cycleImages(
    "memory-gif",
    [
      "/projects/memory.gif"
    ],
    [15000]
  );

   cycleImages(
    "blog-gif",
    [
      "/projects/blog-1.gif",
      "/projects/blog-2.gif"
    ],
    [40000, 20000]
  );

    cycleImages(
    "cv-gif",
    [
      "/projects/cv.gif"
    ],
    [30000]
  );

});


function handleCursorAndHover() {
  raycaster.setFromCamera(pointer, camera);
  currentIntersects = raycaster.intersectObjects(raycasterObjects, true);

  let hoveringClickable = false;

  if (currentIntersects.length > 0) {
    const intersected = currentIntersects[0].object;

    if (clickableSigns.includes(intersected.name) && intersected.visible) {
      hoveringClickable = true;

      if (!intersected.userData.isHovered) {
        intersected.userData.isHovered = true;
        playRaycasterAnimation(intersected, true);
      }
    } else {
      raycasterObjects.forEach((obj) => {
        if (obj.userData.isHovered) {
          obj.userData.isHovered = false;
          playRaycasterAnimation(obj, false);
        }
      });
    }
  } else {
    raycasterObjects.forEach((obj) => {
      if (obj.userData.isHovered) {
        obj.userData.isHovered = false;
        playRaycasterAnimation(obj, false);
      }
    });
  }

  document.body.style.cursor = hoveringClickable ? "pointer" : "default";
}


function handleRaycasterInteraction() {
  if (currentIntersects.length > 0) {
    const object = currentIntersects[0].object;
    if (object.name.includes("Raycaster")) {
      playRaycasterAnimation(object, true);
    }
  }
}

/**  -------------------------- Day/Night Mode and Loading Screen -------------------------- */
const createBlendedMaterial = (dayTexture, nightTexture) => {
  return new THREE.ShaderMaterial({
    uniforms: {
      uDayTexture: { value: dayTexture },
      uNightTexture: { value: nightTexture },
      uMixRatio: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uDayTexture;
      uniform sampler2D uNightTexture;
      uniform float uMixRatio;
      varying vec2 vUv;

      void main() {
        vec4 dayColor = texture2D(uDayTexture, vUv);
        vec4 nightColor = texture2D(uNightTexture, vUv);
vec4 mixedColor = mix(dayColor, nightColor, smoothstep(0.0, 1.0, uMixRatio));

        mixedColor.rgb = pow(mixedColor.rgb, vec3(1.0 / 2.2));

        gl_FragColor = mixedColor;
      }
    `,
    transparent: true,
  });
};

const geometry = new THREE.BoxGeometry(1, 1, 1);
geometry.computeVertexNormals();

const loadingScreen = document.querySelector(".loading-screen");
const loadingScreenButton = document.querySelector(".loading-screen-button");
const desktopInstructions = document.querySelector(".desktop-instructions");
const mobileInstructions = document.querySelector(".mobile-instructions");
const loadingBar = document.getElementById("loading-bar");
const loadingBarContainer = document.querySelector(".loading-bar-container");

manager.onProgress = function (url, itemsLoaded, itemsTotal) {
  const progress = (itemsLoaded / itemsTotal) * 100;
  loadingBar.style.width = `${progress}%`;
};
manager.onLoad = function () {
  loadingScreenButton.style.border = "8px solid #ce8393";
  loadingScreenButton.style.background = "#deadbc";
  loadingScreenButton.style.color = "#e6dede";
  loadingScreenButton.style.boxShadow = "rgba(0, 0, 0, 0.24) 0px 3px 8px";
  loadingScreenButton.textContent = "Enter!";
  loadingBar.style.display = "none";
  loadingBarContainer.style.display = "none";
  loadingScreenButton.style.cursor = "pointer";
  loadingScreenButton.style.transition =
    "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)";
  let isDisabled = false;

  function handleEnter() {
    if (isDisabled) return;

    loadingScreenButton.style.cursor = "default";
    loadingScreenButton.style.border = "8px solid #ce8393";
    loadingScreenButton.style.background = "#deadbc";
    loadingScreenButton.style.color = "#ce8393";
    loadingScreenButton.style.boxShadow = "none";
    loadingScreenButton.textContent = "Welcome to Danya's Portfolio";
    loadingScreen.style.background = "#deadbc";
    isDisabled = true;
    playReveal();
  }

  loadingScreenButton.addEventListener("mouseenter", () => {
    loadingScreenButton.style.transform = "scale(1.3)";
  });

  loadingScreenButton.addEventListener("touchend", (e) => {
    touchHappened = true;
    e.preventDefault();
    handleEnter();
  });

  loadingScreenButton.addEventListener("click", (e) => {
    if (touchHappened) return;
    handleEnter();
  });

  loadingScreenButton.addEventListener("mouseleave", () => {
    loadingScreenButton.style.transform = "none";
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      handleEnter();
    }
  });
};

function playReveal() {
  const tl = gsap.timeline();

  tl.to(loadingScreen, {
    scale: 0.5,
    duration: 1.2,
    delay: 0.25,
    ease: "back.in(1.8)",
  }).to(
    loadingScreen,
    {
      y: "200vh",
      transform: "perspective(1000px) rotateX(45deg) rotateY(-35deg)",
      duration: 1.2,
      ease: "back.in(1.8)",
      onComplete: () => {
        isModalOpen = false;
        loadingScreen.remove();
      },
    },
    "-=0.3"
  );
}

/**  -------------------------- GLB Model -------------------------- */

loader.load("/models/danya_portfolio.glb", (glb) => {
  if (!glb || !glb.scene) {
    console.error("GLB file loaded but contains no scene.");
    return;
  }
  console.log(glb.scene);
  glb.scene.traverse((child) => {
    if (child.isMesh) {
      child.geometry.computeVertexNormals();

      if (
        (child.name.includes("Raycaster") || child.name.includes("Sign_")) &&
        !child.name.includes("Chair")
      ) {
        raycasterObjects.push(child);

        child.userData.initialScale = new THREE.Vector3().copy(child.scale);
        child.userData.initialRotation = new THREE.Vector3().copy(
          child.rotation
        );
        child.userData.initialPosition = new THREE.Vector3().copy(
          child.position
        );
      }
      /*
      if (child.name.includes("Poster_2")) {
        child.material = new THREE.MeshBasicMaterial({ map: posterTwoTexture });
        child.material.map.minFilter = THREE.LinearFilter;
      }
      if (child.name.includes("Poster_3")) {
        child.material = new THREE.MeshBasicMaterial({ map: posterThirdTexture });
        child.material.map.minFilter = THREE.LinearFilter;
      }
        */


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
      if (child.name === "Lamp_1_Stick" || child.name === "Lamp_2_Stick") {
        const light = new THREE.PointLight(0xffffcc, 1, 10);
        light.position.copy(child.getWorldPosition(new THREE.Vector3()));
        scene.add(light);

        child.material = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0xffffcc,
          emissiveIntensity: 2,
        });
      }
      if (child.name.includes("Recordplayer_LP")) {
        lpMesh = child;
        lpMesh.flipY = false;
      }
      if (child.name.includes("Recordplayer_ToneArm")) {
        toneArmMesh = child;

        toneArmMesh.userData.initialRotationZ = child.rotation.z;

        gsap.to(toneArmMesh.rotation, {
          z: toneArmMesh.rotation.z + 0.05,
          duration: 5,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      }
      if (child.name.includes("Chair")) {
        chairMesh = child;

        gsap.to(chairMesh.rotation, {
          y: "+=0.3",
          duration: 2,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      }

      Object.keys(textureMap).forEach((key) => {
        if (child.name.includes(key)) {
          const dayMat = new THREE.MeshBasicMaterial({
            map: loadedTextures.day[key],
            transparent: true,
            opacity: currentMode === "day" ? 1 : 0,
          });

          const nightMat = new THREE.MeshBasicMaterial({
            map: loadedTextures.night[key],
            transparent: true,
            opacity: currentMode === "night" ? 1 : 0,
          });

          child.material = createBlendedMaterial(
            loadedTextures.day[key],
            loadedTextures.night[key]
          );
          child.userData.material = child.material;
        }

        

      });
    }
    child.renderOrder = 1;

    scene.add(glb.scene);
  });
});

/**  -------------------------- Day/Night Mode Button Toggle and Camera Settings -------------------------- */

const toggleButton = document.getElementById("mode-toggle");
toggleButton.addEventListener("click", () => {
  currentMode = currentMode === "day" ? "night" : "day";
  const sunIcon = toggleButton.querySelector(".sun-icon");
  const moonIcon = toggleButton.querySelector(".moon-icon");

  sunIcon.classList.toggle("hidden", currentMode === "night");
  moonIcon.classList.toggle("hidden", currentMode === "day");

  toggleButton.classList.toggle("light-mode", currentMode === "day");
toggleButton.classList.toggle("night-mode", currentMode === "night");

document.body.classList.toggle("dark-mode", currentMode === "night");
document.body.classList.toggle("light-mode", currentMode === "day");
  const isNightMode = currentMode === "night";

document.getElementById("github-icon").src =
  currentMode === "day"
    ? "images/github-day.svg"
    : "images/github-night.svg";

document.getElementById("linkedin-icon").src =
  currentMode === "day"
    ? "images/linkedin-day.svg"
    : "images/linkedin-night.svg";

  scene.traverse((child) => {
    if (
      child.userData.material &&
      child.userData.material.uniforms?.uMixRatio
    ) {
      gsap.to(child.userData.material.uniforms.uMixRatio, {
        value: isNightMode ? 1 : 0,
        duration: 1.5,
        ease: "power2.inOut",
      });
    }

    if (child.isMesh && child.userData.materials) {
      const { day, night } = child.userData.materials;

      if (day && night) {
        child.material = currentMode === "day" ? day : night;
        gsap.to(day, { opacity: currentMode === "day" ? 1 : 0, duration: 1 });
        gsap.to(night, { opacity: currentMode === "day" ? 0 : 1, duration: 1 });
      }
    }
  });
});

toggleButton.addEventListener("mouseover", () => {
  document.body.style.cursor = "pointer";
});
toggleButton.addEventListener("mouseout", () => {
  document.body.style.cursor = "default";
});

const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.1,
  1000
);
camera.position.set(20, 12, 28);

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  logarithmicDepthBuffer: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

Object.entries(textureMap).forEach(([key, paths]) => {
  const dayTexture = textureLoader.load(paths.day);
  dayTexture.flipY = false;
  dayTexture.colorSpace = THREE.SRGBColorSpace;
  dayTexture.minFilter = THREE.LinearFilter;
  dayTexture.magFilter = THREE.LinearFilter;
  dayTexture.generateMipmaps = false;
  dayTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  dayTexture.wrapS = THREE.RepeatWrapping;
  dayTexture.wrapT = THREE.RepeatWrapping;

  loadedTextures.day[key] = dayTexture;

  const nightTexture = textureLoader.load(paths.night);
  nightTexture.flipY = false;
  nightTexture.colorSpace = THREE.SRGBColorSpace;
  nightTexture.minFilter = THREE.LinearMipMapLinearFilter;
  nightTexture.magFilter = THREE.LinearFilter;
  nightTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  nightTexture.wrapS = THREE.RepeatWrapping;
  nightTexture.wrapT = THREE.RepeatWrapping;
  loadedTextures.night[key] = nightTexture;
});

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const fxaaPass = new ShaderPass(FXAAShader);
fxaaPass.material.uniforms["resolution"].value.set(
  1 / window.innerWidth,
  1 / window.innerHeight
);
composer.addPass(fxaaPass);

const controls = new OrbitControls(camera, renderer.domElement);
controls.minDistance = 5;
controls.maxDistance = 50;
controls.minPolarAngle = 0;
controls.maxPolarAngle = Math.PI / 2;
controls.minAzimuthAngle = 0;
controls.maxAzimuthAngle = Math.PI / 2;

controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.update();
controls.target.set(0, 3, 0);
controls.update();

/**  -------------------------- Raycaster Stuff and Clickable Signs -------------------------- */

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
      y: object.userData.initialRotation.y + Math.PI / 32,
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

let toneArmTime = 0;

canvas.addEventListener("click", (event) => {
  if (isModalOpen) return;

  const mouse = new THREE.Vector2(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1
  );

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(raycasterObjects);

  if (intersects.length === 0) return;

  const signClicked = intersects.find((obj) =>
    clickableSigns.includes(obj.object.name)
  );
  console.log(
    signClicked ? signClicked.object.name : "No clickable sign clicked"
  );

  if (!signClicked) return;

  const clickedName = signClicked.object.name;

  signClicked.object.visible = true;

  if (clickedName === "Sign_AboutMe_First") {
    showModal(modals.aboutme);
  } else if (clickedName === "Sign_Projects_First") {
    showModal(modals.projects);
  } else if (clickedName === "Sign_ContactMe_First") {
    showModal(modals.contactme);
  }
});
/**  -------------------------- Render Stuff -------------------------- */

const render = () => {
  controls.update();

  if (lpMesh) {
    lpMesh.rotation.y += 0.08;
  }

  if (toneArmMesh) {
    toneArmTime += 0.04;
    toneArmMesh.rotation.z = Math.sin(toneArmTime) * 0.02;
  }

  raycaster.setFromCamera(pointer, camera);
  currentIntersects = raycaster.intersectObjects(raycasterObjects);

  handleCursorAndHover();

  if (currentIntersects.length > 0) {
    const hovered = currentIntersects[0].object;

    if (hovered.name.includes("Raycaster")) {
      if (!hovered.userData.isHovered) {
        hovered.userData.isHovered = true;
        playRaycasterAnimation(hovered, true);
      }
      document.body.style.cursor = "default";
    } else if (
      hovered.name.includes("Sign_AboutMe") ||
      hovered.name.includes("Sign_Projects") ||
      hovered.name.includes("Sign_ContactMe")
    ) {
      if (!hovered.userData.isHovered) {
        hovered.userData.isHovered = true;
        playRaycasterAnimation(hovered, true);
      }
      document.body.style.cursor = "pointer";
    } else {
      document.body.style.cursor = "default";
    }
  } else {
    raycasterObjects.forEach((obj) => {
      if (obj.userData.isHovered) {
        obj.userData.isHovered = false;
        playRaycasterAnimation(obj, false);
      }
    });
    document.body.style.cursor = "default";
  }

  //renderer.render
  composer.render();
  requestAnimationFrame(render);
};

render();

const slides = document.querySelectorAll(".slide");
const prevBtn = document.querySelector(".slide-btn.prev");
const nextBtn = document.querySelector(".slide-btn.next");

let currentSlide = 0;

function updateSlide(index) {
  slides.forEach((slide, i) => {
    slide.classList.toggle("active", i === index);
  });
}

prevBtn.addEventListener("click", () => {
  currentSlide = (currentSlide - 1 + slides.length) % slides.length;
  updateSlide(currentSlide);
});

nextBtn.addEventListener("click", () => {
  currentSlide = (currentSlide + 1) % slides.length;
  updateSlide(currentSlide);
});

