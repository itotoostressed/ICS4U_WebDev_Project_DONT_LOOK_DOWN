class DeathScreen {
    constructor(game) {
        this.game = game;
        this.element = document.getElementById('deathScreen');
        this.reasonElement = document.getElementById('deathReason');
        
        document.getElementById('restartButton').addEventListener('click', () => {
            this.hide();
            this.game.resetGame();
        });
        
        document.getElementById('menuButton').addEventListener('click', () => {
            this.hide();
            window.location.href = 'menu.html';
        });
    }
    
    show(reason, title = "GAME OVER") {  // Add title parameter with default value
        this.reasonElement.textContent = reason;
        // Get or create the title element
        let titleElement = this.element.querySelector('h1');
        if (!titleElement) {
            titleElement = document.createElement('h1');
            this.element.insertBefore(titleElement, this.reasonElement);
        }
        titleElement.textContent = title;  // Set the title text
        this.element.classList.remove('hidden');
    }
    
    hide() {
        this.element.classList.add('hidden');
    }
}
