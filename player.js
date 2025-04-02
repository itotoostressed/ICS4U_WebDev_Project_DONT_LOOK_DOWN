const box = document.getElementById("box");
const platform = document.getElementById("platform");


// constants for the x and y axis
const X = 0; 
const Y = 1;

var platforms  = []; // array of platforms
var ground = 0; // the height of the ground
var walls = 0; // array of walls

var cameraOffsetX = 0; // the offset of the camera
var gameContainer = document.getElementById("gameContainer");
var velocity = [0,0];
var position = [100,200];
var numJumps = 0;
var isJumping = false;
var isUnderneath = true;
var isCrouching = false;

// constants for the player's movement
const maxVel = 10;
const accel = 1;
const friction = .9;
const gravity = -.7;
const JUMP_FORCE = 15; // how high the player jumps
const maxJump = 2; // how many times the player can jump
var screenFollowRight =  window.innerWidth*.75;
var screenFollowLeft =  window.innerWidth*.25; 


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
platformConstructor(9000, 200, 200, 20);
platformConstructor(5000, 200, 200, 20);


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
        
    // update position
    position[X] += velocity[X];
    position[Y] += velocity[Y];
    
    collisionDetection();

    if (position[X] > screenFollowRight) {
        // If moving right past the threshold, shift the camera
        cameraOffsetX = -(position[X] - screenFollowRight);
        if (keys_pressed.left) {
            
        }
    } 
    else if (position[X] < screenFollowLeft) {
        // If moving left past the threshold, shift the camera
        cameraOffsetX = -(position[X] - screenFollowLeft);
    }

    // **Apply the camera offset correctly**
    gameContainer.style.transform = `translateX(${cameraOffsetX}px)`;

    // update the position of the box
    box.style.left = intToPx(position[X]);
    box.style.bottom = intToPx(position[Y]);

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
    if (position[X] >= 10000 - box.offsetWidth) {
        position[X] = 10000 - box.offsetWidth;
        velocity[X] = 0;
        numJumps = 0;
        // platform.left = intToPx(platform.left - velocity[X]);
    }
    else if (position[X] <= 0) {
        position[X] = 0;
        velocity[X] = 0;
        numJumps = 0;
    }
}


function checkUnderneath() {
    ground = 0; 
    isUnderneath = true;

    platforms.forEach(platform => {
        if (position[Y] >= platform.top && position[X] + box.offsetWidth > platform.left && position[X] < platform.left + platform.width) { 
            ground = platform.top;
            isUnderneath = false;
        }
    });
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

    const platform = {
        left: left,
        bottom: bottom,
        width: width,
        height: height,
        top: bottom + height
    };

    platforms.push(platform);
    gameContainer.appendChild(platformDiv);
}

function playerAnimate (state) {
    switch(state) {
        case "crouch":
            box.style.backgroundImage = URL('tileset_1');
            break;
        case "jump":
            break;
        case "attack" :
            break;
    }
}
