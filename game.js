import { setScene, onSceneChange, getDepth } from './main.js';

var scene = 0;

var i = 0;
var txt = 'Vessel:- Ocean Xplorer/Location:- Carpo Verde, 400 Miles of the African West Coast/Mission:- Studying life and coral reefs in the area---';
var speed = 40;

function typeWriter() {
    if (i < txt.length) {
        if (txt.charAt(i) == '/') {
            document.getElementById("typed_text").innerHTML += "<br>";
            setTimeout(typeWriter, speed * 5);
        }
        else if (txt.charAt(i) == '-') {
            setTimeout(typeWriter, speed * 5);
        }
        else {
            document.getElementById("typed_text").innerHTML += txt.charAt(i);
            setTimeout(typeWriter, speed);
        }
        i++;
    }
    else {
        document.getElementById("start-dialogue").style.display = "block";
    }
}

function blackout(f) {
    document.getElementById("blackout").classList.add("shade");
    console.log("BLACKOUT!!!")
    setTimeout(f, 250);
    setTimeout(unblack, 500);
}

function unblack() {
    document.getElementById("blackout").classList.remove("shade");
}



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
    blackout(() => setScene(2));
};

document.getElementById("inventory-preview").onclick = function () {
    window.location.href = "inventory.html";
};

document.getElementById("inventory-btn").onclick = function () {
    window.location.href = "inventory.html";
};

// Runs on every scene change
onSceneChange((scene_index) => {
    console.log(scene_index);
    scene = scene_index;
    document.getElementById("start-btn").style.display = scene == 8 || scene == 9 ? "block" : "none";

    const inventoryBtn = document.getElementById("inventory-btn");
    if (inventoryBtn) {
        inventoryBtn.onclick = function () {
            window.location.href = "inventory.html";
        };
    }
    document.getElementById("dialogue").style.display = "none";
    document.getElementById("start-dialogue").style.display = "none";
    document.getElementById("typed_text").style.display = "none";

    const scene4Overlay = document.getElementById("scene-4-overlay");
    const canvasElement = document.querySelector("canvas");

    // document.getElementById("inventory").style.display = "none";
    document.getElementById("dialogue").style.display = "none";
    document.getElementById("start-dialogue").style.display = "none";
    document.getElementById("typed_text").style.display = "none";

    if (scene == 1) {
        typeWriter();
    }

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
            document.getElementById("typed_text").style.display = "block";
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
            document.getElementById("inventory-btn").style.display = "block";
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