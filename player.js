// Constants
const X = 0;
const Y = 1;
const MAX_VEL = 10;
const ACCEL = 1;
const FRICTION = 0.9;
const GRAVITY = -0.7;
const JUMP_FORCE = 15;
const MAX_JUMP = 2;
var onPlatform = false;

class GameObject {
    constructor(left, bottom, width, height) {
        this.left = left;
        this.bottom = bottom
        this.width = width;
        this.height = height;
        this.top = bottom + height;
        this.right = left + width;
        this.element = null;
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
        this.numJumps = 0;
        this.isJumping = false;
        this.isCrouching = false;
        this.ground = 0;
        this.keysPressed = {
            left: false,
            right: false,
            up: false,
            down: false
        };
    }

    updatePosition(platforms) {
        // Horizontal movement
        if (this.keysPressed.left) {
            this.velocity[X] -= ACCEL;
        } else if (this.keysPressed.right) {
            this.velocity[X] += ACCEL;
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
                onPlatform = true;
            }
            if (this.keysPressed.down && onPlatform) {
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
    constructor(left, bottom, width, height, speed = 5) {
        super(left, bottom, width, height);
        this.speed = speed;
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

    move(worldWidth) {
        if (this.left + this.width >= worldWidth || this.left <= 0) {
            this.direction *= -1;
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
        this.updateScreenBounds();
        window.addEventListener("resize", () => this.updateScreenBounds());
    }

    update() {
        if (this.follow.left > this.screenFollowRight - this.offsetX) {
            this.offsetX = this.follow.left - this.screenFollowRight;
        } else if (this.follow.left < this.screenFollowLeft - this.offsetX) {
            this.offsetX = this.follow.left - this.screenFollowLeft;
        }
        this.container.style.transform = `translateX(${-this.offsetX}px)`;
    }

    updateScreenBounds() {
        this.screenFollowRight = window.innerWidth * 0.75;
        this.screenFollowLeft = window.innerWidth * 0.25;
    }
}

class Game {
    constructor() {
        this.gameContainer = document.getElementById("gameContainer");
        this.platforms = [];
        this.enemies = [];
        this.player = null;
        this.camera = null;
        this.worldWidth = 5000;
        this.initialize();
    }

    initialize() {
        // Create player
        this.player = new Player(100, 200, 50, 50);

        // Create platforms
        this.platforms = [
            new Platform(1100, 400, 600, 20),
            new Platform(400, 200, 600, 20),
            new Platform(2000, 200, 600, 20),
            new Platform(5000, 200, 600, 20),
            new Platform(400, 400, 600, 20)
        ];

        // Create enemies
        this.enemies = [new Enemy(1000, 500, 80, 160)];

        // Initialize camera
        this.camera = new Camera(this.player, this.gameContainer);

        // Set up event listeners
        document.addEventListener("keydown", (e) => this.player.handleKeyDown(e));
        document.addEventListener("keyup", (e) => this.player.handleKeyUp(e));

        // Start game loop
        this.gameLoop();
    }

    gameLoop() {
        this.player.updatePosition(this.platforms);
        
        this.enemies.forEach(enemy => {
            enemy.move(this.worldWidth);
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

// Start the game when the page loads
window.onload = () => new Game();
