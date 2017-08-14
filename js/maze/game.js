"use strict";

var POPULATION_SIZE = 140;

var status = null;
var canvas = null;
var ctx = null;
var intervalId = 0;
var maze = null;
var gen = null;
var genNo = 1;
var foundExit = false;                  // this variable shouldn't be needed!

window.onload = function() {
    status = document.getElementById("status");
    canvas = document.getElementById("maze");
    ctx = canvas.getContext("2d");

    maze = makeMaze();
    maze.render(ctx, canvas.width, canvas.height);
    
    gen = makeGeneration(POPULATION_SIZE);

    document.getElementById("runButton").onclick = function() {
        if (this.innerText == "Run") {
            run();
            this.innerText = "Stop";
        }
        else {
            stop();
            this.innerText = "Run";
        }
    };
};

function run() {
    genNo = 1;
    foundExit = false;                      
    
    intervalId = setInterval(function() {
        if (foundExit) {
            // print diags to make sure this code isn't being run.
            return;
        }
        status.innerHTML = "Generation " + genNo;

        gen.exercise(maze);
        
        maze.render(ctx, canvas.width, canvas.height);
        gen.fittest.renderPath(ctx, canvas.width, canvas.height);
        
        if (gen.fittest.foundExit) {
            foundExit = true;
            clearInterval(intervalId);
            return;
        }

        gen = gen.nextGeneration();
        
        genNo += 1;
    }, 100);
}

function stop() {
    clearInterval(intervalId);

    status.innerHTML += ". Stopped!"
}
