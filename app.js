const audio = document.getElementById('audio-player');
const playBtn = document.getElementById('play-btn');

// 再生・一時停止の切り替え
playBtn.addEventListener('click', () => {
    if (audio.paused) {
        audio.play().then(() => {
            updateUI(true);
            setupMediaSession();
        }).catch(err => console.log("再生エラー:", err));
    } else {
        audio.pause();
        updateUI(false);
    }
});

function updateUI(isPlaying) {
    if (isPlaying) {
        playBtn.textContent = 'PAUSE';
        playBtn.classList.add('playing');
    } else {
        playBtn.textContent = 'PLAY';
        playBtn.classList.remove('playing');
    }
}

// バックグラウンド再生を維持するための「Media Session API」
function setupMediaSession() {
    if ('mediaSession' in navigator) {
        // ロック画面に表示する情報
        navigator.mediaSession.metadata = new MediaMetadata({
            title: 'Cruising BGM',
            artist: 'Drive Player',
            album: 'My GitHub App',
            // 必要ならここにカバー画像（png等）を指定可能
            artwork: [{ src: 'https://via.placeholder.com/512', sizes: '512x512', type: 'image/png' }]
        });

        // ロック画面の「再生」「一時停止」ボタンとアプリを連動させる
        navigator.mediaSession.setActionHandler('play', () => {
            audio.play();
            updateUI(true);
        });
        navigator.mediaSession.setActionHandler('pause', () => {
            audio.pause();
            updateUI(false);
        });
    }
}