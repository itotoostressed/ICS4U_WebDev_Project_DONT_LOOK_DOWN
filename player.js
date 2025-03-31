const box = document.getElementById("box");
const platform = document.getElementById("platform");


// constants for the x and y axis
const X = 0; 
const Y = 1;

// constants for the player's movement
const maxVel = 10;
const accel = 1;
const friction = .9;
const gravity = -.5;
const JUMP_FORCE = 10; // how high the player jumps
const maxJump = 2; // how many times the player can jump

var platforms  = []; // array of platforms
var ground = 0; // the height of the ground
var walls = 0; // array of walls


var velocity = [0,0];
var position = [0,0];
var numJumps = 0;
var isJumping = false;
var isUnderneath = true;

box.style.left = intToPx(position[X]);

var keys_pressed = {
    left: false,
    right: false,
    up: false,
    down: false
}

updatePosition();

document.addEventListener("keydown", function (event) {
    
    // check which key was pressed (for optimization can ignore this if the key is the same as the previous but whatever)
    switch (event.key) {

        // left
        case "a": 
        case "A":
            keys_pressed.left = true;
            break;

        // right    
        case "d":
        case "D":
            keys_pressed.right = true;
            break;

        // up (jump)    
         case "w":
         case " ":
            if (numJumps <= maxJump) {
                velocity[Y] = JUMP_FORCE;
                numJumps++;
                isJumping = true;
            }
            
            break;

         // down (crouch)    
         case "s":
         case "S":
             keys_pressed.down = true;
             break;
    }
});

// listen for button RELEASE
document.addEventListener("keyup", function (event) {
    
    // switch the pressed key; pretty self-explanatory
    switch (event.key) {
        case "a":
            keys_pressed.left = false;
            break;
        case "d":
            keys_pressed.right = false;
            break;
        case "w":
        case " ":
            keys_pressed.up = false;
            break;
        case "s":
            keys_pressed.down = false;
            break;
    }
});


platformConstructor(1000, 400, 200, 20);
platformConstructor(500, 200, 200, 20);
platformConstructor(2000, 200, 200, 20);


function updatePosition () {
    // left and right moevement
    if (keys_pressed.left) {
        velocity[X] -= accel;
    }
    else if (keys_pressed.right) {
        velocity[X] += accel;
    }

    //up and down movement
    if (keys_pressed.down) {
        velocity[Y] -= accel;
    }
    else if (!keys_pressed.up) {
        velocity[Y] += gravity;
    }

    // apply gravity/friction when no keys are pressed
    if (!keys_pressed.left && !keys_pressed.right) {
        velocity[X] *= friction;
    }

    //limiting velocity left and right
    if (velocity[X] > maxVel) {
        velocity[X] = maxVel;
    }
    else if (velocity[X] < -maxVel) {
        velocity[X] = -maxVel;
    }

    //limiting velocity up and down
    if (velocity[Y] > maxVel) {
        velocity[Y] = maxVel;
    }
    else if (velocity[Y] < -maxVel) {
        velocity[Y] = -maxVel;
    }
        
    // update position
    position[X] += velocity[X];
    position[Y] += velocity[Y];
    
    collisionDetection();

    // update the position of the box
    box.style.left = intToPx(position[X]);
    box.style.bottom = intToPx(position[Y]);

    // setInterval(updatePosition, 1000/60); // 60 fps
    requestAnimationFrame(updatePosition); 
}

function collisionDetection() {
    // check if the player is on the ground
    if (position[Y] <= ground) {
        position[Y] = ground; // set the position to the ground
        velocity[Y] = 0;
        numJumps = 0;
    }

    checkUnderneath();

    // check if the player is at the edge of the screen
    if (position[X] >= window.innerWidth - box.offsetWidth) {
        position[X] = window.innerWidth - box.offsetWidth;
        velocity[X] = 0;
        numJumps = 0;
    }
    else if (position[X] <= 0) {
        position[X] = 0;
        velocity[X] = 0;
        numJumps = 0;
    }
}


function checkUnderneath() {
    let foundPlatform = false;

    platforms.forEach(platform => {
        if (position[Y] >= platform.top && position[X] + box.offsetWidth > platform.left && position[X] < platform.left + platform.width) { 
            ground = platform.top;
            isUnderneath = false;
            foundPlatform = true;
        }

        // if (position[Y] + box.) make sure that player doesn't phase through the platform
    });

    if (!foundPlatform) {
        ground = 0; 
        isUnderneath = true;
    }
}

function updateMap () {
    while (keys_pressed.right === true && position[X] === window.length) {
        platform.left -= velocity;
    }
}

function intToPx(num) {
    return (num + "px");
}

function pxToInt(px) {
    return parseInt(px.replace("px", ""));
}

function platformConstructor(left, bottom, width, height) {
    const platformDiv = document.createElement("div");
    platformDiv.className = "platform";
    platformDiv.style.position = "absolute";
    platformDiv.style.left = intToPx(left);
    platformDiv.style.bottom = intToPx(bottom);
    platformDiv.style.width = intToPx(width);
    platformDiv.style.height = intToPx(height);
    platformDiv.style.backgroundColor = "black";

    const platform = {
        left: left,
        bottom: bottom,
        width: width,
        height: height,
        top: bottom + height
    };

    platforms.push(platform);
    document.body.appendChild(platformDiv);    
}
