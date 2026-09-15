import * as THREE from 'three';
import * as graphs from './public/DataUI/graphs.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Water } from 'three/addons/objects/Water.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// ThreeJS Boilerplate
const overwater = new THREE.Scene();
const underwater = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

var scene = -1;
var count = 0;
var speed = 0;
var keys = {};

window.addEventListener('keydown', (e) => keys[e.code] = true);
window.addEventListener('keyup', (e) => keys[e.code] = false);

var last = Date.now();

const renderer = new THREE.WebGLRenderer({ logarithmicDepthBuffer: true });
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

const evening = texture_loader.load(
    'resources/images/evening.png',
    () => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.colorSpace = THREE.SRGBColorSpace;
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
        float u = atan(-dir.z, dir.x) / (2.0 * PI) + 0.5;
        float v = asin(clamp(dir.y, -1.0, 1.0)) / PI + 0.5;
        return vec2(u, v);
    }

    vec3 applyVibrance(vec3 color, float amount) {
        float luma = dot(color, vec3(0.299, 0.587, 0.114)); // perceptual luminance weights
        float maxChannel = max(color.r, max(color.g, color.b));
        float minChannel = min(color.r, min(color.g, color.b));
        float saturation = maxChannel - minChannel;
        
        // Boost more where saturation is currently low
        float boost = amount * (1.0 - saturation);
        
        return mix(vec3(luma), color, 1.0 + boost);
    }

    void main() {
      vec2 ndc = vUv * 2.0 - 1.0;

        if(getNearPlanePosition(vUv).y > 0.) {
            vec3 rayDir = getWorldRayDir(vUv);
            vec2 skyUv = equirectUv(vec3(rayDir.zyx));

            vec2 ddx = dFdx(skyUv);
            vec2 ddy = dFdy(skyUv);
            ddx.x = fract(ddx.x + 0.5) - 0.5;

            float depth = getRadialDistance(vUv, tDepthAbove);

            gl_FragColor = vec4(mix(textureGrad(skybox, skyUv, ddx, ddy).rgb, texture2D(tAbove, vUv).rgb, clamp(2. - depth * 2.5, 0., 1.)), 1.);
        }
        else {
            float depth = getRadialDistance(vUv, tDepth);

            gl_FragColor = vec4(mix(underwaterColor.rgb / (1. - getNearPlanePosition(vUv).y / 5.), texture2D(tUnder, vUv).rgb, clamp(2. - exp(depth * .7), 0., 1.)), 1.);
            gl_FragColor = vec4(mix(underwaterColor.rgb * exp(getNearPlanePosition(vUv).y / 10.), texture2D(tUnder, vUv).rgb, clamp(2. - pow(depth * 13., 1.), 0., 1.)), 1.);
        }
        
        

        //if(vUv.x > .5)
            gl_FragColor = vec4(applyVibrance(gl_FragColor.rgb, 1.0).rgb, 1.);
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
sun.intensity = 1.3;
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

const xplorer = (await model_loader.loadAsync('/resources/models/OceanXplorer5.glb')).scene;
xplorer.scale.x = 10;
xplorer.scale.y = 10;
xplorer.scale.z = 10;
xplorer.position.y = -6

const sub_xplorer = xplorer.clone();
xplorer.getObjectByName("CTD_Door").rotation.z = 0;
xplorer.getObjectByName("CTD_Arm").position.x = 0;

overwater.add(xplorer);
underwater.add(sub_xplorer);

const rov = (await model_loader.loadAsync('/resources/models/ROV.glb')).scene;
rov.scale.x = 0.002;
rov.scale.y = 0.002;
rov.scale.z = 0.002;
rov.position.x = -0.25
rov.position.y = 0.8
rov.position.z = 3.8
const sub_rov = rov.clone();
xplorer.add(rov);
sub_xplorer.add(sub_rov);

const ctd = (await model_loader.loadAsync('/resources/models/CTD.glb')).scene;
ctd.scale.x = 0.003;
ctd.scale.y = 0.003;
ctd.scale.z = 0.003;
ctd.position.x = 0;
ctd.position.y = 0;
ctd.position.z = 0;
xplorer.getObjectByName("CTD_Arm").add(ctd);
const sub_ctd = ctd.clone();
sub_xplorer.getObjectByName("CTD_Arm").add(sub_ctd);


const coral = (await model_loader.loadAsync('/resources/models/LopheliaPertusa.glb')).scene;
coral.scale.x = 2;
coral.scale.y = 2;
coral.scale.z = 2;
coral.position.x = 0;
coral.position.y = -80;
coral.position.z = 0.5;
underwater.add(coral);

const coral2 = (await model_loader.loadAsync('/resources/models/Coral.glb')).scene;
coral2.scale.x = 0.04;
coral2.scale.y = 0.04;
coral2.scale.z = 0.04;
coral2.position.x = 0;
coral2.position.y = -80;
coral2.position.z = 0.5;
underwater.add(coral2);


const coffin = (await model_loader.loadAsync('/resources/models/coffin.glb')).scene;
coffin.scale.x = 0.01;
coffin.scale.y = 0.01;
coffin.scale.z = 0.01;
coffin.position.x = 0;
coffin.position.y = -79.7;
coffin.position.z = 0.5;
underwater.add(coffin);

const grenadier = (await model_loader.loadAsync('/resources/models/Grenedier.glb')).scene;
grenadier.scale.x = 0.01;
grenadier.scale.y = 0.01;
grenadier.scale.z = 0.01;
grenadier.position.x = 0.1;
grenadier.position.y = -79.7;
grenadier.position.z = 0.5;
underwater.add(grenadier);

const moray = (await model_loader.loadAsync('/resources/models/Moray.glb')).scene;
moray.scale.x = 0.01;
moray.scale.y = 0.01;
moray.scale.z = 0.01;
moray.position.x = -0.1;
moray.position.y = -79.7;
moray.position.z = 0.5;
underwater.add(moray);

const seastar = (await model_loader.loadAsync('/resources/models/Seastar.glb')).scene;
seastar.scale.x = 0.01;
seastar.scale.y = 0.01;
seastar.scale.z = 0.01;
seastar.position.x = -0.3;
seastar.position.y = -80;
seastar.position.z = 0.5;
underwater.add(seastar);


// Cable
const cable = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial({ color: new THREE.Color(0, 0, 0) }));
cable.scale.x = 2;
cable.scale.y = 2;
cable.scale.z = 2;
cable.position.x = 0;
cable.position.y = 0;
cable.position.z = 0;
const sub_cable = cable.clone();
ctd.add(cable);
sub_ctd.add(sub_cable);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

// window.addEventListener('click', (event) => {
//     pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
//     pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

//     raycaster.setFromCamera(pointer, camera);

//     const intersects = raycaster.intersectObject(coral, true);
//     if (intersects.length > 0) fauna_listeners.forEach(fn => fn("Lophelia_Pertusa"));

//     const intersects2 = raycaster.intersectObject(coffin, true);
//     if (intersects2.length > 0) fauna_listeners.forEach(fn => fn("Coffin_Fish"));

//     const intersects3 = raycaster.intersectObject(grenadier, true);
//     if (intersects3.length > 0) fauna_listeners.forEach(fn => fn("Grenadier"));

//     const intersects4 = raycaster.intersectObject(moray, true);
//     if (intersects4.length > 0) fauna_listeners.forEach(fn => fn("Moray"));

//     const intersects5 = raycaster.intersectObject(seastar, true);
//     if (intersects5.length > 0) fauna_listeners.forEach(fn => fn("Sea_Star"));

//     const intersects6 = raycaster.intersectObject(coral2, true);
//     if (intersects6.length > 0) fauna_listeners.forEach(fn => fn("Enallopsammia_Rostrata"));

// });

window.addEventListener('click', (event) => {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);

    const targets = [
        { obj: coral, id: "Lophelia_Pertusa" },
        { obj: coffin, id: "Coffin_Fish" },
        { obj: grenadier, id: "Grenadier" },
        { obj: moray, id: "Moray" },
        { obj: seastar, id: "Sea_Star" },
        { obj: coral2, id: "Enallopsammia_Rostrata" }
    ];

    let closestHit = null;
    let closestDistance = Infinity;

    targets.forEach(target => {
        // Ensure object is currently present in the scene before raycasting
        if (target.obj.parent === underwater) {
            const intersects = raycaster.intersectObject(target.obj, true);
            if (intersects.length > 0 && intersects[0].distance < closestDistance) {
                closestDistance = intersects[0].distance;
                closestHit = target.id;
            }
        }
    });

    if (closestHit) {
        fauna_listeners.forEach(fn => fn(closestHit));
    }
});

window.addEventListener('mousemove', (event) => {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);

    const targets = [coral, coffin, grenadier, moray, seastar, coral2];

    const isHovering = targets.some(obj =>
        obj.parent === underwater && raycaster.intersectObject(obj, true).length > 0
    );

    document.body.style.cursor = isHovering ? 'pointer' : 'default';
});

const bot = (await model_loader.loadAsync('/resources/models/CTD_Bottle.glb')).scene;
bot.scale.x = 0.03;
bot.scale.y = 0.03;
bot.scale.z = 0.03;
const bot2 = bot.clone();
overwater.add(bot);
overwater.add(bot2);

const helicopter = (await model_loader.loadAsync('/resources/models/Helicopter2.glb')).scene;
helicopter.scale.x = 0.07;
helicopter.scale.y = 0.07;
helicopter.scale.z = 0.07;
helicopter.rotation.y = 90
helicopter.position.x = 0;
helicopter.position.y = 1.67;
helicopter.position.z = -3.44;
xplorer.add(helicopter);

const gltf = await model_loader.loadAsync('/resources/models/Woman.glb');
const person = gltf.scene;

person.scale.x = 0.1;
person.scale.y = 0.1;
person.scale.z = 0.1;
xplorer.add(person);

const mixer = new THREE.AnimationMixer(person);

const clip = gltf.animations[0];
const action = mixer.clipAction(clip);
action.play();

person.traverse((child) => {
    if (child.isMesh) {
        const oldMat = child.material;

        child.material = new THREE.MeshStandardMaterial({
            map: oldMat.map,                 // diffuse/albedo texture
            color: new THREE.Color(2, 2, 2),             // base color tint
            transparent: oldMat.transparent,
            opacity: oldMat.opacity,
            alphaMap: oldMat.alphaMap,
        });

        oldMat.dispose(); // free the old material/GPU resources
    }
});

//Spot light
const color = 0xFFFFFF;
const intensity = 2;
const spotLight = new THREE.SpotLight(color, intensity);
underwater.add(spotLight);
underwater.add(spotLight.target);
spotLight.angle = Math.PI / 5;
spotLight.penumbra = 0.4;



/*const man = (await model_loader.loadAsync('/resources/models/Man.glb')).scene;
man.scale.x = 1;
man.scale.y = 1;
man.scale.z = 1;
man.position.x = 0;
man.position.y = 0;
man.position.z = 0;
xplorer.add(man);*/

// Camera
camera.position.z = 25;
camera.position.y = 15;
//const controls = new OrbitControls(camera, renderer.domElement);

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
        waterNormals: new THREE.TextureLoader().load('/resources/images/waternormals.jpg', function (texture) {

            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

        }),
        sunDirection: sun.position.clone().normalize(),
        sunColor: 0xffffff,
        waterColor: 0x005e5f,
        distortionScale: 1,
        fog: overwater.fog !== undefined,
        alpha: 0.95,
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
        waterNormals: new THREE.TextureLoader().load('/resources/images/waternormals.jpg', function (texture) {
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

function sawtooth(x) {
    return 2 * (x - Math.floor(x + 0.5));
}

sub_water.rotation.x = Math.PI / 2;
sub_water.material.transparent = true
underwater.add(sub_water);

// Sand

const sand = texture_loader.load('/resources/images/sand.png');
sand.wrapS = THREE.RepeatWrapping;
sand.wrapT = THREE.RepeatWrapping;
sand.repeat.set(10000, 10000);
const material = new THREE.MeshStandardMaterial({ color: 0xffffff, map: sand });
const cube = new THREE.Mesh(waterGeometry, material);
underwater.add(cube);
cube.position.y = -80;
cube.rotation.x = -Math.PI / 2;

// Sound

const listener = new THREE.AudioListener();
camera.add(listener);

const overMusic = new THREE.Audio(listener);
const underMusic = new THREE.Audio(listener);
const ambientUnder = new THREE.Audio(listener);
const ambientSea = new THREE.Audio(listener);
const rotors = new THREE.Audio(listener);
const splash = new THREE.Audio(listener);


const audioLoader = new THREE.AudioLoader();
audioLoader.load('resources/sounds/menu.mp3', function (buffer) {
    overMusic.setBuffer(buffer);
    overMusic.setLoop(true);
    overMusic.setVolume(0.5);
});
audioLoader.load('resources/sounds/menu_sub.mp3', function (buffer) {
    underMusic.setBuffer(buffer);
    underMusic.setLoop(true);
    underMusic.setVolume(0);
});
audioLoader.load('resources/sounds/water_ambient.mp3', function (buffer) {
    ambientUnder.setBuffer(buffer);
    ambientUnder.setLoop(true);
    ambientUnder.setVolume(0);
});
audioLoader.load('resources/sounds/helicopter.mp3', function (buffer) {
    rotors.setBuffer(buffer);
    rotors.setLoop(true);
    rotors.setVolume(0);
});
audioLoader.load('resources/sounds/sea_sounds.mp3', function (buffer) {
    ambientSea.setBuffer(buffer);
    ambientSea.setLoop(true);
    ambientSea.setVolume(1);
});

// Scene Control

const listeners = new Set();
const depth_listeners = new Set();
const fauna_listeners = new Set();

export function setScene(scene_index) {
    scene = scene_index;

    switch (Math.floor(scene)) {
        case 0:
            break;
        case 1:
            count = 0;
            console.log("Start")
            ambientSea.play();
            ambientUnder.play();
            break;
        case 7:
            document.querySelector(".container").style.display = "none";

        case 2:
            //setScene(8);
            xplorer.add(camera);
            break;
        case 3:
            xplorer.getObjectByName("CTD_Door").rotation.z = 1;
            overwater.add(camera);
            count = 0;

            break;
        case 4:
            count = 0;
            break;
        case 5:
            count = 1;
            sub_light.intensity = 0;
            sub_sun.intensity = 0;

            break;
        case 6:
            overwater.add(ctd);
            underwater.add(sub_ctd);
            ctd.position.x = 20;
            ctd.position.z = 0;
            ctd.position.y = -75;
            ctd.scale.x = 0.03;
            ctd.scale.y = 0.03;
            ctd.scale.z = 0.03;
            sub_ctd.scale.x = 0.03;
            sub_ctd.scale.y = 0.03;
            sub_ctd.scale.z = 0.03;
            count = 20
            document.querySelector(".container").style.display = "grid";
            graphs.main()

            break;
        case 7:
            break;
        case 8:
            document.querySelector(".container").style.display = "none";
            overwater.add(rov);
            overMusic.setVolume(0);
            underMusic.setVolume(0.3);
            ambientUnder.play();
            count = 0
            camera.near = 0.1;
            camera.far = 1000;
            camera.updateMatrix();
            rov.add(camera);
            rov.position.x = 0;
            rov.position.y = -5;
            rov.position.z = 0;
            rov.rotation.y = 0;
            rov.rotation.x = 0;
            rov.rotation.z = 0;

            underwater.remove(coral);
            underwater.remove(coral2);
            underwater.remove(coffin);
            underwater.remove(seastar);
            underwater.remove(grenadier);
            underwater.remove(moray);

            switch (scene * 10 - 80) {
                case 1:
                    underwater.add(coral);
                    underwater.add(coffin);
                    break;
                case 4:
                    underwater.add(coral);
                    underwater.add(moray);
                    break;
                case 5:
                    underwater.add(coral2);
                    underwater.add(grenadier);
                    break;
                case 7:
                    underwater.add(coral2);
                    underwater.add(seastar);
                    break;
            }

            speed = 0;
            break;
        case 9:
            xplorer.add(camera);
            camera.position.z = -2.5;
            camera.position.y = 1.8;
            camera.position.x = 0.5;
            camera.rotation.x = 0;
            camera.rotation.y = 0;//Math.PI / 2;
            camera.rotation.z = 0;
            compositePass.uniforms.skybox.value = evening;
            overwater.background = evening;
            count = 0;
            rotors.play();
            rotors.setVolume(1);
            break;
        case 10:
            count = 0;
            break;
        default:
            break;
    }

    listeners.forEach(fn => fn(scene));
}

export function onSceneChange(fn) { listeners.add(fn); }
export function getDepth(fn) { depth_listeners.add(fn); }
export function faunaFound(fn) { fauna_listeners.add(fn); }

let test = -1;
setScene(0);

// Update Loop

function update() {
    requestAnimationFrame(update);

    const r = Date.now() * 0.001;
    const delta = Math.max(0, Math.min(0.5, r - last));
    document.getElementById("fps").innerHTML = Math.floor(1 / delta);

    mixer.update(delta);

    const arm = xplorer.getObjectByName("CTD_Arm");

    cable.scale.y = Math.abs(ctd.position.y / 0.003);
    cable.position.y = Math.abs(ctd.position.y / 0.006);
    sub_cable.scale.y = Math.abs(ctd.position.y / 0.003);
    sub_cable.position.y = Math.abs(ctd.position.y / 0.006);

    switch (Math.floor(scene)) {
        // Menu Cutscene
        case 0:
            const s = 0.2;
            const d = 60 + Math.cos(r * s) * 10;
            camera.position.x = Math.sin(r * s) * d;
            camera.position.z = Math.cos(r * s) * d;
            camera.position.y = 20 + Math.cos(r * s) * 10;
            camera.lookAt(0, 10, 0);
            break;
        // Intro
        case 1:
            count += delta;

            camera.position.z = -50 + 50 / (count / 2 + 1);
            camera.position.y = 25;
            camera.position.x = 40 + 100 / (count / 2 + 1);

            camera.lookAt(xplorer.position.x, xplorer.position.y + 15, xplorer.position.z);
            break;
        // Talking
        case 7:
        case 2:
            camera.position.x = 0.3
            camera.position.y = 1.57
            camera.position.z = 2
            person.position.x = 0.3
            person.position.y = 1.418
            person.position.z = 2.1
            person.rotation.y = Math.PI;
            camera.rotation.x = 0;
            camera.rotation.y = 2.8;
            camera.rotation.z = 0;
            break;
        // Opening Door
        case 3:
            count += delta;
            const rot = xplorer.getObjectByName("CTD_Door").rotation.z;
            xplorer.getObjectByName("CTD_Door").rotation.z = rot + delta * Math.min(1, Math.PI / 2 - rot);

            const x = xplorer.getObjectByName("CTD_Arm").position.x;
            xplorer.getObjectByName("CTD_Arm").position.x = Math.sin(count / 2) * 1.2;// x + delta * Math.min(0.3, 1.2 - x);


            camera.position.x = 15;
            camera.position.y = 4;
            camera.position.z = 15;
            camera.lookAt((arm.position.x + ctd.position.x) * 10, (+ ctd.position.y + arm.position.y) * 10 - 7, (arm.position.z + ctd.position.x) * 10);

            if (count > Math.PI)
                setScene(4);
            break;
        // Lowering CTD
        case 4:
            count += delta * 3;

            const descent = 0.2 * Math.min(10, 0.1 - ctd.position.y) * 3;

            camera.position.x = 15;
            camera.position.z = 15;
            sub_ctd.position.x = ctd.position.x;
            sub_ctd.position.y = ctd.position.y;
            sub_ctd.position.z = ctd.position.z;

            camera.lookAt((arm.position.x + ctd.position.x) * 10, (+ ctd.position.y + arm.position.y) * 10 - 7, (arm.position.z + ctd.position.x) * 10);

            ctd.position.y -= Math.min(delta * 0.3, delta * descent) * Math.min(1, count);
            camera.position.y -= Math.min(delta * 3 * 0.5, 5 * delta * descent);

            if (ctd.position.y < -.4 && ctd.position.y + delta * descent > -.4) {
                audioLoader.load('resources/sounds/big_explosion.ogg', function (buffer) {
                    splash.setBuffer(buffer);
                    splash.setLoop(false);
                    splash.setVolume(0.5);
                    splash.play();
                });
            }

            if (ctd.position.y < -2) {
                setScene(5);
            }
            break;
        // Fade to black
        case 5:
            count -= delta;
            camera.position.y = camera.position.y - delta * 50;
            camera.position.x = 1000;
            underMusic.setVolume(Math.max(0, underMusic.getVolume() - delta / 10));
            if (count < 0) {
                setScene(6);
            }
            break;
        // Raising CTD
        case 6:
            count -= delta * 4;

            camera.position.x = 20;
            camera.position.y = ctd.position.y - 1;
            camera.position.z = 3;

            camera.position.y -= Math.max(0, ctd.position.y + 4);

            let i = Math.max(0, Math.min(0.03, -camera.position.y * 0.4));

            camera.lookAt(
                ctd.position.x + (Math.random() - 0.5) * i,
                ctd.position.y + (Math.random() - 0.5) * i - 1,
                ctd.position.z + (Math.random() - 0.5) * i
            );

            sub_ctd.position.x = ctd.position.x;
            sub_ctd.position.y = ctd.position.y;
            sub_ctd.position.z = ctd.position.z;


            if (camera.position.y >= -1.6 * 0 && camera.position.y - delta * 1.5 * 2 < -1.6 * 0) {
                audioLoader.load('resources/sounds/raise.mp3', function (buffer) {
                    splash.setBuffer(buffer);
                    splash.setLoop(false);
                    splash.setVolume(0.5);
                    splash.play();
                });
            }

            ctd.position.y += delta * 1.5 * (ctd.position.y > -1.6 ? 1 : 2) * 2 * Math.min(1, (5 - ctd.position.y) * 0.4);

            if (ctd.position.y > 5) {
                //setScene(7);
                ctd.position.y = 5;
            }

            sub_sun.intensity = 1.3 * Math.exp(ctd.position.y / 10);
            sub_light.intensity = 1 * Math.exp(ctd.position.y / 10);
            spotLight.intensity = 0;

            break;
        // ROV
        case 8:
            count += delta * 0.5;
            spotLight.intensity = 1;

            rov.position.x = 0;
            rov.position.z = 0;

            underMusic.setVolume(Math.max(0, underMusic.getVolume() - delta / 10));
            overMusic.setVolume(Math.max(0, overMusic.getVolume() - delta / 10));
            ambientUnder.setVolume(Math.min(1, ambientUnder.getVolume() + delta / 3));

            camera.position.x = 0;//rov.position.x;
            camera.position.y = 200;//rov.position.y + 1.2;
            camera.position.z = 120;//rov.position.z + 0.6;
            camera.rotation.x = Math.PI / 2.5;
            camera.rotation.y = Math.PI;
            camera.rotation.z = 0;


            spotLight.position.set(rov.position.x, rov.position.y - 30, rov.position.z);
            spotLight.position.x = rov.position.x;
            spotLight.position.y = rov.position.y + 1;
            spotLight.position.z = rov.position.z + 0.2;
            spotLight.target.position.set(rov.position.x, rov.position.y - 100000, rov.position.z);

            rov.position.y += speed * delta * 10;
            if (rov.position.y > -5) {
                speed = 0;
                rov.position.y = -5;
            }
            if (rov.position.y < -80) {
                speed = 0;
                rov.position.y = -80;
            }

            rov.position.y = -80 + 20 / (count * 10 + 1);


            depth_listeners.forEach(fn => fn(rov.position.y));

            /*if (keys["ArrowDown"]) {
                speed -= delta;
            }
            if (keys["ArrowUp"]) {
                speed += delta;
            }
            speed = speed * (1 - delta);*/

            sub_sun.intensity = 1.3 * Math.exp(rov.position.y / 10);
            sub_light.intensity = 1 * Math.exp(rov.position.y / 10);

            break;
        // Conclusion
        case 9:
            sun.color = new THREE.Color(0xffbf72);
            count += delta * 0.5;
            camera.lookAt(helicopter.position.x * 10, helicopter.position.y * 10 - 4, helicopter.position.z * 10);
            helicopter.getObjectByName('HLC_BladesTop').rotation.y += delta * 30;
            helicopter.getObjectByName('HLC_BladesBack').rotation.y += delta * 30;
            break;
        // Credits
        case 10:
            count += delta * 0.5;
            camera.lookAt(helicopter.position.x * 10, helicopter.position.y * 10 - 4, helicopter.position.z * 10);
            helicopter.position.y = 1.67 + (Math.atan(count - 2) + Math.atan(2)) * Math.min(count, 1);
            helicopter.rotation.y = 90 + (Math.atan(count - 2) + Math.atan(2)) * Math.min(count, 1);
            helicopter.position.x -= count * .1 * delta;
            helicopter.getObjectByName('HLC_BladesTop').rotation.y += delta * 30;
            helicopter.getObjectByName('HLC_BladesBack').rotation.y += delta * 30;
            rotors.setVolume(Math.max(0, rotors.getVolume() * (1 - delta * 0.1)));
            rotors.setDetune(rotors.getDetune() - delta * 30);
            break;
        default:
            //controls.update();
            break;
    }

    compositePass.uniforms.tDepth.value = underwater_buffer.depthTexture;
    compositePass.uniforms.tDepthAbove.value = overwater_buffer.depthTexture;

    xplorer.rotation.y = Math.sin(r) * 0.005;
    xplorer.rotation.x = Math.sin(r) * 0.005;
    xplorer.rotation.z = Math.cos(r * 2) * 0.005;

    water.material.uniforms['time'].value += 0.005
    sub_water.material.uniforms['time'].value += 0.005


    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix();

    renderer.setRenderTarget(underwater_buffer);
    renderer.render(underwater, camera);
    renderer.setRenderTarget(overwater_buffer);
    renderer.render(overwater, camera);

    composer.render();


    if (scene == 6) {
        //sound.setVolume(0);
        //sound2.setVolume(0.3);
    }
    else if (scene == 8) {
        ambientSea.setVolume(0);
        ambientUnder.setVolume(0);
    }
    else {
        overMusic.setVolume(Math.min(1, Math.max(0, camera.position.y)) * 0.5);
        //if (scene != 3)
        {
            underMusic.setVolume(Math.min(1, Math.max(0, 1 - camera.position.y)) * 0.3);
        }
        ambientUnder.setVolume(Math.min(1, Math.max(0, 1 - camera.position.y)) * 1);
        ambientSea.setVolume(1 - Math.min(1, Math.max(0, 1 - camera.position.y)) * 1);
    }
    last = r;

    if (test == 0) {
        setScene(0);
        test = 1;
    }
    if (test == -1)
        test = 0;
}

update();