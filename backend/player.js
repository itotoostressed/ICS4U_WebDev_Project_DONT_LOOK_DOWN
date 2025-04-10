/*
NOTES!
Please create the following:
-Ladder
-Tall & Short enemies (rename current enemies to tall enemies or whatever)
-Main Menu
-Login & Data Storage

Please fix: 
-Death detection by lava
*/
// Constants
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
            this.left + 20 < other.right &&
            this.right - 25 > other.left &&
            this.bottom < other.top &&
            this.top - 20> other.bottom
        );
    }
}

class Player extends GameObject {
    constructor(left, bottom, width, height) {
        super(left, bottom, width, height);
        this.element = document.getElementById("box");
        this.element.style.transformOrigin = "center";
        this.element.style.willChange = "transform";
        this.velocity = [0, 0];
        this.ground = 0;
        this.numJumps = 0;
        this.isJumping = false;
        this.isAttacking = false;
        this.attackCooldown = 0;
        this.attackRange = 1000;
        this.animationSpeed = 5;
        this.animationCounter = 0;
        this.direction = 1;
        this.state = "idle";
        this.SPRITE_FRAMES = {
            idle: [[-10, 20]],
            walk: {
                currentFrame: 0,
                frames: [
                    [-10, 474],
                    [-170, 470],
                    [-358, 466],
                    [-531, 473]
                ]
            },
            jump: {
                currentFrame: 0,
                frames: [
                    [0, 320],
                    [-178, 320],
                    [-358, 320],
                    [-531, 320]
                ]
            },
            attack: {
                currentFrame: 0,
                frames: [
                    [5, 168],
                    [-178, 168],
                    [-354, 150],
                    [-531, 170],
                    [-708, 170],
                    [-880, 170]
                ]
            },
        };
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
            this.attackCooldown = 30; // Cooldown period for attack
            
            return true;
        }
        return false;
    }

    updatePosition(platforms) {
        if (frameNum < 200) { frameNum += 1; }
        else { frameNum = 0; }
        
        if (this.keysPressed.left) {
            this.velocity[X] -= ACCEL;
            this.direction = "left";
            this.state = "walk";
        } else if (this.keysPressed.right) {
            this.velocity[X] += ACCEL;
            this.direction = "right";
        }
        
        if (this.isAttacking) {
            this.state = "attack";
        } else if (this.isJumping) {
            this.state = "jump"; 
        } else if (this.keysPressed.left || this.keysPressed.right) {
            this.state = "walk";
        } else {
            this.state = "idle";
        }

        this.animationCounter++;
        if (this.animationCounter % this.animationSpeed === 0) {
            charSheetPos = this.animate(this.state, this.direction);
            const [xPos, yPos] = charSheetPos;
            this.element.style.backgroundPosition = `${xPos}px -${yPos}px`;
        }

        if (this.keysPressed.down) {
            this.velocity[Y] -= ACCEL;
        } else if (!this.keysPressed.up) {
            this.velocity[Y] += GRAVITY;
        }

        if (!this.keysPressed.left && !this.keysPressed.right) {
            this.velocity[X] *= FRICTION;
        }

        if (this.attackCooldown > 0) {
            this.attackCooldown--;
        } else {
            this.isAttacking = false;
        }

        this.velocity[X] = Math.max(Math.min(this.velocity[X], MAX_VEL), -MAX_VEL);

        this.left += this.velocity[X];
        this.bottom += this.velocity[Y];
        this.top = this.bottom + this.height;
        this.right = this.left + this.width;

        this.collisionDetection(platforms);
        this.updateElementPosition();
    }

    animate(state, dir) {
        if (!this.SPRITE_FRAMES[state]) {
            console.error(`Missing animation state: ${state}`);
            return [0, 20];
        }
    
        const animation = this.SPRITE_FRAMES[state];
        const frames = Array.isArray(animation) ? animation : animation.frames;
        let currentFrame = Array.isArray(animation) ? 0 : animation.currentFrame;
        
        const [xPos, yPos] = frames[currentFrame];
        
        if (!Array.isArray(animation)) {
            animation.currentFrame = (currentFrame + 1) % frames.length;
        }
    
        if (dir === "left") {
            this.element.style.transform = "scaleX(-1)";
        } else if (dir === "right") {
            this.element.style.transform = "scaleX(1)";
        }
        
        return [xPos, yPos];
    }

    collisionDetection(platforms) {
        if (this.bottom <= this.ground) {
            this.bottom = this.ground;
            this.velocity[Y] = 0;
            this.numJumps = 0;
            this.isJumping = false;
        }

        this.checkUnderneath(platforms);

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
        this.isAlive = true;
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
        this.health = 2;
        this.createElement();
    }

    createElement() {
        this.element = document.createElement("div");
        this.element.className = "enemy";
        this.element.style.position = "absolute";
        this.element.style.backgroundColor = "#FF5E5E";
        this.updateElementPosition();
        document.getElementById("gameContainer").appendChild(this.element);
    }

    move() {
        if (this.platform) {
            if (this.left + this.width >= this.platform.right || this.left <= this.platform.left) {
                this.direction *= -1;
            }
        } else {
            if (this.left + this.width >= game.worldWidth || this.left <= 0) {
                this.direction *= -1;
            }
        }
        
        this.left += this.direction * this.speed;
        this.right = this.left + this.width;
        this.updateElementPosition();
    }
}

class Ladders extends GameObject {
    constructor(left, bottom, width, height) { 
        super(left, bottom, width, height);
        this.createElement();
    }

    createElement() {
        this.element = document.createElement("div");
        this.element.className = "ladder";
        this.element.style.position = "absolute";
        this.element.style.backgroundColor = "#00FF00";
        this.updateElementPosition();
        document.getElementById("gameContainer").appendChild(this.element);
    }
}

class Lava extends GameObject {
    constructor(left, bottom, width, height) {
        super(left, bottom, width, height);
        this.speed = 0;
        this.createElement();
    }

    createElement() {
        this.element = document.createElement("div");
        this.element.className = "lava";
        this.element.style.position = "absolute";
        this.element.style.width = this.intToPx(this.width);
        this.element.style.height = this.intToPx(this.height);
        this.updateElementPosition();
        document.getElementById("gameContainer").appendChild(this.element);
    }

    update() {
        this.bottom += this.speed;
        this.top = this.bottom + this.height;
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
        this.screenFollowUp = window.innerHeight * 0.65;
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
        this.lava = null;
        this.worldWidth = 2000;
        this.isGameOver = false;
        
        // Store handler references
        this.keyDownHandler = (e) => this.player.handleKeyDown(e);
        this.keyUpHandler = (e) => this.player.handleKeyDown(e);
        
        this.initialize();
    }

    initialize() {
        //reset event listeners to avoid duplicates
        document.removeEventListener("keydown", this.keyDownHandler);
        document.removeEventListener("keyup", this.keyUpHandler);

        // Create player
        this.player = new Player(500, 50, 120, 100);

        // Update handler references to use the new player
        this.keyDownHandler = (e) => this.player.handleKeyDown(e);
        this.keyUpHandler = (e) => this.player.handleKeyUp(e);

        // Create lava (full width of world, starting below screen)
        this.lava = new Lava(0, -3100, this.worldWidth);
    
        // Create platforms
        this.platforms = [];
        const platformCount = 20;
        const minWidth = 1100;
        const maxWidth = 1500;
        const minHeight = 20;
        const verticalSpacing = 600;
    
        // Create ground platform
        this.platforms.push(new Platform(-20, -20, this.worldWidth, 20));
    
        // Generate random platforms
        let lastX = 0;
        let lastY = 0;
        
        for (let i = 0; i < platformCount; i++) {
            const width = Math.floor(Math.random() * (maxWidth - minWidth + 1)) + minWidth;
            const height = minHeight;
            
            let x = Math.random() * 1000;
            let y = lastY + verticalSpacing;
            
            if (x + width > this.worldWidth) {
                x = this.worldWidth - width - 50;
            }
            
            this.platforms.push(new Platform(x, y, width, height));
            
            lastX = x;
            lastY = y;
            
            if (Math.random() > 0.1) { 
                const enemyWidth = 80;
                const enemyHeight = 160;
                this.enemies.push(new Enemy(
                    x + Math.random() * (width - enemyWidth),
                    y + height,
                    enemyWidth,
                    enemyHeight,
                    5,
                    this.platforms[this.platforms.length - 1]
                ));
            }
        }
    
        // Initialize camera
        this.camera = new Camera(this.player, this.gameContainer);
        
        // Add new event listeners
        document.addEventListener("keydown", this.keyDownHandler);
        document.addEventListener("keyup", this.keyUpHandler);
    
        // Start game loop
        this.gameLoop();
    }

    checkAttackHit(direction) {
        const playerMidX = this.player.left + (this.player.width / 2);
        
        const attackHitbox = {
            left: direction === "left" ? this.player.left - this.player.attackRange : playerMidX,
            right: direction === "right" ? this.player.right + this.player.attackRange : playerMidX,
            top: this.player.top,
            bottom: this.player.bottom
        };
    
        this.enemies.forEach((enemy, index) => {
            if (this.checkHitboxCollision(attackHitbox, enemy)) {
                enemy.health--;
                if (enemy.health <= 0) {
                    enemy.element.style.backgroundColor = "purple";
                    setTimeout(() => {
                        this.gameContainer.removeChild(enemy.element);
                        this.enemies.splice(index, 1);
                    }, 200);
                }
            }
        });
    }

    checkHitboxCollision(hitbox, enemy) {
        return (
            hitbox.left < enemy.right &&
            hitbox.right > enemy.left &&
            hitbox.bottom < enemy.top &&
            hitbox.top > enemy.bottom
        );
    }

    checkLavaCollision() {
        if (this.player.collidesWith(this.lava)) {
            this.handlePlayerDeath("Drowned in lava!");
        }
    }

    handlePlayerDeath(reason) {
        console.log(`Player died! Reason: ${reason}`);
        this.isGameOver = true;
        
        const deathScreen = document.createElement("div");
        deathScreen.style.position = "fixed";
        deathScreen.style.top = "0";
        deathScreen.style.left = "0";
        deathScreen.style.width = "100%";
        deathScreen.style.height = "100%";
        deathScreen.style.backgroundColor = "rgba(0,0,0,0.8)";
        deathScreen.style.color = "white";
        deathScreen.style.display = "flex";
        deathScreen.style.flexDirection = "column";
        deathScreen.style.justifyContent = "center";
        deathScreen.style.alignItems = "center";
        deathScreen.style.zIndex = "1000";
        
        deathScreen.innerHTML = `
            <h1>Game Over</h1>
            <p>${reason}</p>
            <button id="restartButton" style="padding: 10px 20px; font-size: 18px; margin-top: 20px;">Restart Game</button>
        `;
        
        document.body.appendChild(deathScreen);
        
        document.getElementById("restartButton").addEventListener("click", () => {
            document.body.removeChild(deathScreen);
            this.resetGame();
        });
    }

    resetGame() {
        // Clear the game state
        this.gameContainer.innerHTML = '<div id="box"></div>';
        
        // Reset player state
        if (this.player) {
            this.player.keysPressed = {
                left: false,
                right: false,
                up: false,
                down: false
            };
            this.player.numJumps = 0;
            this.player.isJumping = false;
            this.player.velocity = [0, 0];
        }
        
        // Clear other game objects
        this.enemies = [];
        this.platforms = [];
        this.isGameOver = false;
        
        // Reinitialize
        this.initialize();
    }

    gameLoop() {
        if (this.isGameOver) return;
        
        this.player.updatePosition(this.platforms);
        this.enemies.forEach(enemy => {
            enemy.move();
            this.checkPlayerEnemyCollision(enemy);
        });
        this.lava.update();
        this.checkLavaCollision();
        this.camera.update();
        
        requestAnimationFrame(() => this.gameLoop());
    }

    checkPlayerEnemyCollision(enemy) {
        if (this.player.collidesWith(enemy)) {
            this.handlePlayerDeath("Killed by enemy!");
        }
    }
}

// Start the game
let game;
window.onload = () => {
    game = new Game();
};
