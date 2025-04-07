// Phaser 3 configuration
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    // In your config:
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: true // TURN THIS ON
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

// Game variables
let player;
let platforms;
let enemies;
let cursors;
let attackCooldown = 0;
const MAX_JUMP = 2;
let jumpCount = 0;
let isAttacking = false;
let direction = 1;

function preload() {
    // Load your assets here
    this.load.image('platform', 'assets/platform.png');
    this.load.image('player', 'assets/player.png');
    this.load.image('enemy', 'assets/enemy.png');
    
    // If using sprite sheets for animations:
    // this.load.spritesheet('player', 'assets/player-spritesheet.png', { frameWidth: 32, frameHeight: 48 });
}

function create() {
    // Create world bounds
    this.physics.world.setBounds(0, 0, 3000, 600);

    // Create platforms group
    platforms = this.physics.add.staticGroup();
    
    // Create platform
    platforms.create(0, 580, 'platform').setScale(3000, 2).refreshBody();

    // Player-platform collision
    this.physics.add.collider(player, platforms);

// Enemy-platform collision
    this.physics.add.collider(enemies, platforms);

// Player-enemy collision
    this.physics.add.collider(player, enemies, () => {
        player.setTint(0xff0000);
        this.time.delayedCall(200, () => player.clearTint());
    });
    
    // Create other platforms (similar to your random generation)
    const platformCount = 20;
    const minWidth = 200;
    const maxWidth = 400;
    const verticalSpacing = 150;
    
    let lastX = 0;
    let lastY = 400;
    
    for (let i = 0; i < platformCount; i++) {
        const width = Phaser.Math.Between(minWidth, maxWidth);
        const x = lastX + Phaser.Math.Between(100, 300);
        const y = lastY - verticalSpacing;
        
        if (x + width > 3000) {
            lastX = 0;
            lastY = y;
            continue;
        }
        
        const platform = platforms.create(x, y, 'platform').setScale(width / 400, 0.5).refreshBody();
        
        // 30% chance to add an enemy
        if (Phaser.Math.FloatBetween(0, 1) > 0.7) {
            createEnemy.call(this, x + 50, y - 60);
        }
        
        lastX = x;
        lastY = y;
    }

    // Create player
    player = this.physics.add.sprite(100, 450, 'player');
    player.setCollideWorldBounds(true);
    player.setBounce(0.2);
    player.body.setSize(40, 60);
    
    // Set up camera to follow player
    this.cameras.main.setBounds(0, 0, 3000, 600);
    this.cameras.main.startFollow(player);
    this.cameras.main.setDeadzone(100, 50);

    // Input setup
    cursors = this.input.keyboard.createCursorKeys();
    
    // In the create function, change the attack key handler to:
    this.input.keyboard.on('keydown-E', () => {
        if (attackCooldown <= 0) {
            attack.call(this); // Pass the correct context
        }
    });

// And change the enemy creation to:
if (Phaser.Math.FloatBetween(0, 1) > 0.7) {
    createEnemy.call(this, x + 50, y - 60);
}
    
    // Set up collisions
    this.physics.add.collider(player, platforms);
    
    // Animation setup (if using sprite sheets)
    /*
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });
    
    this.anims.create({
        key: 'turn',
        frames: [ { key: 'player', frame: 4 } ],
        frameRate: 20
    });
    
    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('player', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });
    */
}

function update() {
    // Handle input and movement
    handleMovement();
    
    // Update attack cooldown
    if (attackCooldown > 0) {
        attackCooldown--;
    } else if (isAttacking) {
        isAttacking = false;
        player.setTint(0xffffff); // Remove tint if using visual feedback
    }
    
    // Check enemy collisions
    checkEnemyCollisions();
}

function handleMovement() {
    // Reset horizontal velocity when no input
    if (cursors.left.isDown && cursors.right.isDown) {
        player.setVelocityX(0);
    } else if (cursors.left.isDown) {
        player.setVelocityX(-160);
        direction = -1;
        // player.anims.play('left', true);
    } else if (cursors.right.isDown) {
        player.setVelocityX(160);
        direction = 1;
        // player.anims.play('right', true);
    } else {
        player.setVelocityX(0);
        // player.anims.play('turn');
    }
    
    // Jumping
    if (cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(-330);
        jumpCount = 1;
    } else if (cursors.up.isDown && jumpCount < MAX_JUMP) {
        player.setVelocityY(-330);
        jumpCount++;
    }
}

function attack() {
    attackCooldown = 30;
    isAttacking = true;
    
    // Visual feedback
    player.setTint(0xffff00);
    
    // Create attack hitbox
    const hitbox = this.add.rectangle(
        player.x + (direction * 50), 
        player.y, 
        100, 
        player.height, 
        0xffff00, 
        0.3
    );
    
    this.physics.add.existing(hitbox);
    hitbox.body.setAllowGravity(false);
    
    // Check for enemy hits
    enemies.forEach(enemy => {
        if (this.physics.overlap(hitbox, enemy)) {
            enemy.setTint(0xff00ff);
            this.time.delayedCall(200, () => enemy.clearTint());
        }
    });
    
    // Remove hitbox after short time
    this.time.delayedCall(100, () => hitbox.destroy());
}

function createEnemy(x, y) {
    const enemy = this.physics.add.sprite(x, y, 'enemy');
    enemy.body.setSize(60, 90);
    enemy.setCollideWorldBounds(true);
    enemy.setBounce(0.2);
    enemy.setVelocityX(Phaser.Math.Between(-50, 50));
    
    // Add to enemies array
    if (!enemies) enemies = [];
    enemies.push(enemy);
    
    // Set up collision with platforms
    this.physics.add.collider(enemy, platforms);
    
    // Make enemy patrol
    this.time.addEvent({
        delay: 2000,
        callback: () => {
            if (enemy.active) {
                enemy.setVelocityX(-enemy.body.velocity.x);
            }
        },
        loop: true
    });
}

function checkEnemyCollisions() {
    if (!enemies) return;
    
    enemies.forEach(enemy => {
        if (this.physics.collide(player, enemy)) {
            // Handle player damage
            player.setTint(0xff0000);
            this.time.delayedCall(200, () => player.clearTint());
        }
    });
}
