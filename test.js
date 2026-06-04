let currentTrackIndex = 0;
let isPlaying = false;
let searchResults = []; // 検索された曲のリストを入れる空の配列

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

// 🎵 iTunes APIから曲を検索する関数
async function searchMusic(keyword) {
    if (!keyword) return;
    
    // AppleのAPIを叩くURL（日本の楽曲、最大10件取得）
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(keyword)}&country=jp&entity=musicTrack&limit=10`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        // 必要なデータ（タイトル、歌手名、30秒のプレビューURL）だけを抽出して変換
        searchResults = data.results.map((track, index) => ({
            id: index,
            title: track.trackName,
            artist: track.artistName,
            url: track.previewUrl, // 30秒の試聴URL
            artwork: track.artworkUrl100 // ジャケット画像
        }));
        
        // 検索結果を画面のリストに表示
        renderPlaylist(searchResults);
        
        // 1件目があれば自動でセット
        if (searchResults.length > 0) {
            loadTrack(0);
        }
    } catch (error) {
        console.error("音楽の検索に失敗しました:", error);
    }
}

// 検索バーに入力されたら検索を実行（タイピングが止まってから動くように少しディレイを入れるとより上品になります）
let typingTimer;
searchInput.oninput = (e) => {
    clearTimeout(typingTimer);
    const keyword = e.target.value;
    typingTimer = setTimeout(() => {
        searchMusic(keyword);
    }, 500); // 文字入力が止まって0.5秒後に検索
};

// --- 以下は前のプレイヤーロジックを流用・最適化 ---

function loadTrack(index) {
    if (searchResults.length === 0) return;
    currentTrackIndex = index;
    const track = searchResults[index];
    audio.src = track.url;
    trackTitle.textContent = track.title;
    trackArtist.textContent = track.artist;
    
    // アートワーク（ジャケット写真）があれば変更
    const artworkEl = document.getElementById("artwork");
    if (track.artwork) {
        artworkEl.innerHTML = `<img src="${track.artwork}" style="width:100%; height:100%; border-radius:24px; object-fit:cover;">`;
    } else {
        artworkEl.innerHTML = `<span class="material-symbols-rounded">music_note</span>`;
    }
    
    updatePlaylistHighlight();
    updateMediaSessionMetadata(track);
}

function togglePlay() {
    if (searchResults.length === 0) return;
    if (isPlaying) {
        audio.pause();
    } else {
        audio.play().catch(err => console.log(err));
    }
}

audio.onplay = () => {
    isPlaying = true;
    playIcon.textContent = "pause";
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = "playing";
};

audio.onpause = () => {
    isPlaying = false;
    playIcon.textContent = "play_arrow";
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = "paused";
};

function nextTrack() {
    if (searchResults.length === 0) return;
    let index = currentTrackIndex + 1;
    if (index >= searchResults.length) index = 0;
    loadTrack(index);
    audio.play();
}

function prevTrack() {
    if (searchResults.length === 0) return;
    let index = currentTrackIndex - 1;
    if (index < 0) index = searchResults.length - 1;
    loadTrack(index);
    audio.play();
}

audio.ontimeupdate = () => {
    if (audio.duration) {
        const progress = (audio.currentTime / audio.duration) * 100;
        progressBar.value = progress;
        currentTimeEl.textContent = formatTime(audio.currentTime);
        durationTimeEl.textContent = formatTime(audio.duration);
    }
};

progressBar.oninput = () => {
    const seekTime = (progressBar.value / 100) * audio.duration;
    audio.currentTime = seekTime;
};

audio.onended = () => nextTrack();

function renderPlaylist(tracks) {
    playlist.innerHTML = "";
    tracks.forEach(track => {
        const li = document.createElement("li");
        li.dataset.id = track.id;
        li.innerHTML = `
            <div style="flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; padding-right:10px;">${track.title}</div>
            <div class="artist-name" style="max-width:120px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${track.artist}</div>
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

function formatTime(secs) {
    const min = Math.floor(secs / 60);
    const sec = Math.floor(secs % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

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
            album: "iTunes Search Player",
            artwork: [{ src: track.artwork || 'https://via.placeholder.com/512', sizes: '512x512', type: 'image/png' }]
        });
    }
}

playBtn.onclick = togglePlay;
nextBtn.onclick = nextTrack;
prevBtn.onclick = prevTrack;

window.onload = () => {
    setupMediaSession();
    // 最初に「Official髭男dism」などで勝手に検索させて初期表示を作っても面白いです
    searchMusic("Pretender"); 
};