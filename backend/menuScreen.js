const optionsPanel = document.getElementById('optionsPanel');
const creditsPanel = document.getElementById('creditsPanel');
const creditsButton = document.getElementById('creditsButton');
const optionsButton = document.getElementById('optionsButton');

document.addEventListener('DOMContentLoaded', () => {
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
        } else {
            optionsPanel.classList.add('hidden');
        }
    });

    // Toggle credits panel
    creditsButton.addEventListener('click', () => {
        if (creditsPanel.classList.contains('hidden')) {
            creditsPanel.classList.remove('hidden');
            optionsPanel.classList.add('hidden');
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

    document.getElementById('closeCredits').addEventListener('click', () => {
        creditsPanel.classList.add('hidden');
    });
});
