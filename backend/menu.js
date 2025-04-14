const optionsPanel = document.getElementById('optionsPanel');
const creditsPanel = document.getElementById('creditsPanel');
const creditsButton = document.getElementById('creditsButton');
const optionsButton = document.getElementById('optionsButton');

const backgroundMusic = new Audio('sounds/background.mp4');
backgroundMusic.preload = 'auto';
backgroundMusic.volume = 0.8;
backgroundMusic.loop = true;

let musicPlaying = localStorage.getItem('musicEnabled') !== 'false';

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        backgroundMusic.pause();
    } else if (musicPlaying) {
        backgroundMusic.play().catch(e => console.log("Autoplay prevented:", e));
    }
});

// Handle beforeunload (tab closing/navigation)
window.addEventListener('beforeunload', () => {
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
});

function playMusic() {
    if (musicPlaying) {
        backgroundMusic.play().catch(e => console.log("Autoplay prevented:", e));
    }
}

window.onload = playMusic;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('startButton').addEventListener('click', () => {
        if (musicPlaying) {
            backgroundMusic.play().catch(e => console.log("Autoplay prevented:", e));
        }
        const difficulty = document.getElementById('difficultySelect').value;
        window.location.href = `main.html?difficulty=${difficulty}`;
    });
    document.getElementById('statsButton').addEventListener('click', () => {
        if (statsPanel.classList.contains('hidden')) {
            statsPanel.classList.remove('hidden');
            optionsPanel.classList.add('hidden');
            creditsPanel.classList.add('hidden');
            updateStatsDisplay();
        } else {
            statsPanel.classList.add('hidden');
        }
    });

    // Add reset stats functionality
    document.getElementById('resetStats').addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all statistics?')) {
            localStorage.removeItem('gameStats');
            updateStatsDisplay();
        }
    });

    // Function to update the stats display
    function updateStatsDisplay() {
        const stats = JSON.parse(localStorage.getItem('gameStats')) || {
            jumps: 0,
            attacks: 0,
            deaths: 0,
            enemyDeaths: 0,
            lavaDeaths: 0,
            clears: 0
        };

        document.getElementById('jumpsStat').textContent = stats.jumps;
        document.getElementById('attacksStat').textContent = stats.attacks;
        document.getElementById('deathsStat').textContent = stats.deaths;
        document.getElementById('clearStat').textContent = stats.clears;
        document.getElementById('enemyDeathsStat').textContent = stats.enemyDeaths;
        document.getElementById('lavaDeathsStat').textContent = stats.lavaDeaths;
    }

    // Initialize stats panel element
    const statsPanel = document.getElementById('statsPanel');
    // Load saved difficulty
    const savedDifficulty = localStorage.getItem('gameDifficulty') || 'normal';
    document.getElementById('difficultySelect').value = savedDifficulty;

    // Button event listeners
    document.getElementById('startButton').addEventListener('click', () => {
        const difficulty = document.getElementById('difficultySelect').value;
        window.location.href = `main.html?difficulty=${difficulty}`;
    });

    // Toggle options panel
    optionsButton.addEventListener('click', () => {
        if (optionsPanel.classList.contains('hidden')) {
            optionsPanel.classList.remove('hidden');
            creditsPanel.classList.add('hidden');
            statsPanel.classList.add('hidden');
        } else {
            optionsPanel.classList.add('hidden');
        }
    });

    // Toggle credits panel
    creditsButton.addEventListener('click', () => {
        if (creditsPanel.classList.contains('hidden')) {
            creditsPanel.classList.remove('hidden');
            optionsPanel.classList.add('hidden');
            statsPanel.classList.add('hidden');
        } else {
            creditsPanel.classList.add('hidden');
        }
    });

    document.getElementById('saveOptions').addEventListener('click', () => {
        const difficulty = document.getElementById('difficultySelect').value;
        localStorage.setItem('gameDifficulty', difficulty);
        alert('Settings saved!');
        optionsPanel.classList.add('hidden');
    });
});
