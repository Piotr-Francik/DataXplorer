import * as THREE from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Water } from 'three/addons/objects/Water.js';


// ThreeJS Boilerplate
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.append(renderer.domElement);

// Load a cube
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// Add sun
const sun = new THREE.DirectionalLight(0xffffff);
sun.position.set(0, 10, 0);
sun.target.position.set(-5, -5, 5);
scene.add(sun)

// Ambient Light
const light = new THREE.AmbientLight(0x404040); // soft white light
scene.add(light);

// Debug helper
const lightHelper = new THREE.DirectionalLightHelper(sun);
scene.add(lightHelper);

// Load CTD model
const model_loader = new GLTFLoader();

const ctd = (await model_loader.loadAsync('resources/models/CTD.glb')).scene;
ctd.scale.x = 0.1;
ctd.scale.y = 0.1;
ctd.scale.z = 0.1;
scene.add(ctd);

// Skybox
const texture_loader = new THREE.TextureLoader();
const texture = texture_loader.load(
    'resources/images/clear_sky.png',
    () => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        scene.background = texture;
    });


// Camera
camera.position.z = 25;
camera.position.y = 15;
const controls = new OrbitControls(camera, renderer.domElement);

// Fog
scene.fog = new THREE.FogExp2(0x00002f, 0.102);

// Water

const waterGeometry = new THREE.PlaneGeometry(10000, 10000);

var water = new Water(
    waterGeometry,
    {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: new THREE.TextureLoader().load('resources/images/waternormals.jpg', function (texture) {

            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

        }),
        sunDirection: sun.position.clone().normalize(),
        sunColor: 0xffffff,
        waterColor: 0x005e5f,
        distortionScale: 1,
        fog: false,//scene.fog !== undefined,
        alpha: 0.7
    }
);
water.rotation.x = - Math.PI / 2;
water.material.transparent = true
scene.add(water);

function animate() {    
    requestAnimationFrame(animate);

    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    water.material.uniforms['time'].value += 0.005
    surface.material.uniforms['time'].value += 0.005
    controls.update();

    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
}

animate();