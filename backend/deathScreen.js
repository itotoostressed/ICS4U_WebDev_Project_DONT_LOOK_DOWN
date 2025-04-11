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
            window.location.href = 'menuScreen.html';
        });
    }
    
    show(reason) {
        this.reasonElement.textContent = reason;
        this.element.classList.remove('hidden');
    }
    
    hide() {
        this.element.classList.add('hidden');
    }
}
