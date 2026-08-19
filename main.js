import * as THREE from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Water } from 'three/addons/objects/Water.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { depth } from 'three/tsl';

// ThreeJS Boilerplate
const overwater = new THREE.Scene();
const underwater = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.append(renderer.domElement);

// Underwater Buffer

const underwater_buffer = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
const overwater_buffer = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);

underwater_buffer.depthBuffer = true;
underwater_buffer.depthTexture = new THREE.DepthTexture();
underwater_buffer.depthTexture.format = THREE.DepthFormat;
underwater_buffer.depthTexture.type = THREE.UnsignedShortType;

overwater_buffer.depthBuffer = true;
overwater_buffer.depthTexture = new THREE.DepthTexture();
overwater_buffer.depthTexture.format = THREE.DepthFormat;
overwater_buffer.depthTexture.type = THREE.UnsignedShortType;

const underwaterFogColor = new THREE.Color(0x72a09f);

// Skybox
const texture_loader = new THREE.TextureLoader();
const texture = texture_loader.load(
    'resources/images/clear_sky.png',
    () => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        overwater.background = texture;
        underwater.background = texture;
    });

renderer.setClearColor(0x72a09f, 1);

// Shader

const waterCompositeShader = {
    uniforms: {
        tDiffuse: { value: null },
        tAbove: { value: overwater_buffer.texture },
        tUnder: { value: underwater_buffer.texture },
        tDepth: { value: null },
        tDepthAbove: { value: null },
        skybox: { value: texture },
        underwaterColor: { value: underwaterFogColor },
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
    uniform sampler2D tDepth;
    uniform sampler2D tDepthAbove;
    uniform sampler2D skybox;
    uniform mat4 projectionMatrixInverse;
    uniform mat4 viewMatrixInverse;
    uniform vec3 underwaterColor;
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

    float getRadialDistance(vec2 uv, sampler2D depthSampler) {
        float fragCoordZ = texture2D(depthSampler, uv).x;
        
        // NDC space
        vec4 ndc = vec4(uv.x * 2.0 - 1.0, uv.y * 2.0 - 1.0, fragCoordZ * 2.0 - 1.0, 1.0);
        
        // Unproject to view space (camera-relative, not world space — no viewMatrixInverse needed)
        vec4 viewPos = projectionMatrixInverse * ndc;
        viewPos /= viewPos.w;
        
        return length(viewPos.xyz); // true 3D distance from camera origin
    }

    vec3 getWorldRayDir(vec2 uv) {
        vec4 ndc = vec4(uv.x * 2.0 - 1.0, uv.y * 2.0 - 1.0, 1.0, 1.0); // far plane
        vec4 viewPos = projectionMatrixInverse * ndc;
        viewPos /= viewPos.w;
        vec3 worldDir = mat3(viewMatrixInverse) * normalize(viewPos.xyz);
        return normalize(worldDir);
    }

    const float PI = 3.1415;

    vec2 equirectUv(vec3 dir) {
        float u = atan(dir.z, dir.x) / (2.0 * PI) + 0.5;
        float v = asin(clamp(dir.y, -1.0, 1.0)) / PI + 0.5;
        return vec2(u, v);
    }

    void main() {
      vec2 ndc = vUv * 2.0 - 1.0;

        if(getNearPlanePosition(vUv).y > 0.) {
            vec3 rayDir = getWorldRayDir(vUv);
            vec2 skyUv = equirectUv(rayDir);

            vec2 ddx = dFdx(skyUv);
            vec2 ddy = dFdy(skyUv);
            ddx.x = fract(ddx.x + 0.5) - 0.5;

            float depth = getRadialDistance(vUv, tDepthAbove);

            gl_FragColor = vec4(mix(textureGrad(skybox, skyUv, ddx, ddy).rgb, texture2D(tAbove, vUv).rgb, clamp(2. - exp(depth * .0008), 0., 1.)), 1.);
        }
        else {
            float depth = getRadialDistance(vUv, tDepth);

            gl_FragColor = vec4(mix(underwaterColor.rgb, texture2D(tUnder, vUv).rgb, clamp(2. - exp(depth * .01), 0., 1.)), 1.);
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
const sub_xplorer = xplorer.clone();
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

const man = (await model_loader.loadAsync('resources/models/Man.glb')).scene;
man.scale.x = 1;
man.scale.y = 1;
man.scale.z = 1;
man.position.x = 0;
man.position.y = 0;
man.position.z = 0;
xplorer.add(man);

// Camera
camera.position.z = 25;
camera.position.y = 15;
const controls = new OrbitControls(camera, renderer.domElement);

// Fog
//underwater.fog = new THREE.FogExp2(0x72a09f, 0.01);
//overwater.fog = new THREE.Fog(0x9bb7d4, 0.01);

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
        fog: overwater.fog !== undefined,
        alpha: 0.7,
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
    
    compositePass.uniforms.tDepth.value = underwater_buffer.depthTexture;
    compositePass.uniforms.tDepthAbove.value = overwater_buffer.depthTexture;

    xplorer.rotation.y = Math.sin(r) * 0.005;
    xplorer.rotation.x = Math.sin(r) * 0.005;
    xplorer.rotation.z = Math.cos(r * 2) * 0.005;

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