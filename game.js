import { setScene, onSceneChange, getDepth } from './main.js';
import * as graph from './DataUI/graph.js';


var scene = 0;

document.getElementById("start-btn").onclick = function () {
    setScene(scene + 1);
};

// Runs on every scene change
onSceneChange((scene_index) => {
    console.log(scene_index);
    scene = scene_index;
    document.getElementById("start-btn").style.display = scene == 0 || scene == 5 || scene == 6 || scene == 7 || scene == 8 ? "block" : "none";
});

// Runs each frame of game
getDepth((depth) => {
    // console.log(depth);
    let graphDepth = depth*-6.52 - 30
    graph.updateGraph(graphDepth)
    graph.drawTherm(graphDepth)

});