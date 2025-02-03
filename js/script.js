// script.js
import * as THREE from "../three/build/three.module.js";
// ↓ 실제 postprocessing 모듈들도 unpkg 경로로
import { EffectComposer } from "https://unpkg.com/three@0.152.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://unpkg.com/three@0.152.0/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "https://unpkg.com/three@0.152.0/examples/jsm/postprocessing/UnrealBloomPass.js";

// GSAP (전역객체 gsap, ScrollTrigger)는 html의 <script>에서 이미 로드 가정
gsap.registerPlugin(ScrollTrigger);

// 1) Three.js 초기 설정
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x444444);

const camera = new THREE.PerspectiveCamera(
  75, 
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 300;

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 2) EffectComposer 설정 (renderer 필요)
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// BloomPass
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.5,  // strength
  0.4,  // radius
  0.85  // threshold
);
composer.addPass(bloomPass);

// 라이트
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(1, 1, 1).normalize();
scene.add(light);

// 3) DNA 오브젝트 생성
const dnaGroup = new THREE.Group();
scene.add(dnaGroup);

const totalPoints = 40;
const helixRevolution = 2;
const helixHeight = 200;
const radius = 50;

const sphereA = [];
const sphereB = [];

const startColor = new THREE.Color(0xff4933);
const endColor = new THREE.Color(0xffae00);

// 가닥 A
for (let i = 0; i < totalPoints; i++) {
  const t = i / totalPoints;
  const colorA = new THREE.Color().lerpColors(startColor, endColor, t);
  const angle = t * (Math.PI * 2 * helixRevolution);
  const x = Math.cos(angle) * radius;
  const y = (t - 0.5) * helixHeight * 2;
  const z = Math.sin(angle) * radius;

  const geoA = new THREE.SphereGeometry(8, 32, 32);
  const matA = new THREE.MeshStandardMaterial({ color: colorA });
  const meshA = new THREE.Mesh(geoA, matA);
  meshA.position.set(x, y, z);
  
  dnaGroup.add(meshA);
  sphereA.push(meshA);
}

// 가닥 B
for (let i = 0; i < totalPoints; i++) {
  const t = i / totalPoints;
  const colorB = new THREE.Color().lerpColors(startColor, endColor, t);
  const angle = t * (Math.PI * 2 * helixRevolution) + Math.PI;
  const x = Math.cos(angle) * radius;
  const y = (t - 0.5) * helixHeight * 2;
  const z = Math.sin(angle) * radius;

  const geoB = new THREE.SphereGeometry(8, 32, 32);
  const matB = new THREE.MeshStandardMaterial({ color: colorB });
  const meshB = new THREE.Mesh(geoB, matB);
  meshB.position.set(x, y, z);

  dnaGroup.add(meshB);
  sphereB.push(meshB);
}

// 브리지(작은 분자들)
const subCount = 20;
for (let i = 0; i < totalPoints; i++) {
  const t = i / totalPoints;
  const colorC = new THREE.Color().lerpColors(startColor, endColor, t);
  const posA = sphereA[i].position;
  const posB = sphereB[i].position;

  for (let k = 0; k <= subCount; k++) {
    const alpha = k / subCount;
    const pos = new THREE.Vector3().lerpVectors(posA, posB, alpha);

    const geo = new THREE.SphereGeometry(2, 16, 16);
    const mat = new THREE.MeshStandardMaterial({ color: colorC });
    const miniSphere = new THREE.Mesh(geo, mat);
    miniSphere.position.copy(pos);
    dnaGroup.add(miniSphere);
  }
}

// 4) 애니메이션 루프
function animate() {
  requestAnimationFrame(animate);

  //renderer.render(scene, camera);
  composer.render();
}
animate();

// 5) ScrollTrigger 예시: dnaGroup 회전
gsap.to(dnaGroup.rotation, {
  y: 2 * Math.PI,
  scrollTrigger: {
    trigger: ".dna-section",
    start: "top center",
    end: "bottom center",
    scrub: true
  },
  ease: "none"
});

console.log("Three version:", THREE.REVISION);





// 예: each sphere's "pop" effect
dnaSpheres.forEach((sphere, i) => {
  const material = sphere.material; // sphere.material이 MeshStandardMaterial이라고 가정

  // 타임라인 한 개를 만들어서,
  // 1) 스케일 업, 2) 발광, 3) 제자리 복귀, 4) 진동... 등 여러 스텝을 연출
  const tl = gsap.timeline({
    delay: i * 0.2, // i개마다 0.2초씩 늦게 시작 (stagger 느낌)
    repeat: -1,       // 무한 반복
  repeatDelay: 2 
  });

  // (1) 스케일 업 (0.2초)
  tl.to(sphere.scale, { 
    x: 1.5, 
    y: 1.5, 
    z: 1.5, 
    duration: 0.2, 
    ease: "power2.out"
  });

  // (2) 발광: emissiveIntensity를 1로
  tl.to(material, {
    emissiveIntensity: 1, 
    duration: 0.2, 
    ease: "power2.inOut",
  }, "<"); 
  // ↑ "<"는 이전 애니메이션과 "동시에" 시작하겠다는 뜻

  // (3) 살짝 흔들림(진동)
  //    x좌표 기준 +/- 3 정도를 아주 짧게 반복
  tl.to(sphere.position, {
    x: sphere.position.x + 3, 
    duration: 0.05, 
    ease: "power1.inOut", 
    repeat: 5,    // 5번 왕복
    yoyo: true
  });

  // (4) 원상태로 돌리기 (스케일, 발광)
  tl.to(sphere.scale, {
    x: 1,
    y: 1,
    z: 1,
    duration: 0.2,
    ease: "power2.in"
  });
  tl.to(material, {
    emissiveIntensity: 0,
    duration: 0.2,
    ease: "power2.in"
  }, "<");
});

