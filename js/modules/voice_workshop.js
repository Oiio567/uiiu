const VOICE_WORKSHOP_DEFAULTS = {
    apiKey: '',
    model: 's1',
    proxyUrl: '',
    autoPlay: false,
    characterVoices: {}
};

const fishAudioBlobCache = new Map();
let fishAudioContext = null;
let activeFishAudio = null;
let activeFishAudioFinish = null;

function getVoiceWorkshopSettings() {
    return { ...VOICE_WORKSHOP_DEFAULTS, ...(db.voiceWorkshopSettings || {}) };
}

function openVoiceWorkshop() {
    let screen = document.getElementById('voice-workshop-screen');
    if (!screen) {
        const phoneScreen = document.querySelector('.phone-screen');
        if (!phoneScreen) throw new Error('无法找到应用页面容器');

        phoneScreen.insertAdjacentHTML('beforeend', `
            <section id="voice-workshop-screen" class="screen">
                <header class="app-header voice-workshop-header">
                    <button class="back-btn" data-target="more-screen" aria-label="返回">‹</button>
                    <nav class="workshop-tabs" aria-label="语音工坊页面">
                        <button class="workshop-tab active" id="voice-workshop-api-tab-btn" type="button">Fish Audio</button>
                        <button class="workshop-tab" id="voice-workshop-char-tab-btn" type="button">角色管理</button>
                    </nav>
                    <div class="placeholder"></div>
                </header>
                <main class="content voice-workshop-content">
                    <section id="voice-workshop-api-tab" class="voice-workshop-tab-content active">
                        <section class="voice-workshop-card">
                            <div class="voice-workshop-heading">
                                <span class="voice-workshop-heading-icon" aria-hidden="true">♫</span>
                                <div>
                                    <h2>Fish Audio 配置</h2>
                                    <p>配置 Fish Audio API Key</p>
                                </div>
                            </div>
                            <label class="voice-workshop-field">
                                <span>API Key</span>
                                <input id="voice-workshop-api-key" type="password" autocomplete="off" placeholder="输入 Fish Audio API Key">
                            </label>
                            <label class="voice-workshop-field">
                                <span>Cloudflare Worker 地址</span>
                                <input id="voice-workshop-proxy-url" type="url" autocomplete="url" placeholder="https://your-worker.your-subdomain.workers.dev">
                            </label>
                            <label class="voice-workshop-field">
                                <span>模型</span>
                                <input id="voice-workshop-model" type="text" autocomplete="off" placeholder="例如：s2-pro">
                            </label>
                            <p class="voice-workshop-hint">填写 Fish Audio 模型名称（例如 s2-pro）。模型与角色的 Voice ID 是不同配置。</p>
                            <details class="voice-workshop-deploy-help">
                                <summary>如何部署跨域代理</summary>
                                <ol>
                                    <li>在 Cloudflare 创建 Worker，将项目中的 <code>js/fish_audio_worker.js</code> 完整代码粘贴并部署。</li>
                                    <li>在 Worker 设置中添加环境变量 <code>ALLOWED_ORIGINS</code>，值填当前应用的网址来源，例如 <code>https://example.pages.dev</code>（只填协议和域名，不带路径或末尾斜杠）。</li>
                                    <li>复制 Worker 根地址填入上方，例如 <code>https://your-worker.your-subdomain.workers.dev</code>，保存后即可使用。</li>
                                </ol>
                            </details>
                            <label class="voice-workshop-toggle">
                                <input id="voice-workshop-auto-play" type="checkbox">
                                <span class="voice-workshop-toggle-track" aria-hidden="true"></span>
                                <span class="voice-workshop-toggle-copy">
                                    <strong>通话自动生成并播放</strong>
                                    <small>开启后，角色在语音/视频通话中说的话会按顺序自动播放；旁白不播放。</small>
                                </span>
                            </label>
                            <p class="voice-workshop-hint">语音消息及通话语音也可双击播放。API Key 保存在本机浏览器。</p>
                            <button id="voice-workshop-save" class="voice-workshop-primary" type="button">保存设置</button>
                            <p id="voice-workshop-status" class="voice-workshop-status" role="status" aria-live="polite"></p>
                        </section>
                    </section>
                    <section id="voice-workshop-char-tab" class="voice-workshop-tab-content">
                        <section class="voice-workshop-card">
                            <div class="voice-workshop-heading">
                                <span class="voice-workshop-heading-icon" aria-hidden="true">♙</span>
                                <div>
                                    <h2>角色声音</h2>
                                    <p>为每个聊天角色配置 Fish Audio Voice ID</p>
                                </div>
                            </div>
                            <p id="voice-workshop-char-empty" class="voice-workshop-hint" hidden>尚未创建聊天角色。</p>
                            <label class="voice-workshop-search-field">
                                <span class="sr-only">搜索角色</span>
                                <input id="voice-workshop-char-search" type="search" placeholder="搜索角色名称…" autocomplete="off">
                            </label>
                            <div id="voice-workshop-char-list" class="voice-workshop-char-list"></div>
                            <p id="voice-workshop-char-no-results" class="voice-workshop-search-empty" hidden>没有找到匹配的角色。</p>
                            <button id="voice-workshop-char-save" class="voice-workshop-primary" type="button">保存设置</button>
                        </section>
                    </section>
                </main>
            </section>
        `);
        screen = document.getElementById('voice-workshop-screen');
        bindVoiceWorkshop(screen);
    }

    loadVoiceWorkshopFields(screen);
    renderVoiceWorkshopCharacters(screen);
    filterVoiceWorkshopCharacters(screen);
    switchVoiceWorkshopTab(screen, 'api');
    switchScreen('voice-workshop-screen');
}

function loadVoiceWorkshopFields(screen) {
    const settings = getVoiceWorkshopSettings();
    screen.querySelector('#voice-workshop-api-key').value = settings.apiKey;
    screen.querySelector('#voice-workshop-proxy-url').value = settings.proxyUrl || '';
    screen.querySelector('#voice-workshop-model').value = settings.model || VOICE_WORKSHOP_DEFAULTS.model;
    screen.querySelector('#voice-workshop-auto-play').checked = settings.autoPlay === true;
}

function switchVoiceWorkshopTab(screen, tabName) {
    const isApiTab = tabName === 'api';
    screen.querySelector('#voice-workshop-api-tab-btn').classList.toggle('active', isApiTab);
    screen.querySelector('#voice-workshop-char-tab-btn').classList.toggle('active', !isApiTab);
    screen.querySelector('#voice-workshop-api-tab').classList.toggle('active', isApiTab);
    screen.querySelector('#voice-workshop-char-tab').classList.toggle('active', !isApiTab);
}

function renderVoiceWorkshopCharacters(screen) {
    const list = screen.querySelector('#voice-workshop-char-list');
    const empty = screen.querySelector('#voice-workshop-char-empty');
    const noResults = screen.querySelector('#voice-workshop-char-no-results');
    const settings = getVoiceWorkshopSettings();
    list.replaceChildren();
    empty.hidden = db.characters.length > 0;
    noResults.hidden = true;

    for (const character of db.characters) {
        const card = document.createElement('article');
        card.className = 'voice-workshop-char-card';

        const heading = document.createElement('div');
        heading.className = 'voice-workshop-char-heading';
        const avatar = document.createElement('img');
        avatar.src = character.avatar || '';
        avatar.alt = '';
        const name = document.createElement('strong');
        name.textContent = character.remarkName || character.realName || character.name || '未知角色';
        heading.append(avatar, name);

        const field = document.createElement('label');
        field.className = 'voice-workshop-field';
        const label = document.createElement('span');
        label.textContent = 'Voice ID';
        const voiceId = settings.characterVoices?.[String(character.id)] || '';
        const customInput = document.createElement('input');
        customInput.type = 'text';
        customInput.className = 'voice-workshop-char-voice-id';
        customInput.value = voiceId;
        customInput.placeholder = '输入 Fish Audio Voice ID';
        customInput.autocomplete = 'off';
        customInput.setAttribute('aria-label', `${name.textContent} 的 Voice ID`);

        field.append(label, customInput);
        card.append(heading, field);
        card.dataset.characterId = String(character.id);
        card.dataset.searchText = [character.remarkName, character.realName, character.name]
            .filter(Boolean)
            .join(' ')
            .toLocaleLowerCase();
        list.appendChild(card);
    }
}

function filterVoiceWorkshopCharacters(screen) {
    const query = screen.querySelector('#voice-workshop-char-search').value.trim().toLocaleLowerCase();
    const cards = [...screen.querySelectorAll('.voice-workshop-char-card')];
    let visibleCount = 0;
    for (const card of cards) {
        const matches = !query || card.dataset.searchText.includes(query);
        card.hidden = !matches;
        if (matches) visibleCount++;
    }

    const noResults = screen.querySelector('#voice-workshop-char-no-results');
    noResults.hidden = !query || visibleCount > 0;
}

function readVoiceWorkshopFields(screen) {
    const characterVoices = {};
    for (const card of screen.querySelectorAll('.voice-workshop-char-card')) {
        const characterId = card.dataset.characterId;
        const voiceId = card.querySelector('.voice-workshop-char-voice-id').value.trim();
        if (voiceId) characterVoices[characterId] = voiceId;
    }

    return {
        apiKey: screen.querySelector('#voice-workshop-api-key').value.trim(),
        proxyUrl: screen.querySelector('#voice-workshop-proxy-url').value.trim().replace(/\/+$/, ''),
        model: screen.querySelector('#voice-workshop-model').value.trim() || VOICE_WORKSHOP_DEFAULTS.model,
        autoPlay: screen.querySelector('#voice-workshop-auto-play').checked,
        characterVoices
    };
}

async function saveVoiceWorkshopFields(screen) {
    db.voiceWorkshopSettings = readVoiceWorkshopFields(screen);
    await saveData();
}

function bindVoiceWorkshop(screen) {
    screen.querySelector('#voice-workshop-api-tab-btn').addEventListener('click', () => switchVoiceWorkshopTab(screen, 'api'));
    screen.querySelector('#voice-workshop-char-tab-btn').addEventListener('click', () => switchVoiceWorkshopTab(screen, 'characters'));
    screen.querySelector('#voice-workshop-char-search').addEventListener('input', () => filterVoiceWorkshopCharacters(screen));

    screen.querySelector('#voice-workshop-save').addEventListener('click', async () => {
        const status = screen.querySelector('#voice-workshop-status');
        try {
            await saveVoiceWorkshopFields(screen);
            status.textContent = '设置已保存';
            showToast('语音工坊设置已保存');
        } catch (error) {
            status.textContent = `保存失败：${error.message || '未知错误'}`;
        }
    });

    screen.querySelector('#voice-workshop-char-save').addEventListener('click', async () => {
        const status = screen.querySelector('#voice-workshop-status');
        try {
            await saveVoiceWorkshopFields(screen);
            status.textContent = '角色声音设置已保存';
            showToast('角色声音设置已保存');
        } catch (error) {
            status.textContent = `保存失败：${error.message || '未知错误'}`;
        }
    });
}

function normalizeFishAudioText(text) {
    return String(text || '')
        .replace(/「[^」]*」\s*$/, '')
        .replace(/[（(](?:旁白|环境音|画面动作)[：:][\s\S]*?[）)]/g, '')
        .replace(/^\s*(?:旁白|环境音|画面\/环境音)[：:]\s*/, '')
        .trim();
}

function resolveFishAudioCharacterId(chat, characterId, senderId, senderName) {
    if (characterId != null) return String(characterId);
    if (Array.isArray(chat?.members)) {
        const member = chat.members.find(item => String(item.id) === String(senderId))
            || chat.members.find(item => item.realName === senderName || item.groupNickname === senderName);
        if (member) return String(member.originalCharId || member.characterId || member.id);
    }
    if (chat?.id != null && !Array.isArray(chat.members)) return String(chat.id);
    const character = db.characters.find(item => item.realName === senderName || item.remarkName === senderName);
    return character ? String(character.id) : '';
}

function getFishAudioVoiceId(chat, characterId, senderId, senderName) {
    const resolvedId = resolveFishAudioCharacterId(chat, characterId, senderId, senderName);
    const voice = getVoiceWorkshopSettings().characterVoices?.[resolvedId];
    return typeof voice === 'string' ? voice.trim() : voice?.voiceId?.trim() || '';
}

async function fetchFishAudioBlob(text, voiceId) {
    const settings = getVoiceWorkshopSettings();
    if (!settings.apiKey) throw new Error('请先在语音工坊配置 Fish Audio API Key');
    const model = settings.model?.trim() || VOICE_WORKSHOP_DEFAULTS.model;
    const proxyUrl = settings.proxyUrl?.trim().replace(/\/+$/, '');
    const endpoint = proxyUrl
        ? (proxyUrl.endsWith('/v1/tts') ? proxyUrl : `${proxyUrl}/v1/tts`)
        : 'https://api.fish.audio/v1/tts';
    const cacheKey = `${endpoint}\n${model}\n${voiceId}\n${text}`;
    if (fishAudioBlobCache.has(cacheKey)) return fishAudioBlobCache.get(cacheKey);

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${settings.apiKey}`,
            'Content-Type': 'application/json',
            'model': model
        },
        body: JSON.stringify({ text, reference_id: voiceId, format: 'mp3' })
    }).catch(error => {
        if (error instanceof TypeError) {
            throw new Error(settings.proxyUrl
                ? '无法连接 Cloudflare Worker。请检查 Worker 地址、部署状态及 ALLOWED_ORIGINS 配置。'
                : '浏览器无法直接跨域访问 Fish Audio。请部署 Cloudflare Worker，并在此填写 Worker 地址。');
        }
        throw error;
    });
    if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Fish Audio 请求失败（${response.status}）：${detail || response.statusText}`);
    }

    const blob = await response.blob();
    if (!blob.size) throw new Error('Fish Audio 返回了空音频');
    fishAudioBlobCache.set(cacheKey, blob);
    if (fishAudioBlobCache.size > 30) fishAudioBlobCache.delete(fishAudioBlobCache.keys().next().value);
    return blob;
}

function stopFishAudioPlayback() {
    activeFishAudioFinish?.();
}

function getFishAudioContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!fishAudioContext) fishAudioContext = new AudioContextClass();
    return fishAudioContext;
}

async function playFishAudioBlob(blob, shouldPlay = () => true) {
    if (!shouldPlay()) return;
    stopFishAudioPlayback();

    const audioContext = getFishAudioContext();
    if (!audioContext) {
        await playFishAudioWithElement(blob, shouldPlay);
        return;
    }

    try {
        if (audioContext.state === 'suspended') await audioContext.resume();
        const audioBuffer = await audioContext.decodeAudioData(await blob.arrayBuffer());
        if (!shouldPlay()) return;

        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        activeFishAudio = source;

        await new Promise((resolve, reject) => {
            let settled = false;
            const finish = error => {
                if (settled) return;
                settled = true;
                source.onended = null;
                if (activeFishAudio === source) {
                    activeFishAudio = null;
                    activeFishAudioFinish = null;
                }
                if (error) reject(error);
                else resolve();
            };
            activeFishAudioFinish = () => {
                try {
                    source.stop();
                } catch (_) {
                    finish();
                    return;
                }
                finish();
            };
            source.onended = () => finish();
            try {
                source.start();
            } catch (error) {
                finish(error);
            }
        });
    } catch (error) {
        if (error.name === 'NotAllowedError' || audioContext.state === 'suspended') {
            throw new Error('浏览器阻止了通话自动播放，请重新接通通话后再试，或单击语音手动播放。');
        }
        throw new Error(`语音已生成，但播放失败：${error.message || '音频解码失败'}`);
    }
}

async function playFishAudioWithElement(blob, shouldPlay) {
    if (!shouldPlay()) return;
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    activeFishAudio = audio;

    try {
        await new Promise((resolve, reject) => {
            let settled = false;
            const finish = error => {
                if (settled) return;
                settled = true;
                audio.onended = null;
                audio.onerror = null;
                if (activeFishAudio === audio) {
                    activeFishAudio = null;
                    activeFishAudioFinish = null;
                }
                if (error) reject(error);
                else resolve();
            };
            activeFishAudioFinish = () => {
                audio.pause();
                finish();
            };
            audio.onended = () => finish();
            audio.onerror = () => finish(new Error('音频已生成，但浏览器播放失败'));
            audio.play().catch(finish);
        });
    } catch (error) {
        if (error.name === 'NotAllowedError') {
            throw new Error('浏览器阻止了通话自动播放，请单击语音手动播放。');
        }
        throw error;
    } finally {
        if (audio.src) URL.revokeObjectURL(url);
    }
}

window.FishAudioVoice = {
    autoPlayEnabled() {
        return getVoiceWorkshopSettings().autoPlay === true;
    },
    unlock() {
        const audioContext = getFishAudioContext();
        if (!audioContext || audioContext.state !== 'suspended') return Promise.resolve();
        return audioContext.resume().catch(error => {
            console.warn('Could not unlock Fish Audio playback:', error);
        });
    },
    playText(chat, characterId, text, options = {}) {
        if (options.shouldPlay && !options.shouldPlay()) return Promise.resolve();
        const spokenText = normalizeFishAudioText(text);
        if (!spokenText) return Promise.resolve();
        const voiceId = getFishAudioVoiceId(chat, characterId, options.senderId, options.senderName);
        if (!voiceId) return Promise.reject(new Error('请先在语音工坊的角色管理中配置该角色的 Voice ID'));
        return fetchFishAudioBlob(spokenText, voiceId).then(blob => playFishAudioBlob(blob, options.shouldPlay));
    },
    stop: stopFishAudioPlayback
};

window.addEventListener('pagehide', stopFishAudioPlayback);
