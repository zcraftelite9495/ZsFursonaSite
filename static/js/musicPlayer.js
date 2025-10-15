(function () {
    const container = document.querySelector('.container[containerid="favs-music"]');
    if (!container) return;

    const playlistId = 'RDTMAK5uy_nilrsVWxrKskY0ZUpVZ3zpB0u4LwWTVJ4';
    const playerElId = 'youtube-player';
    const playBtn = container.querySelector('.playpause');
    const prevBtn = container.querySelector('.prev');
    const nextBtn = container.querySelector('.next');
    const shuffleBtn = container.querySelector('.shuffle');
    const loopBtn = container.querySelector('.loop');
    const titleEl = container.querySelector('.track-title');
    const artistEl = container.querySelector('.track-artist');
    const subEl = container.querySelector('.track-sub');
    const thumbEl = container.querySelector('.album-cover');
    const progress = container.querySelector('.progress');
    const timeCur = container.querySelector('.time.current');
    const timeTot = container.querySelector('.time.total');

    let player;
    let uiInterval = null;
    let shuffle = false;
    let loopTrack = false;
    let ready = false;

    function loadYouTubeAPI() {
        if (window.YT && window.YT.Player) return initPlayer();
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
        window.onYouTubeIframeAPIReady = initPlayer;
    }

    function initPlayer() {
        player = new YT.Player(playerElId, {
            height: '200',
            width: '360',
            playerVars: {
                controls: 0,
                modestbranding: 1,
                rel: 0,
                iv_load_policy: 3,
                playsinline: 1
            },
            events: {
                onReady: onReady,
                onStateChange: onStateChange,
                onError: () => {}
            }
        });
    }

    function onReady() {
        player.loadPlaylist({ list: playlistId, listType: 'playlist', index: 0, startSeconds: 0 });
        ready = true;
        attachUI();
        startUIUpdater();
    }

    function onStateChange(event) {
        const state = event.data;
        updatePlayIcon();
        if (state === YT.PlayerState.PLAYING) {
            updateMeta();
        }
        if (state === YT.PlayerState.ENDED) {
            const idx = player.getPlaylistIndex();
            if (loopTrack) {
                player.playVideoAt(idx);
            } else if (shuffle) {
                playRandom();
            } else {
                player.nextVideo();
            }
        }
    }

    function attachUI() {
        playBtn.addEventListener('click', togglePlay);
        prevBtn.addEventListener('click', () => {
            if (!ready) return;
            player.previousVideo();
        });
        nextBtn.addEventListener('click', () => {
            if (!ready) return;
            if (shuffle) playRandom(); else player.nextVideo();
        });
        shuffleBtn.addEventListener('click', () => {
            shuffle = !shuffle;
            shuffleBtn.classList.toggle('active', shuffle);
        });
        loopBtn.addEventListener('click', () => {
            loopTrack = !loopTrack;
            loopBtn.classList.toggle('active', loopTrack);
        });

        progress.addEventListener('input', (e) => {
            if (!ready) return;
            const pct = parseFloat(e.target.value);
            const dur = player.getDuration() || 0;
            const target = (pct / 100) * dur;
            player.seekTo(target, true);
        });
    }

    function togglePlay() {
        if (!ready) return;
        const state = player.getPlayerState();
        if (state === YT.PlayerState.PLAYING) player.pauseVideo();
        else player.playVideo();
    }

    function updatePlayIcon() {
        const icon = playBtn.querySelector('i');
        if (!player) return;
        const state = player.getPlayerState();
        if (state === YT.PlayerState.PLAYING) icon.className = 'nf nf-fa-pause';
        else icon.className = 'nf nf-fa-play';
    }

    function updateMeta() {
        const data = player.getVideoData() || {};
        const title = data.title || 'Unknown';
        let artist = data.author || data.video_owner || 'Unknown Artist';
        artist = artist.replace(/\s*-\s*Topic$/i, '').trim();
        titleEl.textContent = title;
        artistEl.textContent = artist;
        subEl.textContent = 'YouTube Playlist';
        const vid = player.getVideoUrl ? (player.getVideoUrl().match(/v=([^&]+)/) || [])[1] : null;
        const playlist = player.getPlaylist && player.getPlaylist();
        const idx = (typeof player.getPlaylistIndex === 'function') ? player.getPlaylistIndex() : 0;
        const currentId = (playlist && playlist[idx]) || vid;
        if (currentId) {
            thumbEl.src = `https://img.youtube.com/vi/${currentId}/hqdefault.jpg`;
        } else {
            thumbEl.src = '';
        }
        updateProgressImmediately();
    }

    function startUIUpdater() {
        if (uiInterval) clearInterval(uiInterval);
        uiInterval = setInterval(() => {
            updateProgressImmediately();
        }, 500);
    }

    function updateProgressImmediately() {
        if (!ready || !player || typeof player.getCurrentTime !== 'function') return;
        const cur = player.getCurrentTime() || 0;
        const dur = player.getDuration() || 0;
        timeCur.textContent = formatTime(cur);
        timeTot.textContent = formatTime(dur);
        progress.max = 100;
        progress.value = dur ? (cur / dur) * 100 : 0;
        updatePlayIcon();
    }

    function formatTime(s) {
        s = Math.max(0, Math.floor(s || 0));
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return m + ':' + (sec < 10 ? '0' + sec : sec);
    }

    function playRandom() {
        if (!player || !player.getPlaylist) return;
        const list = player.getPlaylist() || [];
        if (!list.length) {
            player.nextVideo();
            return;
        }
        let idx = Math.floor(Math.random() * list.length);
        const cur = player.getPlaylistIndex();
        if (list.length > 1 && idx === cur) idx = (idx + 1) % list.length;
        player.playVideoAt(idx);
    }

    loadYouTubeAPI();
})();