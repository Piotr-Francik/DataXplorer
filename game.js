import { setScene, onSceneChange, getDepth, faunaFound } from './main.js';

var scene = 0;
var audio;

var i = 0;
var txt = 'Vessel:- OceanXplorer/Location:- Nola Seamount, Cabo Verde, 400 Miles West of African Coast/Mission:- Studying life and coral reefs in the area---';


var dialogue = [
    `Welcome aboard the <font color="yellow">OceanXplorer</font> - OceanX's floating lab and launchpad into the deep sea!
    <br><br>
    For the past few weeks, we have been at the <font color="yellow">Nola Seamount</font> in <font color="yellow">Cabo Verde</font>. 
    We are looking for corals and studying local sea life.`,

    `You have joined us at a great time! We just arrived at a new site. 
    We are about to drop our <font color="yellow">CTD Rosette</font>.
    <br><br>
    It collects <font color="red">Conductivity</font>, <font color="red">Temperature</font>, and <font color="red">Depth</font> data. 
    This tells us if sea life is likely to be here.`,

    `If sea life seems likely, we send down the <font color="yellow">Remote Operated Vehicle</font> (ROV) to look. 
    <br><br>
    This is your job: you will see 8 possible sites. 
    Use the data to choose where we send the ROV.`,

    `Today we are looking for 2 types of coral: <font color="yellow">Beaked Stony Coral</font> and 
    <font color="yellow">Deep Water White Coral</font>.
    <br><br>
    <font color="yellow">Beaked Stony Coral</font> lives at <font color="red">400m-800m</font> depth, 
    <font color="red">2.6&#176;C-12&#176;C</font>, and salinity <font color="red">34-37</font>.
    <br><br>
    <font color="yellow">Deep Water White Coral</font> lives at <font color="red">500m-1000m</font> depth, 
    <font color="red">4&#176;C-15&#176;C</font>, and salinity <font color="red">34-37</font>.`,

    `We are also looking for 4 more fauna - can you find them all?
    <br><br>
    New fauna you find will appear in your inventory. Open it to learn more about each one!
    <br><br>
    If a site looks good but has nothing there, don't worry. Deep sea exploration is often a guess. 
    If we already knew what was there, we wouldn't need to explore!`,

    `Ok, when you are ready, deploy the rosette!`
];

var site_dialogue = [
    `A coffin fish! They belong to the family Chaunacidae, also called "sea toads." 
    Their name "Chaunax" means "one who gapes."`,

    `That site was empty. Good try though - the data looked promising.`,

    `I didn't expect much there. Try picking sites that match the coral ranges.`,

    `A moray eel! I would not want to be a small fish near all those teeth!`,

    `<font color="red">ATTENTION!!!</font><br><br> A Grenadier, great find! It is one of the most common deep sea fish in the world.`,

    `That site's data wasn't very promising. Check the coral ranges again and try another site.`,

    `A sea star! There are about 400 billion stars in our galaxy. I wonder how many sea stars are in our oceans!`,

    `Bad luck, but you won't find something every time. Let's try again.`,

    `Congratulations! You found all 6 fauna we were looking for today. Well done!
    <br><br>
    That's the end of your trip for today. I hope you enjoyed it.
    <br><br>
    I have one more surprise for you - a great explorer like you deserves a special way to leave...`
];

var speed = 20;

var fauna_list = [
    ["Lophelia_Pertusa", "Coffin_Fish"],
    [],
    [],
    ["Lophelia_Pertusa", "Moray"],
    ["Enallopsammia_Rostrata", "Grenadier"],
    [],
    ["Enallopsammia_Rostrata", "Sea_Star"],
    []
];

var fauna_discovered = [];

var dialogueCharIndex = 0;
var dialogueTimeout;






function logout() {
    document.getElementById("idle").style.display = "flex";
}

function resetTimer() {
    clearTimeout(time);
    time = setTimeout(logout, 30000)
}

var time;
window.onload = resetTimer;
document.onmousemove = resetTimer;
document.onkeydown = resetTimer;

document.onload = resetTimer;
document.onmousemove = resetTimer;
document.onmousedown = resetTimer; // touchscreen presses
document.ontouchstart = resetTimer;
document.onclick = resetTimer;     // touchpad clicks
document.onkeydown = resetTimer;   // onkeypress is deprectaed
document.addEventListener('scroll', resetTimer, true); // improved; see comments



function typeDialogueText(targetElementId, fullHtmlText, speed = 15, onComplete) {
    const targetElement = document.getElementById(targetElementId);

    clearTimeout(dialogueTimeout);

    if (dialogueCharIndex === 0) {
        targetElement.innerHTML = "";
    }

    if (dialogueCharIndex < fullHtmlText.length) {

        if (fullHtmlText.charAt(dialogueCharIndex) === '<') {
            const closingIndex = fullHtmlText.indexOf('>', dialogueCharIndex);
            if (closingIndex !== -1) {
                dialogueCharIndex = closingIndex + 1;
            } else {
                dialogueCharIndex++;
            }
        } else {
            dialogueCharIndex++;
        }

        targetElement.innerHTML = fullHtmlText.slice(0, dialogueCharIndex);
        dialogueTimeout = setTimeout(() => {
            typeDialogueText(targetElementId, fullHtmlText, speed, onComplete);
        }, speed);
    } else {
        dialogueCharIndex = 0;
        if (onComplete) onComplete();
    }
}

function typeWriter() {
    if (i < txt.length) {
        if (txt.charAt(i) == '/') {
            document.getElementById("typed_text").innerHTML += "<br>";
            setTimeout(typeWriter, speed * 5);
            audio.pause();
        }
        else if (txt.charAt(i) == '-') {
            setTimeout(typeWriter, speed * 5);
            audio.pause();
        }
        else {
            document.getElementById("typed_text").innerHTML += txt.charAt(i);
            setTimeout(typeWriter, speed);
            audio.play();
        }
        i++;
    }
    else {
        audio.loop = false;
        audio.pause();
        document.getElementById("start-dialogue").style.display = "block";
    }
}

function blackout(f) {
    document.getElementById("blackout").classList.add("shade");
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

document.getElementById("recover").onclick = function () {
    setScene(scene - 1);
};



// Scene 4 Continue Button
document.getElementById("scene-4-next-btn").onclick = function () {
    setScene(6);
};

document.getElementById("proceed").onclick = function () {
    if (scene > 6) {
        if (Math.round(scene * 10) == 79) {
            setScene(9);
        }
        else {
            if (fauna_discovered.length > 5)
                setScene(7.9);
            else {
                document.querySelector(".container").style.display = "grid";
                document.getElementById("dialogue").style.display = "none";
            }
        }
    }
    else if (scene * 10 - 19 > dialogue.length) {
        setScene(Math.ceil(scene))
    }
    else {
        setScene(scene + 0.1);
    }
};

document.getElementById("start-dialogue").onclick = function () {
    blackout(() => setScene(2));
};

document.getElementById("inventory-btn").onclick = function () {
    document.getElementById("inventory").style.display = "block";
};

document.getElementById("close-inventory").onclick = function () {
    document.getElementById("inventory").style.display = "none";
};

// Runs on every scene change
onSceneChange((scene_index) => {
    scene = scene_index;
    document.getElementById("start-btn").style.display = scene == 9 ? "block" : "none";

    document.getElementById("dialogue").style.display = "none";
    document.getElementById("start-dialogue").style.display = "none";
    document.getElementById("typed_text").style.display = "none";

    const scene4Overlay = document.getElementById("scene-4-overlay");
    const canvasElement = document.querySelector("canvas");

    // document.getElementById("inventory").style.display = "none";
    document.getElementById("dialogue").style.display = "none";
    document.getElementById("start-dialogue").style.display = "none";
    document.getElementById("typed_text").style.display = "none";
    document.getElementById("recover").style.display = "none";
    document.getElementById("show").style.display = "none";

    if (scene == 1) {
        typeWriter();
    }

    switch (Math.floor(scene)) {
        case 0:
            document.getElementById('loading-screen').classList.add('faded');
            document.getElementById("play-button").innerHTML = `<h1>EMBARK</h1>`;
            document.getElementById("play-button").classList.remove("loading");
            document.getElementById("play-button").classList.add("loaded");
            document.getElementById("play-button").onclick = function () {
                document.getElementById("loading-screen").style.display = "none";
                setScene(1);
            };
            audio = new Audio('./resources/sounds/beep.wav');
            break;
        case 1:
            document.getElementById("typed_text").style.display = "block";
            audio.loop = true;
            audio.play();
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
            document.getElementById("show").style.display = "block";

            setTimeout(() => { document.getElementById("show").classList.add("show") }, 3000);

            if (fauna_list[Math.round((scene - 8) * 10 - 1)].length == 0) {
                document.getElementById("show").innerHTML = `<font color="red">No fauna at this spot!</font>`
                setTimeout(() => { document.getElementById("recover").style.display = "block"; }, 5000);
            }
            else {
                document.getElementById("show").innerHTML = `Fauna Discovered: ${0} / ${fauna_list[Math.round((scene - 8) * 10 - 1)].length}`
                setTimeout(() => { document.getElementById("show").classList.add("game") }, 5000);
            }

            break;
        case 2:
            document.getElementById("dialogue").style.display = "block";
            dialogueCharIndex = 0;
            typeDialogueText("speech", dialogue[Math.floor(scene * 10 - 20)]);
            break;
        case 7:
            document.getElementById("dialogue").style.display = "block";
            document.getElementById("show").classList.remove("show");
            document.getElementById("show").classList.remove("game");
            dialogueCharIndex = 0;
            typeDialogueText("speech", site_dialogue[Math.floor(scene * 10 - 71)]);
            break;

    }
});

// Runs each frame of game
getDepth((depth) => {
    //console.log(depth);
});

faunaFound((fauna) => {
    if (fauna_discovered.indexOf(fauna) == -1) {
        fauna_discovered.push(fauna);

        if (typeof unlockFauna === 'function') {
            unlockFauna(fauna);
        }
    }

    var pass = 0;

    fauna_list[Math.round(scene * 10 - 81)].forEach(element => {
        console.log(element);
        if (fauna_discovered.indexOf(element) != -1) {
            pass += 1;
        }
    });


    document.getElementById("show").innerHTML = `Fauna Discovered: ${pass} / ${fauna_list[Math.round(scene * 10 - 81)].length}`

    console.log(fauna_list[Math.round(scene * 10 - 81)]);
    console.log(fauna_discovered);
    console.log(pass);

    if (pass == fauna_list[Math.round((scene - 8) * 10 - 1)].length) {
        setTimeout(() => { document.getElementById("recover").style.display = "block"; }, 2000);
    }
});
