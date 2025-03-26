const box = document.getElementById("box");

// constants for the x and y axis
const X = 0; 
const Y = 1;

// constants for the player's movement
const maxVel = 10;
const accel = 1;
const friction = .9;
const gravity = .5;
const JUMP_FORCE = 10; // how high the player jumps
const maxJump = 2; // how many times the player can jump

var velocity = [0,0];
var position = [0,0];
var numJumps = 0;
var isJumping = false;

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
        velocity[Y] -= gravity;
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

    // check if the player is on the ground
    if (position[Y] <= 0) {
        position[Y] = 0;
        velocity[Y] = 0;
        numJumps = 0;
    }
    
    // update the position of the box
    box.style.left = intToPx(position[X]);
    box.style.bottom = intToPx(position[Y]);

    requestAnimationFrame(updatePosition);
}

function intToPx(num) {
    return (num + "px");
}