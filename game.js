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

document.getElementById("proceed").onclick = function () {
    setScene(scene + 1);
};

document.getElementById("start-dialogue").onclick = function () {
    setScene(2);
};


// Runs on every scene change
onSceneChange((scene_index) => {
    console.log(scene_index);
    scene = scene_index;
    document.getElementById("start-btn").style.display = scene == 0 || scene == 1 || scene == 8 || scene == 9 ? "block" : "none";

    const scene4Overlay = document.getElementById("scene-4-overlay");
    const canvasElement = document.querySelector("canvas");

    document.getElementById("inventory").style.display = "none";
    document.getElementById("dialogue").style.display = "none";
    document.getElementById("start-dialogue").style.display = "none";
    document.getElementById("text").style.display = "none";

    switch (scene) {
        case 0:
            document.getElementById('loading-screen').classList.add('faded');
            document.getElementById("play-button").innerHTML = `<h1>EMBARK</h1>`;
            document.getElementById("play-button").classList.remove("loading");
            document.getElementById("play-button").classList.add("loaded");
            document.getElementById("play-button").onclick = function () {
                document.getElementById("loading-screen").style.display = "none";
                setScene(1);
            };
            break;
        case 1:
            document.getElementById("start-dialogue").style.display = "block";
            document.getElementById("text").style.display = "block";
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
        case 8:
            document.getElementById("inventory").style.display = "block";
            break;
        case 2:
        case 7:
            document.getElementById("dialogue").style.display = "block";
            break;

    }
});

// Runs each frame of game
getDepth((depth) => {
    //console.log(depth);
});