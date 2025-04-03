var enemies = []; // array of enemies
class enemy { 
    constructor (left, bottom, width, height) {
        const enemyDiv = document.createElement("div");
        enemyDiv.className = "enemy";
        enemyDiv.style.position = "absolute";
        enemyDiv.style.left = intToPx(left);
        enemyDiv.style.bottom = intToPx(bottom);
        enemyDiv.style.width = intToPx(width);
        enemyDiv.style.height = intToPx(height);
        enemyDiv.style.backgroundColor = "red"; // For testing purposes
    
        const enemy = {
            left: left,
            bottom: bottom,
            width: width,
            height: height,
            top: bottom + height,
            direction: 1, // 1 for right, -1 for left
            speed: 5, // enemy movement speed
            div: enemyDiv // Store the enemy div reference for later use
        };
    
        enemies.push(enemy);
        gameContainer.appendChild(enemyDiv);
    }

    intToPx (num){return (num +"px");}

    pxToInt(px) {return parseInt(px.replace("px", ""));}

    moveEnemy(pNum) {
        enemies.forEach(enemy => {
            // Check if the enemy reaches the edge of the platform or screen
            if (enemy.left + enemy.width >= platforms[pNum].width + platforms[pNum].width|| enemy.left <= platforms[pNum].left) {
                enemy.direction *= -1; // Reverse direction when the enemy hits an edge
                console.log(enemy.direction);
            }
    
            // Move the enemy in the current direction
            enemy.left += enemy.direction * enemy.speed;
            enemy.div.style.left = intToPx(enemy.left); // Use the stored div here
        });
        checkPlayerEnemyCollision();
    }
}

platformConstructor(1000, 100); 
const enemy = new enemy();