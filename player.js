// Constants
const X = 0;
const Y = 1;
const MAX_VEL = 10;
const ACCEL = 1;
const FRICTION = 0.9;
const GRAVITY = -0.7;
const JUMP_FORCE = 15;
const MAX_JUMP = 2;

let charSheetPos;
let frameNum = 0;

class GameObject {
    constructor(left, bottom, width, height) {
        this.left = left;
        this.bottom = bottom;
        this.width = width;
        this.height = height;
        this.top = bottom + height;
        this.right = left + width;
        this.element = null;
        this.onPlatform = false;
    }

    intToPx(num) {
        return `${num}px`;
    }

    pxToInt(px) {
        return parseInt(px.replace("px", ""));
    }

    updateElementPosition() {
        if (this.element) {
            this.element.style.left = this.intToPx(this.left);
            this.element.style.bottom = this.intToPx(this.bottom);
            this.element.style.width = this.intToPx(this.width);
            this.element.style.height = this.intToPx(this.height);
        }
    }

    collidesWith(other) {
        return (
            this.left < other.right &&
            this.right > other.left &&
            this.bottom < other.top &&
            this.top > other.bottom
        );
    }
}

class Player extends GameObject {
    constructor(left, bottom, width, height) {
        super(left, bottom, width, height);
        this.element = document.getElementById("box");
        this.velocity = [0, 0];
        this.ground = 0;
        this.numJumps = 0;
        this.isJumping = false;
        this.isAttacking = false;
        this.attackCooldown = 0;
        this.attackRange = 100;
        this.direction = "";
        this.SPRITE_FRAMES = { //adjust as needed
            idle: [[0, 0]], //x and y positions for idle frames
            "walk": {
                currentFrame: 0,
                "frames": [
                    [0, 150],   // Frame 0
                    [100, 150], // Frame 1
                    [200, 150], // Frame 2
                    [300, 150] // Frame 3
                ]
        },
            jump: [[0, 300]],
            attack: [
                [0, 450],   // Frame 0
                [100, 450], // Frame 1
            ],
            // Add other states...
        };

        this.SPRITE_FRAMES_2 = {
            walk: {
                currentFrame: 0,
                frames: [ 
                    [0, 150],   // Frame 0
                    [100, 150], // Frame 1
                    [200, 150], // Frame 2
                    [300, 150], // Frame 3
                ]
            }
        }
        this.keysPressed = {
            left: false,
            right: false,
            up: false,
            down: false
        };
    }

    attack() {
        if (this.attackCooldown <= 0) {
            this.isAttacking = true;
            this.attackCooldown = 30;
            
            // Visual feedback
            this.element.style.boxShadow = "0 0 15px yellow";
            setTimeout(() => {
                this.element.style.boxShadow = "0px 4px 10px #202020";
            }, 100);
            
            return true;
        }
        return false;
    }

    updatePosition(platforms) {
        // Horizontal movement
        let xPos; //positions for the sprite sheet
        let yPos;
        
        if (frameNum <200) {frameNum += 1;}
        else {frameNum = 0;}
        
        if (this.keysPressed.left) {
            this.velocity[X] -= ACCEL;
            this.direction = "left";
        } else if (this.keysPressed.right) {
            this.velocity[X] += ACCEL;
            this.direction = "right";
        }
        if (frameNum % 5 === 0) { 
            console.log(frameNum);
            charSheetPos = this.animate("walk", this.direction);
            
            [xPos, yPos] = charSheetPos;
            this.element.style.backgroundPosition = `${xPos}px ${yPos}px`;
        } 

        // Vertical movement
        if (this.keysPressed.down) {
            this.velocity[Y] -= ACCEL;
        } else if (!this.keysPressed.up) {
            this.velocity[Y] += GRAVITY;
        }

        // Apply friction
        if (!this.keysPressed.left && !this.keysPressed.right) {
            this.velocity[X] *= FRICTION;
        }

        if (this.attackCooldown > 0) {
            this.attackCooldown--;
        } else {
            this.isAttacking = false;
        }

        // Limit velocity
        this.velocity[X] = Math.max(Math.min(this.velocity[X], MAX_VEL), -MAX_VEL);

        // Update position
        this.left += this.velocity[X];
        this.bottom += this.velocity[Y];
        this.top = this.bottom + this.height;
        this.right = this.left + this.width;        

        // Update collision detection
        this.collisionDetection(platforms);
        this.updateElementPosition();
    }

    animate(state, dir) {
        // Get pre-defined coordinates

        //input frames as "frames" because frames: is not actually a variable, it is a string. frames: is equivalent to "frames".
        //currentFrame is a variable that is used to get the current frame of the animation. Therefore it is ok.
        //if we setup something like let frames = "frames" then we would have to use frames["currentFrame"] instead of currentFrame.

        const animation = this.SPRITE_FRAMES[state];
        
        // Get current frame
        const currentFrame = animation.currentFrame;
        const [xPos, yPos] = animation.frames[currentFrame];
        
        // Update to next frame (loop if needed)
        animation.currentFrame = (currentFrame + 1) % animation.frames.length;
        
        // Handle direction
        if (dir === "left") {
            this.element.style.transform = "scaleX(-1)";
        } else if (dir === "right"){
            this.element.style.transform = "scaleX(-1)";
        }
        
        return [xPos, yPos];
        /*
        const currentFrame = this.SPRITE_FRAMES[state]["currentFrame"]
        const [xPos, yPos] = this.SPRITE_FRAMES[state]["frames"][currentFrame];

        // Handle direction
        if (dir === "left") {
            this.element.style.transform = "scaleX(-1)";
        }
        else {
            this.element.style.transform = "scaleX(1)";
        }
        
        return [xPos, yPos];*/
    }

    collisionDetection(platforms) {
        // Check ground collision
        if (this.bottom <= this.ground) {
            this.bottom = this.ground;
            this.velocity[Y] = 0;
            this.numJumps = 0;
        }

        // Check platform collisions
        this.checkUnderneath(platforms);

        // Screen boundaries
        if (this.left <= 0) {
            this.left = 0;
            this.velocity[X] = 0;
        }
    }

    checkUnderneath(platforms) {
        this.ground = 0;
        platforms.forEach(platform => {
            if (this.bottom >= platform.top && this.right > platform.left && this.left < platform.right) {
                this.ground = platform.top;
                this.onPlatform = true;
            }
            if (this.keysPressed.down && this.onPlatform) {
                this.ground = 0;
            }
        });
    }

    handleKeyDown(event) {
        switch (event.key.toLowerCase()) {
            case "a":
                this.keysPressed.left = true;
                break;
            case "d":
                this.keysPressed.right = true;
                break;
            case "w":
            case " ":
                if (this.numJumps < MAX_JUMP) {
                    this.velocity[Y] = JUMP_FORCE;
                    this.numJumps++;
                    this.isJumping = true;
                }
                break;
            case "s":
                this.keysPressed.down = true;
                break;
            case "e":
                if (this.attack()) {
                    game.checkAttackHit(this.direction);
                }
                break;
        }
    }

    handleKeyUp(event) {
        switch (event.key.toLowerCase()) {
            case "a":
                this.keysPressed.left = false;
                break;
            case "d":
                this.keysPressed.right = false;
                break;
            case "w":
            case " ":
                this.keysPressed.up = false;
                break;
            case "s":
                this.keysPressed.down = false;
                break;
        }
    }
}

class Platform extends GameObject {
    constructor(left, bottom, width, height) {
        super(left, bottom, width, height);
        this.createElement();
    }

    createElement() {
        this.element = document.createElement("div");
        this.element.className = "platform";
        this.element.style.position = "absolute";
        this.element.style.backgroundColor = "#654321";
        this.updateElementPosition();
        document.getElementById("gameContainer").appendChild(this.element);
    }
}

class Enemy extends GameObject {
    constructor(left, bottom, width, height, speed = 5, platform = null) {
        super(left, bottom, width, height);
        this.speed = speed;
        this.platform = platform;
        this.direction = 1;
        this.createElement();
    }

    createElement() {
        this.element = document.createElement("div");
        this.element.className = "enemy";
        this.element.style.position = "absolute";
        this.element.style.backgroundColor = "red";
        this.updateElementPosition();
        document.getElementById("gameContainer").appendChild(this.element);
    }

    move() {
        if (this.platform) {
            // Move within platform bounds
            if (this.left + this.width >= this.platform.right || this.left <= this.platform.left) {
                this.direction *= -1;
            }
        } else {
            // Fallback: move within world bounds
            if (this.left + this.width >= game.worldWidth || this.left <= 0) {
                this.direction *= -1;
            }
        }
        
        this.left += this.direction * this.speed;
        this.right = this.left + this.width;
        this.updateElementPosition();
    }
}

class Camera {
    constructor(followObject, container) {
        this.follow = followObject;
        this.container = container;
        this.offsetX = 0;
        this.offsetY = 0;
        this.updateScreenBounds();
        window.addEventListener("resize", () => this.updateScreenBounds());
    }

    update() {
        if (this.follow.left > this.screenFollowRight - this.offsetX) {
            this.offsetX = this.follow.left - this.screenFollowRight;
        } else if (this.follow.left < this.screenFollowLeft - this.offsetX) {
            this.offsetX = this.follow.left - this.screenFollowLeft;
        }
        if (this.follow.bottom > this.screenFollowUp - this.offsetY) {
            this.offsetY = this.follow.bottom - this.screenFollowUp;
        } else if (this.follow.bottom < this.screenFollowDown - this.offsetY) {
            this.offsetY = this.follow.bottom - this.screenFollowDown;
        }
        this.container.style.transform = `translate(${-this.offsetX}px, ${this.offsetY}px)`;
    }

    updateScreenBounds() {
        this.screenFollowRight = window.innerWidth * 0.75;
        this.screenFollowLeft = window.innerWidth * 0.25;
        this.screenFollowUp = window.innerHeight * 0.75;
        this.screenFollowDown = window.innerHeight * 0.25;
    }
}

class Game {
    constructor() {
        this.gameContainer = document.getElementById("gameContainer");
        this.platforms = [];
        this.enemies = [];
        this.player = null;
        this.camera = null;
        this.worldWidth = 3000;
        this.initialize();
    }

    initialize() {
        // Create player
        this.player = new Player(100, 200, 100, 100);
    
        // Create platforms
        this.platforms = [];
        const platformCount = 20; // Number of platforms to generate
        const minWidth = 1100;
        const maxWidth = 1500;
        const minHeight = 20;
        const verticalSpacing = 250; // Vertical spacing between platform layers
    
        // Create ground platform
        this.platforms.push(new Platform(0, 0, this.worldWidth, 20));
    
        // Generate random platforms
        let lastX = 0;
        let lastY = 0;
        
        for (let i = 0; i < platformCount; i++) {
            // Random width and height
            const width = Math.floor(Math.random() * (maxWidth - minWidth + 1)) + minWidth;
            const height = minHeight; // Keep height consistent or use random if you prefer
            
            // Random position with some constraints
            let x = lastX + Math.random() * 300;
            let y = lastY + verticalSpacing; 
            
            // Ensure platforms stay within world bounds
            if (x + width > this.worldWidth) {
                x = this.worldWidth - width - 50;
            }
            
            // Create the platform
            this.platforms.push(new Platform(x, y, width, height));
            
            // Update last positions for next platform
            lastX = x;
            lastY = y;
            
            // Random chance to create an enemy on this platform
            if (Math.random() > 0.7) { // 30% chance
                const enemyWidth = 80;
                const enemyHeight = 160;
                this.enemies.push(new Enemy(
                    x + enemyWidth,
                    y + height,
                    enemyWidth,
                    enemyHeight,
                    5,
                    this.platforms[this.platforms.length - 1] // Assign the platform to the enemy
                ));
            }
        }
    
        // Create enemies (you can keep your original enemy creation or use the random one above)
        // this.enemies = [new Enemy(this.platforms[1].left, this.platforms[1].top, 80, 160)];
    
        // Initialize camera
        this.camera = new Camera(this.player, this.gameContainer);
    
        // Set up event listeners
        document.addEventListener("keydown", (e) => this.player.handleKeyDown(e));
        document.addEventListener("keyup", (e) => this.player.handleKeyUp(e));
    
        // Start game loop
        this.gameLoop();
    }
    checkAttackHit(direction) {
        const attackRange = this.player.attackRange;
        const attackHitbox = {
            left: direction > 0 ? this.player.right : this.player.left - attackRange,
            right: direction > 0 ? this.player.right + attackRange : this.player.left,
            bottom: this.player.bottom,
            top: this.player.top
        };

        // Visual feedback
        this.showAttackRange(attackHitbox);

        // Check enemy collisions
        this.enemies.forEach(enemy => {
            if (this.checkHitboxCollision(attackHitbox, enemy)) {
                enemy.element.style.backgroundColor = "purple";
                setTimeout(() => {
                    enemy.element.style.backgroundColor = "red";
                }, 200);
            }
        });
    }

    showAttackRange(hitbox) {
        const originalStyle = this.player.element.style.cssText;
        this.player.element.style.width = `${hitbox.right - hitbox.left}px`;
        this.player.element.style.left = `${hitbox.left - this.camera.offsetX}px`;
        this.player.element.style.opacity = "0.7";
        setTimeout(() => {
            this.player.element.style.cssText = originalStyle;
        }, 100);
    }

    checkHitboxCollision(hitbox, enemy) {
        return (
            hitbox.left < enemy.right &&
            hitbox.right > enemy.left &&
            hitbox.bottom < enemy.top &&
            hitbox.top > enemy.bottom
        );
    }

    gameLoop() {
        this.player.updatePosition(this.platforms);
        this.enemies.forEach(enemy => {
            enemy.move(Platform);
            this.checkPlayerEnemyCollision(enemy);
        });
        this.camera.update();
        requestAnimationFrame(() => this.gameLoop());
    }

    checkPlayerEnemyCollision(enemy) {
        if (this.player.collidesWith(enemy)) {
            console.log("Player collided with enemy!");
            box.style.backgroundColor = "red";
        }
    }
}

// Start the game
let game;
window.onload = () => {
    game = new Game();
};
