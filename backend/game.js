const X = 0;
const Y = 1;
const MAX_VEL = 10;
const ACCEL = 1;
const FRICTION = 0.9;
const GRAVITY = -0.7;
const JUMP_FORCE = 15;
const MAX_JUMP = 2;

const backgroundMusic = window.backgroundMusic || new Audio('sounds/gameTrack.mp4');
const deathLava = new Audio('sounds/lavaDeath.mp3');
deathLava.volume = 1;
const deathMonster = new Audio('sounds/monsterDeath.wav');
const victoryMusic = new Audio('sounds/victory.mp3');

deathLava.load();
deathMonster.load();
victoryMusic.load();

var deathLine = 1;

backgroundMusic.volume = 0.5;
backgroundMusic.loop = true;
deathMonster.volume = 0.8;

victoryMusic.loop = true;


// Statistics tracking
const gameStats = JSON.parse(localStorage.getItem('gameStats')) || {
    jumps: 0,
    attacks: 0,
    deaths: 0,
    enemyDeaths: 0,
    lavaDeaths: 0,
    clears: 0
};

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
    // specific method for the enemy because hitbox is not a square/rectangle
    enemyCollision(other, direction) {
        if (direction === "left") { //change hitbox collision for facing left
            return (
                this.left + 20 < other.right &&
                this.right > other.left &&
                this.bottom + 20 < other.top &&
                this.top - 20> other.bottom
            );
        }
        else { // default hitbox when facing right
            return (
                this.left + 20 < other.right &&
                this.right - 65 > other.left &&
                this.bottom + 20 < other.top &&
                this.top - 20> other.bottom
            );
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
        this.attackRange = 200;
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
        if (this.right > 2000) {
            this.left = 2000 - this.width;
            this.velocity[X] = 0;
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
                    gameStats.jumps++;
                    localStorage.setItem('gameStats', JSON.stringify(gameStats));
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

class exit extends GameObject {
    constructor(left, bottom, width, height) {
        super(left, bottom, width, height);
        this.createElement();
    }
    createElement() {
        this.element = document.createElement("div");
        this.element.className = "exit";
        this.element.style.position = "absolute";
        this.updateElementPosition();
        document.getElementById("gameContainer").appendChild(this.element);
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
        this.health = 1;
        this.createElement();
    }

    createElement() {
        this.element = document.createElement("div");
        this.element.className = "enemy";
        this.updateElementPosition();
        document.getElementById("gameContainer").appendChild(this.element);
    }

    move() {
        if (this.platform) {
            if (this.left + this.width >= this.platform.right || this.left <= this.platform.left) {
                this.direction *= -1;
                this.element.style.transform = `scaleX(${this.direction})`;
            }
        } else {
            if (this.left + this.width >= game.worldWidth || this.left <= 0) {
                this.direction *= -1;
                this.element.style.transform = `scaleX(${this.direction})`;
            }
        }
        
        this.left += this.direction * this.speed;
        this.right = this.left + this.width;
        this.updateElementPosition();
    }
}

class ladder extends GameObject {
    constructor(left, bottom, width, height) { 
        super(left, bottom, width, height);
        this.createElement();
    }

    createElement() {
        this.element = document.createElement("div");
        this.element.className = "ladder";
        this.element.style.position = "absolute";
        this.updateElementPosition();
        document.getElementById("gameContainer").appendChild(this.element);
    }
}

class Lava extends GameObject {
    constructor(left, bottom, width, height) {
        super(left, bottom, width, height);
        this.speed = 5;
        this.createElement();
    }

    createElement() {
        this.element = document.createElement("div");
        this.element.className = "lava";
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
        this.statBox = document.getElementById("statBox");
        this.updateScreenBounds();
        window.addEventListener("resize", () => this.updateScreenBounds());
    }

    update() {
        // Horizontal camera movement with bounds
        if (this.follow.left > this.screenFollowRight - this.offsetX) {
            this.offsetX = this.follow.left - this.screenFollowRight;
        } else if (this.follow.left < this.screenFollowLeft - this.offsetX) {
            this.offsetX = this.follow.left - this.screenFollowLeft;
        }
        
        // Vertical camera movement (always follows player)
        this.offsetY = this.follow.bottom - this.screenFollowDown;
        
        // Apply transform to game container
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
        this.ladders = [];
        this.player = null;
        this.camera = null;
        this.lava = null;
        this.deathScreen = new DeathScreen(this);
        this.worldWidth = 2000;
        this.isGameOver = false;
        
        // Store handler references
        this.keyDownHandler = (e) => this.player.handleKeyDown(e);
        this.keyUpHandler = (e) => this.player.handleKeyDown(e);

        // Get difficulty from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const difficulty = urlParams.get('difficulty') || 'normal';
        
        const musicPlaying = localStorage.getItem('musicEnabled') !== 'false';
        if (musicPlaying && backgroundMusic.paused) {
            backgroundMusic.play().catch(e => console.log("Autoplay prevented:", e));
        }

        // Set game parameters based on difficulty
        this.difficultySettings = {
            easy: {
                enemySpeed: 7,
                enemyCount: 0.3,
                lavaRiseSpeed: 5,
                platformCount: 10  
            },
            normal: {
                enemySpeed: 10,
                enemyCount: 0.7,
                lavaRiseSpeed: 7,
                platformCount: 20  
            },
            hard: {
                enemySpeed: 15,
                enemyCount: .99,
                lavaRiseSpeed: 7.5,
                platformCount: 40  
            }
        };
        
        this.currentDifficulty = this.difficultySettings[difficulty] || this.difficultySettings.normal;
        
        this.initialize();
    }

    initialize() {

        this.stopLobbyMusic();

        //reset event listeners to avoid duplicates
        document.removeEventListener("keydown", this.keyDownHandler);
        document.removeEventListener("keyup", this.keyUpHandler);

        // Create player
        this.player = new Player(500, 50, 120, 100);

        // Update handler references to use the new player
        this.keyDownHandler = (e) => this.player.handleKeyDown(e);
        this.keyUpHandler = (e) => this.player.handleKeyUp(e);

        // Create lava (full width of world, starting below screen)
        this.lava = new Lava(0, -4000, this.worldWidth, 3000);

        this.ladder = new ladder(980, -20, 100, 620);
        this.ladders.push(this.ladder);
        
        // Create platforms
        this.platforms = [];
        const platformCount = this.currentDifficulty.platformCount; // Use difficulty setting
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
            
            let x = Math.random() * 2000;
            let y = lastY + verticalSpacing;
            
            if (x + width > this.worldWidth) {
                x = this.worldWidth - width - 50;
            }
            
            //create ladders for each platform
            if (i < platformCount - 1) {
                const newLadder = new ladder(x + Math.random() * 1000, y, 100, 620);
                this.ladders.push(newLadder);                
            }
            else {
                //create exit door
                const exitDoor = new exit(x + Math.random() * 1000, y, 200, 200);
                this.gameContainer.appendChild(exitDoor.element);
                this.exit = exitDoor;
                this.ladders.push(exitDoor);
            }
            
            this.platforms.push(new Platform(x, y, width, height));
            
            lastX = x;
            lastY = y;
            
            if (Math.random() < this.currentDifficulty.enemyCount) { 
                const enemyWidth = 120;
                const enemyHeight = 100;
                this.enemies.push(new Enemy(
                    x + Math.random() * (width - enemyWidth),
                    y + height,
                    enemyWidth,
                    enemyHeight,
                    this.currentDifficulty.enemySpeed,  // Use difficulty-based speed
                    this.platforms[this.platforms.length - 1]
                ));
            }
        }
        
        // Set lava speed based on difficulty
        this.lava.speed = this.currentDifficulty.lavaRiseSpeed;
        // Initialize camera
        this.camera = new Camera(this.player, this.gameContainer);
        
        // Add new event listeners
        document.addEventListener("keydown", this.keyDownHandler);
        document.addEventListener("keyup", this.keyUpHandler);
    
        // Start game loop
        this.gameLoop();
    }

    stopLobbyMusic() {
        const lobbyMusic = window.lobbyMusic || new Audio('sounds/background.mp4');
        lobbyMusic.pause();
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
                    gameStats.attacks++;
                    localStorage.setItem('gameStats', JSON.stringify(gameStats));
                    enemy.element.style.backgroundImage = "url('enemyDeath.png')";
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

    checkObjectCollision() {
        const player = this.player;
        const lava = this.lava;
        const exit = this.exit;
    
        if (player.collidesWith(exit)) {
            this.handlePlayerWin("You've escaped successfully!");
            return;
        }
    
        if (player.collidesWith(lava)) {
            deathLine = Math.floor(Math.random() * 4) + 1; // Generates 1, 2, 3, or 4
            deathLava.play();
            switch(deathLine) {
                case 1:
                    this.handlePlayerDeath("Wayyy too slow");
                    break;
                case 2:
                    this.handlePlayerDeath("Can't you climb faster?");
                    break;
                case 3:
                    this.handlePlayerDeath("Terminator be like");
                    break;
                case 4:
                    this.handlePlayerDeath("Did you know you can jump using W?");
                    break;
                default:
                    this.handlePlayerDeath("Player drowned in lava!");
            }
        }
    
        this.ladders.forEach(ladder => {
            if (player.collidesWith(ladder)) {
                player.numJumps = 1;
            }
        });
    }

    handlePlayerDeath(reason) {
        this.isGameOver = true;
        gameStats.deaths++;
    
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
        
        if (reason.includes("enemy")) {
            gameStats.enemyDeaths++;
        } else if (reason.includes("lava")) {
            gameStats.lavaDeaths++;
        }
        
        localStorage.setItem('gameStats', JSON.stringify(gameStats));
        
        const title = reason.includes("exit") ? "VICTORY!" : "GAME OVER";
        this.deathScreen.show(reason, title);
    }

    // In Game class:
    handlePlayerWin(message) {
        gameStats.clears++;
        localStorage.setItem('gameStats', JSON.stringify(gameStats));
        this.deathScreen.show(message, "VICTORY!");
        this.isGameOver = true;
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
        victoryMusic.play();
    }


    resetGame() {
        // Clear the game state by reinitializing the container
        this.gameContainer.innerHTML = '<div id="box"></div>';

        backgroundMusic.play();
        backgroundMusic.currentTime = 0;

        victoryMusic.pause();
        victoryMusic.currentTime = 0;
        
        // Clear all arrays
        this.enemies = [];
        this.platforms = [];
        this.ladders = [];
        
        // Reset game state
        this.isGameOver = false;
        
        // Hide death screen if visible
        this.deathScreen.hide();
        
        // Reinitialize everything (this will recreate all game objects)
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
        this.checkObjectCollision();
        this.camera.update();
        
        requestAnimationFrame(() => this.gameLoop());
    }

    checkPlayerEnemyCollision(enemy) {
        deathMonster.currentTime = 0;
        deathMonster.play().catch(e => console.log("Monster death sound error:", e));
        deathLine = Math.floor(Math.random() * 4) + 1; // Generates 1, 2, 3, or 4
        if (this.player.enemyCollision(enemy, this.player.direction)) {
            switch(deathLine) {
                case 1:
                    this.handlePlayerDeath("Did you really die to these guys?");
                    break;
                case 2:
                    this.handlePlayerDeath("GG go next");
                    break;
                case 3:
                    this.handlePlayerDeath("Movement Diff");
                    break;
                case 4:
                    this.handlePlayerDeath("Maybe try hitting them next time?");
                    break;
                default:
                    this.handlePlayerDeath("Did you really die to these guys?");
            }
        }
    }    
}

// Start the game
let game;
window.onload = () => {
    game = new Game();
};
