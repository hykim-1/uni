// script.js
import * as THREE from "https://unpkg.com/three@0.152.0/build/three.module.js";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
// ...
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.5,  // strength
  0.4,  // radius
  0.85  // threshold
);
composer.addPass(bloomPass);

// gsap, ScrollTrigger 불러오기
gsap.registerPlugin(ScrollTrigger);

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x444444); 


const camera = new THREE.PerspectiveCamera(
  75, // 시야각
  window.innerWidth / window.innerHeight, // 종횡비
  0.1, // 근접 절단면
  1000 // 원거리 절단면
);
camera.position.z = 300; // 카메라 뒤로 약간 물러나 있는 상태

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const container = document.getElementById('dna-canvas-container');
container.appendChild(renderer.domElement);

// C) 라이트 추가(기본광, 방향광 등)
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(1, 1, 1).normalize();
scene.add(light);

const dnaGroup = new THREE.Group(); 
scene.add(dnaGroup);

const totalPoints = 40;
const helixRevolution = 2;   // 2바퀴 회전
const helixHeight = 200;     // 나선 높이
const radius = 50;           // 나선의 반경
// 먼저 전역 범위에 배열 선언
const dnaSpheres = [];

const sphereA = [];
const sphereB = [];

const startColor = new THREE.Color(0xff4933); // 붉은 계열
const endColor   = new THREE.Color(0xffae00); // 오렌지 계열


// [1] 가닥 A 생성
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

// [2] 가닥 B 생성
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

const subCount = 20; // 분할 개수 (작은 분자 갯수)

// 브리지 생성 for문
for (let i = 0; i < totalPoints; i++) {
  const t = i / totalPoints;
  const colorC = new THREE.Color().lerpColors(startColor, endColor, t);
  const posA = sphereA[i].position;
  const posB = sphereB[i].position;

  // subCount+1개 점을 찍어, 0%, 10%, 20% ... 100% 지점
  for (let k = 0; k <= subCount; k++) {
    const alpha = k / subCount; // 0~1

    // 보간 위치
    const pos = new THREE.Vector3().lerpVectors(posA, posB, alpha);

    // 작은 Sphere
    const miniRadius = 2;  // 브리지 구체의 반지름 (원하는 크기)
    const geometry = new THREE.SphereGeometry(miniRadius, 16, 16);
    const material = new THREE.MeshStandardMaterial({ color: colorC });
    const miniSphere = new THREE.Mesh(geometry, material);

    miniSphere.position.copy(pos);

    dnaGroup.add(miniSphere);
  }
}



function animate() {
  requestAnimationFrame(animate);
  
  // dnaGroup.rotation.y += 0.01; // 자동 회전(테스트용)
  
  renderer.render(scene, camera);
  composer.render();
}
animate();



// "회전" 애니메이션
gsap.to(dnaGroup.rotation, {
  y: 2 * Math.PI, // 2π = 360도
  scrollTrigger: {
    trigger: ".dna-section",  // 스크롤 트리거가 될 섹션/요소
    start: "top center",
    end: "bottom center",
    scrub: true,
  
  },
  ease: "none"
});



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

