import { setScene, onSceneChange, getDepth } from './main.js';

var scene = 0;

document.getElementById("start-btn").onclick = function () {
    if (scene === 5) {
        setScene(5.5);
    } else {
        setScene(scene + 1);
    }
};




// Scene 4 Continue Button
document.getElementById("scene-4-next-btn").onclick = function () {
    setScene(6);
};


// Runs on every scene change
onSceneChange((scene_index) => {
    console.log(scene_index);
    scene = scene_index;
    document.getElementById("start-btn").style.display = scene == 0 || scene == 1 || scene == 2 || scene == 5 || scene == 6 || scene == 7 || scene == 8 ? "block" : "none";

    const scene4Overlay = document.getElementById("scene-4-overlay");
    const canvasElement = document.querySelector("canvas");

    switch (scene) {
        case 0:
            document.getElementById('loading-screen').classList.add('faded');
            document.getElementById("play-button").innerHTML = `<h1>EMBARK</h1>`;
            document.getElementById("play-button").classList.remove("loading");
            document.getElementById("play-button").classList.add("loaded");
            console.log(document.getElementById("play-button").classList);
            document.getElementById("play-button").onclick = function () {
                document.getElementById("loading-screen").style.display = "none";
                setScene(1);
            };
            break;
        case 5.5:
            if (canvasElement) canvasElement.style.display = "none";
            scene4Overlay.style.display = "flex";
            scene4Overlay.classList.add("active");
            break;
        case 6:
            if (canvasElement) canvasElement.style.display = "block";
            scene4Overlay.style.display = "none";
            break;
    }
});

// Runs each frame of game
getDepth((depth) => {
    console.log(depth);
});