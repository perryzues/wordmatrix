// frontend/app.js
const BACKEND_URL = 'https://word-matrix-backend.onrender.com'; // ⚠️ UPDATE THIS

// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('room');
const isHost = urlParams.get('host') === 'true';

// State
let socket = null;
let gameState = {
    currentRound: 0,
    totalRounds: 10,
    mainWord: '',
    roundDuration: 15,
    roundStartTime: 0,
    foundWords: [],
    timerInterval: null
};

// Elements
const screens = {
    lobby: document.getElementById('lobbyScreen'),
    game: document.getElementById('gameScreen'),
    scoring: document.getElementById('scoringScreen'),
    gameOver: document.getElementById('gameOverScreen')
};

// Initialize
if (roomId) {
    initializeGame();
} else {
    window.location.href = 'index.html';
}

function initializeGame() {
    document.getElementById('roomCode').textContent = roomId;
    
    // Set up share link
    const shareLink = `${window.location.origin}${window.location.pathname.replace('game.html', '')}game.html?room=${roomId}`;
    document.getElementById('shareLink').value = shareLink;
    
    // Show host controls if host
    if (isHost) {
        document.getElementById('hostControls').classList.remove('hidden');
    }
    
    // Connect to socket
    connectSocket();
    
    // Set up event listeners
    setupEventListeners();
}

function connectSocket() {
    socket = io(BACKEND_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
    });
    
    socket.on('connect', () => {
        console.log('Connected to server');
        document.getElementById('connectionError').classList.add('hidden');
        
        // Join room
        const username = localStorage.getItem('username') || `Player${Math.floor(Math.random() * 1000)}`;
        socket.emit('joinRoom', { roomId, username });
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        document.getElementById('connectionError').classList.remove('hidden');
    });
    
    socket.on('error', (data) => {
        if (data.code === 'DUPLICATE_SUBMISSION') {
            showSubmissionStatus(data.message, 'error');
        } else {
            alert(`Error: ${data.message}`);
            if (data.code === 'ROOM_NOT_FOUND') {
                window.location.href = 'index.html';
            }
        }
    });
    
    socket.on('roomJoined', ({ players }) => {
        updatePlayersList(players);
    });
    
    socket.on('playerLeft', ({ players }) => {
        updatePlayersList(players);
    });
    
    socket.on('settingsUpdated', ({ rounds, roundDuration }) => {
        gameState.totalRounds = rounds;
        gameState.roundDuration = roundDuration;
    });
    
    socket.on('newRound', (data) => {
        startNewRound(data);
    });
    
    socket.on('wordAccepted', ({ word, count }) => {
        gameState.foundWords.push(word);
        showSubmissionStatus(`✓ "${word.toUpperCase()}" accepted! (${count} words found)`, 'success');
        updateFoundWordsList();
        document.getElementById('wordInput').value = '';
        document.getElementById('wordInput').focus();
    });
    
    socket.on('wordRejected', ({ word, reason }) => {
        showSubmissionStatus(`✗ "${word.toUpperCase()}": ${reason}`, 'error');
        document.getElementById('wordInput').select();
    });
    
    socket.on('scoringInProgress', () => {
        showScreen('scoring');
    });
    
    socket.on('roundResults', ({ results, bestWord, mostWords, possibleWords }) => {
        console.log('Round complete! Possible words:', possibleWords);
        if (bestWord || mostWords) {
            displayRoundStats(bestWord, mostWords);
        }
    });
    
    socket.on('leaderboardUpdate', ({ top10 }) => {
        updateLeaderboard(top10);
        showScreen('game');
    });
    
    socket.on('gameOver', ({ finalTop10 }) => {
        displayGameOver(finalTop10);
    });
}

function setupEventListeners() {
    // Copy link button
    document.getElementById('copyLinkBtn').addEventListener('click', () => {
        const input = document.getElementById('shareLink');
        input.select();
        document.execCommand('copy');
        alert('Link copied to clipboard!');
    });
    
    // Start game button
    document.getElementById('startGameBtn').addEventListener('click', () => {
        const rounds = parseInt(document.getElementById('roundsInput').value);
        const roundDuration = parseInt(document.getElementById('durationInput').value);
        const hostCode = localStorage.getItem('hostCode');
        
        socket.emit('hostSettings', { rounds, roundDuration, hostCode });
        socket.emit('startGame', { hostCode });
    });
    
    // Submit word
    document.getElementById('submitBtn').addEventListener('click', submitWord);
    document.getElementById('wordInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            submitWord();
        }
    });
    
    // Auto-focus input when typing
    document.getElementById('wordInput').addEventListener('input', (e) => {
        e.target.value = e.target.value.toLowerCase();
    });
    
    // Toggle leaderboard
    document.getElementById('toggleLeaderboard').addEventListener('click', () => {
        document.getElementById('leaderboard').classList.toggle('collapsed');
    });
    
    document.querySelector('.close-leaderboard').addEventListener('click', () => {
        document.getElementById('leaderboard').classList.add('collapsed');
    });
    
    // Game over buttons
    document.getElementById('newGameBtn').addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    
    document.getElementById('backHomeBtn').addEventListener('click', () => {
        window.location.href = 'index.html';
    });
}

function updatePlayersList(players) {
    const list = document.getElementById('playersList');
    const count = document.getElementById('playerCount');
    
    count.textContent = players.length;
    
    list.innerHTML = players.map(p => `
        <div class="player-card">
            <div>${p.username}</div>
        </div>
    `).join('');
}

function startNewRound({ mainWord, roundNumber, totalRounds, roundDuration, serverStartTime }) {
    gameState.currentRound = roundNumber;
    gameState.totalRounds = totalRounds;
    gameState.mainWord = mainWord;
    gameState.roundDuration = roundDuration;
    gameState.roundStartTime = serverStartTime;
    gameState.foundWords = [];
    
    showScreen('game');
    
    // Update UI
    document.getElementById('currentRound').textContent = roundNumber;
    document.getElementById('totalRounds').textContent = totalRounds;
    
    // Display main word
    const mainWordDisplay = document.getElementById('mainWordDisplay');
    mainWordDisplay.textContent = mainWord;
    
    // Reset UI
    document.getElementById('wordInput').value = '';
    document.getElementById('wordInput').disabled = false;
    document.getElementById('wordInput').focus();
    document.getElementById('submitBtn').disabled = false;
    document.getElementById('submissionStatus').classList.add('hidden');
    document.getElementById('roundStatsDisplay').classList.add('hidden');
    document.getElementById('foundWordsContainer').classList.add('hidden');
    document.getElementById('wordsFoundCount').textContent = '0';
    
    // Start timer
    startTimer(roundDuration);
}

function startTimer(duration) {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }
    
    const startTime = Date.now();
    const endTime = startTime + (duration * 1000);
    
    function updateTimer() {
        const now = Date.now();
        const remaining = Math.max(0, endTime - now);
        const seconds = Math.ceil(remaining / 1000);
        const percentage = (remaining / (duration * 1000)) * 100;
        
        document.getElementById('timerText').textContent = `${seconds}s`;
        document.getElementById('timerFill').style.width = `${percentage}%`;
        
        if (remaining <= 0) {
            clearInterval(gameState.timerInterval);
            document.getElementById('wordInput').disabled = true;
            document.getElementById('submitBtn').disabled = true;
        }
    }
    
    updateTimer();
    gameState.timerInterval = setInterval(updateTimer, 100);
}

function submitWord() {
    const word = document.getElementById('wordInput').value.trim().toLowerCase();
    
    if (!word) {
        return;
    }
    
    if (word.length < 3) {
        showSubmissionStatus('Word must be at least 3 letters', 'error');
        return;
    }
    
    socket.emit('submitWord', { word });
}

function showSubmissionStatus(message, type) {
    const status = document.getElementById('submissionStatus');
    status.textContent = message;
    status.className = `submission-status ${type}`;
    status.classList.remove('hidden');
    
    setTimeout(() => {
        status.classList.add('hidden');
    }, 3000);
}

function updateFoundWordsList() {
    const container = document.getElementById('foundWordsContainer');
    const list = document.getElementById('foundWordsList');
    const count = document.getElementById('wordsFoundCount');
    
    count.textContent = gameState.foundWords.length;
    
    if (gameState.foundWords.length > 0) {
        container.classList.remove('hidden');
        list.innerHTML = gameState.foundWords.map(word => `
            <div class="found-word-chip">${word.toUpperCase()}</div>
        `).join('');
    }
}

function displayRoundStats(bestWord, mostWords) {
    const display = document.getElementById('roundStatsDisplay');
    const bestContent = document.getElementById('bestWordContent');
    const mostContent = document.getElementById('mostWordsContent');
    
    if (bestWord) {
        bestContent.innerHTML = `
            <strong>"${bestWord.word.toUpperCase()}"</strong> by ${bestWord.username} 
            <span style="color: var(--success)">(${bestWord.roundPoints} pts, ${bestWord.length} letters)</span>
        `;
    }
    
    if (mostWords && mostWords.count > 0) {
        mostContent.innerHTML = `
            <strong>${mostWords.players.join(', ')}</strong> 
            <span style="color: var(--primary)">(${mostWords.count} words)</span>
        `;
    }
    
    display.classList.remove('hidden');
}

function updateLeaderboard(top10) {
    const list = document.getElementById('leaderboardList');
    
    list.innerHTML = top10.map((player, idx) => `
        <div class="leaderboard-item">
            <div class="rank-badge rank-${idx + 1}">${player.rank}</div>
            <div class="player-info">
                <div class="player-name">${player.username}</div>
                <div class="player-words">${(player.lastWords || []).slice(0, 3).join(', ').toUpperCase() || '—'}</div>
                <div class="player-word-count">${player.wordCount || 0} words this round</div>
            </div>
            <div class="player-score">
                <div class="total-points">${player.totalPoints.toFixed(1)}</div>
                <div class="round-points">+${(player.lastRoundPoints || 0).toFixed(1)}</div>
            </div>
        </div>
    `).join('');
}

function displayGameOver(finalTop10) {
    showScreen('gameOver');
    
    const leaderboard = document.getElementById('finalLeaderboard');
    
    leaderboard.innerHTML = finalTop10.map((player, idx) => {
        let medal = '';
        if (idx === 0) medal = '🥇';
        else if (idx === 1) medal = '🥈';
        else if (idx === 2) medal = '🥉';
        
        return `
            <div class="leaderboard-item">
                <div class="rank-badge rank-${idx + 1}">${medal || player.rank}</div>
                <div class="player-info">
                    <div class="player-name">${player.username}</div>
                    <div class="player-word-count">Found ${player.wordCount || 0} words in final round</div>
                </div>
                <div class="player-score">
                    <div class="total-points">${player.totalPoints.toFixed(1)}</div>
                </div>
            </div>
        `;
    }).join('');
    
    // Confetti effect (optional)
    if (typeof confetti !== 'undefined') {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    }
}

function showScreen(screenName) {
    Object.values(screens).forEach(screen => {
        if (screen) screen.classList.add('hidden');
    });
    
    if (screens[screenName]) {
        screens[screenName].classList.remove('hidden');
    }
}
