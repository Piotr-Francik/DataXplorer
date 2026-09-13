import { setScene, onSceneChange, getDepth, faunaFound } from './main.js';

var scene = 0;
var audio;

var i = 0;
var txt = 'Vessel:- OceanXplorer/Location:- Nola Seamound, Cabo Verde, 400 Miles West of African Coast/Mission:- Studying life and coral reefs in the area---';


var dialogue = [
    `Welcome aboard the <font color="yellow">OceanXplorer</font> - OceanX's floating laboratory, and launchpad into the deep sea! 
    I hope your journey has been pleasant. <br><br>
    The past few weeks, we have been stationed at the <font color="yellow">Nola Seamound</font> in <font color="yellow">Cabo Verde</font>, 
    looking for corals and studying local fauna.`,

    `You've join us at the perfect time! We've just arrived at our latest site, and are about to drop our <font color="yellow">CTD Rosette</font>.
    <br><br>
    This collects <font color="red">Conductivity</font>, <font color="red">Temperature</font> and <font color="red">Depth</font> data. 
    we can use this to assess the likelyhood of fauna at the location.`,

    `If the presence of fauna seems probable, we will send down the <font color="yellow">Remote Operated Vehichle</font> to inspect it visually. 
    This is where you come in.
    <br><br>
    You will be presented with 8 possible sites, and using the data collected, you will decide where we deploy the ROV.`,

    `Our focus today is on 2 types of coral: <font color="yellow">Enallopsammia Rostrata</font> and <font color="yellow">
    Lophelia Pertusa</font>. <br><br>
    <font color="yellow">Enallopsammia Rostrata</font> is found at depths of <font color="red">400m-800m</font>, temperatures of 
    <font color="red">2.6&#176;C-12&#176;C</font> and salinity of <font color="red">34-37</font>.
    <br><br>
    <font color="yellow">Lophelia Pertusa</font> is found at depths of <font color="red">500m-1000m</font>, temperatures of 
    <font color="red">4&#176;C-15&#176;C</font> and salinity of <font color="red">34-37</font>.`,

    `We are also looking for 4 additional fauna - can you find them all?
    <br><br>
    As you discover new species, they will appear in your inventory - open it up to find out more about each one!
    <br><br>
    Also, if a site looked promising but nothing was there, don't feel disheartened - deep sea exploration is a stab in the dark.
    If we knew what was down there, there'd be no reason to go!`,

    `Ok, when you're ready, deploy the rosette!`

];

var site_dialogue = [
    `Lophelia Pertusa - nice find!`,
    `Nice try, but unfortunately that site was empty. The data did show signs of coral, we were just unlucky.`,
    ``,
    `Lophelia Pertusa - nice find!`,
    `Enallopsammia Rostrata - nice find!`,
    `Nice try, but unfortunately that site was empty. The data did show signs of coral, we were just unlucky.`,
    `Enallopsammia Rostrata - nice find!`,
    `Nice try, but unfortunately that site was empty. The data did show signs of coral, we were just unlucky.`,
    `Congratulations, you have found all 8 species of fauna we were searching for today! You should be very proud of yourself!
    <br><br>
    That concludes your voyage for today. I hope you enjoyed your adventure.
    <br><br>
    I do have one more suprise for you - a great data explorer such as yourself deserves to disembark in style...`
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

/*document.getElementById("inventory-preview").onclick = function () {
    window.location.href = "inventory.html";
};*/

document.getElementById("inventory-btn").onclick = function () {
    window.location.href = "inventory.html";
};

// Runs on every scene change
onSceneChange((scene_index) => {
    scene = scene_index;
    document.getElementById("start-btn").style.display = scene == 9 ? "block" : "none";

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
            document.getElementById("speech").innerHTML = dialogue[Math.floor(scene * 10 - 20)];
            document.getElementById("dialogue").style.display = "block";
            break;
        case 7:
            document.getElementById("dialogue").style.display = "block";
            document.getElementById("show").classList.remove("show");
            document.getElementById("show").classList.remove("game");
            document.getElementById("speech").innerHTML = site_dialogue[Math.floor(scene * 10 - 71)];
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
