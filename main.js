import * as THREE from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Water } from 'three/addons/objects/Water.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// ThreeJS Boilerplate
const overwater = new THREE.Scene();
const underwater = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.append(renderer.domElement);

// Underwater Buffer

const underwater_buffer = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
const overwater_buffer = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);


const waterCompositeShader = {
    uniforms: {
        tDiffuse: { value: null },
        tAbove: { value: overwater_buffer.texture },
        tUnder: { value: underwater_buffer.texture },
        projectionMatrixInverse: { value: camera.projectionMatrixInverse },
        viewMatrixInverse: { value: camera.matrixWorld },
        time: { value: 0 }
    },
    vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `,
    fragmentShader: `
    uniform sampler2D tAbove;
    uniform sampler2D tUnder;
    uniform mat4 projectionMatrixInverse;
    uniform mat4 viewMatrixInverse;
    varying vec2 vUv;

    vec3 getNearPlanePosition(vec2 uv) {
        vec4 ndc = vec4(
            uv.x * 2.0 - 1.0,
            uv.y * 2.0 - 1.0,
            -1.0,  // near plane, always
            1.0
        );

        vec4 viewPos = projectionMatrixInverse * ndc;
        viewPos /= viewPos.w;

        vec4 worldPos = viewMatrixInverse * viewPos;

        return worldPos.xyz;
    }

    void main() {
      vec2 ndc = vUv * 2.0 - 1.0;

        if(getNearPlanePosition(vUv).y > 0.) {
            gl_FragColor = vec4(texture2D(tAbove, vUv).rgb, 1.0);
        }
        else {
            gl_FragColor = vec4(texture2D(tUnder, vUv).rgb, 1.0);
        }
    }
  `
};


// Composer

const composer = new EffectComposer(renderer);
const compositePass = new ShaderPass(waterCompositeShader);

compositePass.uniforms.tAbove.value = overwater_buffer.texture;
compositePass.uniforms.tUnder.value = underwater_buffer.texture;
compositePass.uniforms.projectionMatrixInverse.value = camera.projectionMatrixInverse;
compositePass.uniforms.viewMatrixInverse.value = camera.matrixWorld;

composer.addPass(compositePass);

const outputPass = new OutputPass();
composer.addPass(outputPass); // must be last

// Load a Plane
const plane_geometry = new THREE.BoxGeometry();
const plane_material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const plane = new THREE.Mesh(plane_geometry, plane_material);
plane.position.y = 1;
overwater.add(plane);

// Add sun
const sun = new THREE.DirectionalLight(0xffffff);
sun.position.set(0, 10, 0);
sun.target.position.set(-5, -5, 5);
overwater.add(sun)
const sub_sun = new THREE.DirectionalLight(0xffffff);
sub_sun.position.set(0, 10, 0);
sub_sun.target.position.set(-5, -5, 5);
underwater.add(sub_sun);

// Ambient Light
const light = new THREE.AmbientLight(0xa0a0a0);
overwater.add(light);
var sub_light = new THREE.AmbientLight(0x72a09f);
underwater.add(sub_light);

// Debug helper
const lightHelper = new THREE.DirectionalLightHelper(sun);
overwater.add(lightHelper);

// Load CTD model
const model_loader = new GLTFLoader();

const xplorer = (await model_loader.loadAsync('resources/models/OceanXplorer4.glb')).scene;
xplorer.scale.x = 10;
xplorer.scale.y = 10;
xplorer.scale.z = 10;
xplorer.position.y = -5
overwater.add(xplorer);
const sub_xplorer= xplorer.clone();
underwater.add(sub_xplorer);

const rov = (await model_loader.loadAsync('resources/models/ROV.glb')).scene;
rov.scale.x = 0.002;
rov.scale.y = 0.002;
rov.scale.z = 0.002;
rov.position.x = -0.25
rov.position.y = 0.8
rov.position.z = 3.8
const sub_rov = rov.clone();
xplorer.add(rov);
sub_xplorer.add(sub_rov);

const ctd = (await model_loader.loadAsync('resources/models/CTD.glb')).scene;
ctd.scale.x = 0.005;
ctd.scale.y = 0.005;
ctd.scale.z = 0.005;
ctd.position.x = 1.42;
ctd.position.y = 1.15;
ctd.position.z = 2.44;
xplorer.add(ctd);
const sub_ctd = ctd.clone();
sub_xplorer.add(sub_ctd);

// Skybox
const texture_loader = new THREE.TextureLoader();
const texture = texture_loader.load(
    'resources/images/clear_sky.png',
    () => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        overwater.background = texture;
    });

renderer.setClearColor(0x72a09f, 1);

// Camera
camera.position.z = 25;
camera.position.y = 15;
const controls = new OrbitControls(camera, renderer.domElement);

// Fog
underwater.fog = new THREE.FogExp2(0x72a09f, 0.01);

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
overwater.add(water);

let sub_water = new Water(
  waterGeometry,
  {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: new THREE.TextureLoader().load('resources/images/waternormals.jpg', function (texture) {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    }),
    sunDirection: sun.position.clone().normalize(),
    sunColor: 0xffffff,
    waterColor: 0xffffff,
    distortionScale: 10,
    fog: true,
    alpha: 0.7
  }
);

sub_water.rotation.x = Math.PI / 2;
sub_water.material.transparent = true
underwater.add(sub_water);

// Animation Loop

function animate() {
    requestAnimationFrame(animate);

    const r = Date.now() * 0.001;

    xplorer.rotation.y = Math.sin(r) * 0.005;
    xplorer.rotation.x = Math.sin(r) * 0.005;
    xplorer.rotation.z = Math.cos(r*2) * 0.005;

    water.material.uniforms['time'].value += 0.005
    sub_water.material.uniforms['time'].value += 0.005
    controls.update();

    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix();

    renderer.setRenderTarget(underwater_buffer);
    renderer.render(underwater, camera);
    renderer.setRenderTarget(overwater_buffer);
    renderer.render(overwater, camera);

    composer.render();
}

animate();