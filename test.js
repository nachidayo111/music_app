// サンプル楽曲データ（著作権フリーのストリーミングURL）
const songs = [
    {
        id: 0,
        title: "Lost in the City Lights",
        artist: "Cosmo Sheldrake",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
    },
    {
        id: 1,
        title: "Urban Nocturne",
        artist: "Nightowl",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
    },
    {
        id: 2,
        title: "Neon Dreams",
        artist: "Vaporwave Explorer",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
    }
];

let currentTrackIndex = 0;
let isPlaying = false;

const audio = document.getElementById("audio-element");
const playBtn = document.getElementById("play-btn");
const playIcon = document.getElementById("play-icon");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const progressBar = document.getElementById("progress-bar");
const currentTimeEl = document.getElementById("current-time");
const durationTimeEl = document.getElementById("total-duration");
const trackTitle = document.getElementById("track-title");
const trackArtist = document.getElementById("track-artist");
const playlist = document.getElementById("playlist");
const searchInput = document.getElementById("search-input");

// 初期化
function init() {
    loadTrack(currentTrackIndex);
    renderPlaylist(songs);
    setupMediaSession();
}

// トラック読込
function loadTrack(index) {
    currentTrackIndex = index;
    const track = songs[index];
    audio.src = track.url;
    trackTitle.textContent = track.title;
    trackArtist.textContent = track.artist;
    
    updatePlaylistHighlight();
    updateMediaSessionMetadata(track);
}

// 再生・一時停止
function togglePlay() {
    if (isPlaying) {
        audio.pause();
    } else {
        audio.play().catch(err => console.log("ユーザー操作前の自動再生制限:", err));
    }
}

audio.onplay = () => {
    isPlaying = true;
    playIcon.textContent = "pause";
    if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = "playing";
    }
};

audio.onpause = () => {
    isPlaying = false;
    playIcon.textContent = "play_arrow";
    if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = "paused";
    }
};

// 次の曲 / 前の曲
function nextTrack() {
    let index = currentTrackIndex + 1;
    if (index >= songs.length) index = 0;
    loadTrack(index);
    audio.play();
}

function prevTrack() {
    let index = currentTrackIndex - 1;
    if (index < 0) index = songs.length - 1;
    loadTrack(index);
    audio.play();
}

// タイムアップデート
audio.ontimeupdate = () => {
    if (audio.duration) {
        const progress = (audio.currentTime / audio.duration) * 100;
        progressBar.value = progress;
        
        // 時間表示の更新
        currentTimeEl.textContent = formatTime(audio.currentTime);
        durationTimeEl.textContent = formatTime(audio.duration);
    }
};

// シークバー操作
progressBar.oninput = () => {
    const seekTime = (progressBar.value / 100) * audio.duration;
    audio.currentTime = seekTime;
};

// 曲が終わったら次へ
audio.onended = () => {
    nextTrack();
};

// プレイリスト描画
function renderPlaylist(tracks) {
    playlist.innerHTML = "";
    tracks.forEach(track => {
        const li = document.createElement("li");
        li.dataset.id = track.id;
        li.innerHTML = `
            <div>${track.title}</div>
            <div class="artist-name">${track.artist}</div>
        `;
        li.onclick = () => {
            loadTrack(track.id);
            audio.play();
        };
        playlist.appendChild(li);
    });
    updatePlaylistHighlight();
}

function updatePlaylistHighlight() {
    const items = playlist.querySelectorAll("li");
    items.forEach(item => {
        if (parseInt(item.dataset.id) === currentTrackIndex) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });
}

// 🔍 検索ロジック
searchInput.oninput = (e) => {
    const keyword = e.target.value.toLowerCase();
    const filteredSongs = songs.filter(song => 
        song.title.toLowerCase().includes(keyword) || 
        song.artist.toLowerCase().includes(keyword)
    );
    renderPlaylist(filteredSongs);
};

// 時間フォーマットUtility
function formatTime(secs) {
    const min = Math.floor(secs / 60);
    const sec = Math.floor(secs % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

// 📱 バックグラウンド再生・OSコントロール連携 (Media Session API)
function setupMediaSession() {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', () => togglePlay());
        navigator.mediaSession.setActionHandler('pause', () => togglePlay());
        navigator.mediaSession.setActionHandler('previoustrack', () => prevTrack());
        navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());
    }
}

function updateMediaSessionMetadata(track) {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: track.title,
            artist: track.artist,
            album: "Web Elegant Player",
            artwork: [
                { src: 'https://via.placeholder.com/512', sizes: '512x512', type: 'image/png' }
            ]
        });
    }
}

// イベント登録
playBtn.onclick = togglePlay;
nextBtn.onclick = nextTrack;
prevBtn.onclick = prevTrack;

window.onload = init;