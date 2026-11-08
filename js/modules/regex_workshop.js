let regexWorkshopScope = 'online';
let regexWorkshopCharacterFilter = '';

function openRegexWorkshop() {
    let screen = document.getElementById('regex-workshop-screen');
    if (!screen) {
        const phoneScreen = document.querySelector('.phone-screen');
        if (!phoneScreen) throw new Error('无法找到应用页面容器');
        phoneScreen.insertAdjacentHTML('beforeend', `
            <section id="regex-workshop-screen" class="screen">
                <header class="app-header regex-workshop-header">
                    <button class="back-btn" data-target="more-screen" aria-label="返回">‹</button>
                    <div class="title-container"><h1 class="title">正则工坊</h1></div>
                    <div class="placeholder"></div>
                </header>
                <main class="content regex-workshop-content">
                    <section class="regex-workshop-card">
                        <div class="regex-workshop-heading">
                            <span class="regex-workshop-heading-icon" aria-hidden="true">.*</span>
                            <div>
                                <h2 id="regex-workshop-scope-title">线上正则分组</h2>
                                <p>管理正则组和组内规则，可导入 SillyTavern 正则预设或角色卡 JSON。</p>
                            </div>
                        </div>
                        <div class="regex-workshop-scope-switch">
                            <button type="button" data-scope="online" class="is-active">线上启用</button>
                            <button type="button" data-scope="offline">线下测试</button>
                        </div>
                        <div class="regex-workshop-toolbar">
                            <label class="regex-workshop-character-filter" id="regex-workshop-character-filter-wrap">
                                <span>按角色管理</span>
                                <select id="regex-workshop-character-filter"></select>
                            </label>
                            <button id="regex-workshop-add-group" type="button">新建分组</button>
                            <label class="regex-workshop-file-label" for="regex-workshop-import">导入 JSON</label>
                            <input id="regex-workshop-import" type="file" accept=".json,application/json">
                        </div>
                        <div id="regex-workshop-groups" class="regex-workshop-groups"></div>
                        <p id="regex-workshop-groups-empty" class="regex-workshop-status" hidden>还没有正则分组，创建或导入一个分组开始使用。</p>
                    </section>
                    <section id="regex-workshop-editor" class="regex-workshop-card" hidden>
                        <div class="regex-workshop-results-heading">
                            <h2 id="regex-workshop-editor-title">编辑分组</h2>
                            <span>规则顺序会影响最终结果</span>
                        </div>
                        <label class="regex-workshop-field">
                            <span>分组名称</span>
                            <input id="regex-workshop-group-name" type="text" maxlength="100">
                        </label>
                        <label class="regex-workshop-field" id="regex-workshop-group-character-wrap">
                            <span>适用角色</span>
                            <select id="regex-workshop-group-character"></select>
                        </label>
                        <div id="regex-workshop-rules" class="regex-workshop-rules"></div>
                        <div class="regex-workshop-toolbar">
                            <button id="regex-workshop-add-rule" type="button">添加正则</button>
                            <button id="regex-workshop-cancel-edit" type="button">取消</button>
                            <button id="regex-workshop-save-edit" type="button">保存分组</button>
                        </div>
                    </section>
                    <section class="regex-workshop-card">
                        <div class="regex-workshop-results-heading">
                            <h2>角色卡正则</h2>
                            <span>导出时写入 SillyTavern extensions.regex_scripts</span>
                        </div>
                        <label class="regex-workshop-field">
                            <span>选择角色</span>
                            <select id="regex-workshop-character"></select>
                        </label>
                        <div class="regex-workshop-toolbar">
                            <button id="regex-workshop-export-character" type="button">导出角色卡 JSON</button>
                        </div>
                    </section>
                    <section class="regex-workshop-card">
                        <div class="regex-workshop-heading">
                            <span class="regex-workshop-heading-icon" aria-hidden="true">.*</span>
                            <div>
                                <h2>正则表达式测试</h2>
                                <p>输入表达式和测试文本，实时查看匹配结果及捕获组。</p>
                            </div>
                        </div>
                        <label class="regex-workshop-field">
                            <span>正则表达式</span>
                            <input id="regex-workshop-pattern" type="text" spellcheck="false" placeholder="例如：\\[HP:(\\d+)\\]">
                        </label>
                        <label class="regex-workshop-field">
                            <span>标志</span>
                            <input id="regex-workshop-flags" type="text" spellcheck="false" maxlength="8" value="gm" placeholder="例如：gi">
                        </label>
                        <label class="regex-workshop-field">
                            <span>测试文本</span>
                            <textarea id="regex-workshop-text" rows="8" placeholder="在此输入要测试的文本"></textarea>
                        </label>
                        <label class="regex-workshop-field">
                            <span>载入线下分组中的规则</span>
                            <select id="regex-workshop-offline-rule"></select>
                        </label>
                    </section>
                    <section class="regex-workshop-card regex-workshop-results" aria-live="polite">
                        <div class="regex-workshop-results-heading">
                            <h2>匹配结果</h2>
                            <span id="regex-workshop-count"></span>
                        </div>
                        <p id="regex-workshop-status" class="regex-workshop-status">输入正则表达式和测试文本以查看结果。</p>
                        <div id="regex-workshop-matches" class="regex-workshop-matches"></div>
                    </section>
                </main>
            </section>
        `);
        screen = document.getElementById('regex-workshop-screen');
        bindRegexWorkshop(screen);
    }

    renderRegexWorkshop(screen);
    renderRegexGroups(screen);
    renderRegexCharacterOptions(screen);
    renderRegexCharacterFilter(screen);
    renderRegexGroupCharacterOptions(screen);
    renderRegexOfflineRuleOptions(screen);
    screen.querySelectorAll('.regex-workshop-scope-switch button').forEach(button =>
        button.classList.toggle('is-active', button.dataset.scope === regexWorkshopScope)
    );
    screen.querySelector('#regex-workshop-scope-title').textContent =
        regexWorkshopScope === 'online' ? '线上正则分组' : '线下测试分组';
    switchScreen('regex-workshop-screen');
}

function bindRegexWorkshop(screen) {
    for (const selector of ['#regex-workshop-pattern', '#regex-workshop-flags', '#regex-workshop-text']) {
        screen.querySelector(selector).addEventListener('input', () => renderRegexWorkshop(screen));
    }
    screen.querySelector('#regex-workshop-add-group').addEventListener('click', () => {
        openRegexGroupEditor(screen, {
            id: `regex-group-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name: '新建分组',
            enabled: true,
            scope: regexWorkshopScope,
            characterId: regexWorkshopScope === 'online' ? regexWorkshopCharacterFilter || null : null,
            scripts: []
        });
    });
    screen.querySelector('#regex-workshop-import').addEventListener('change', importRegexGroupFile);
    screen.querySelector('.regex-workshop-scope-switch').addEventListener('click', event => {
        const button = event.target.closest('[data-scope]');
        if (!button) return;
        regexWorkshopScope = button.dataset.scope === 'offline' ? 'offline' : 'online';
        screen.querySelectorAll('.regex-workshop-scope-switch button').forEach(item =>
            item.classList.toggle('is-active', item === button)
        );
        renderRegexGroups(screen);
        renderRegexOfflineRuleOptions(screen);
        screen.querySelector('#regex-workshop-character-filter-wrap').hidden = regexWorkshopScope !== 'online';
        screen.querySelector('#regex-workshop-group-character-wrap').hidden = regexWorkshopScope !== 'online';
        screen.querySelector('#regex-workshop-scope-title').textContent =
            regexWorkshopScope === 'online' ? '线上正则分组' : '线下测试分组';
    });
    screen.querySelector('#regex-workshop-groups').addEventListener('change', handleRegexGroupChange);
    screen.querySelector('#regex-workshop-groups').addEventListener('click', handleRegexGroupClick);
    screen.querySelector('#regex-workshop-add-rule').addEventListener('click', addRegexRuleDraft);
    screen.querySelector('#regex-workshop-rules').addEventListener('input', updateRegexRuleDraft);
    screen.querySelector('#regex-workshop-rules').addEventListener('change', updateRegexRuleDraft);
    screen.querySelector('#regex-workshop-rules').addEventListener('click', handleRegexRuleClick);
    screen.querySelector('#regex-workshop-group-name').addEventListener('input', event => {
        if (regexWorkshopDraft) regexWorkshopDraft.name = event.target.value;
    });
    screen.querySelector('#regex-workshop-group-character').addEventListener('change', event => {
        if (regexWorkshopDraft) regexWorkshopDraft.characterId = event.target.value || null;
    });
    screen.querySelector('#regex-workshop-character-filter').addEventListener('change', event => {
        regexWorkshopCharacterFilter = event.target.value;
        renderRegexGroups(screen);
    });
    screen.querySelector('#regex-workshop-save-edit').addEventListener('click', saveRegexGroupDraft);
    screen.querySelector('#regex-workshop-cancel-edit').addEventListener('click', () => closeRegexGroupEditor(screen));
    screen.querySelector('#regex-workshop-export-character').addEventListener('click', exportRegexCharacterCard);
    screen.querySelector('#regex-workshop-offline-rule').addEventListener('change', loadOfflineRegexRule);
}

function renderRegexWorkshop(screen) {
    const pattern = screen.querySelector('#regex-workshop-pattern').value;
    const flags = screen.querySelector('#regex-workshop-flags').value;
    const text = screen.querySelector('#regex-workshop-text').value;
    const status = screen.querySelector('#regex-workshop-status');
    const count = screen.querySelector('#regex-workshop-count');
    const results = screen.querySelector('#regex-workshop-matches');
    results.replaceChildren();
    count.textContent = '';

    if (!pattern) {
        status.className = 'regex-workshop-status';
        status.textContent = '输入正则表达式和测试文本以查看结果。';
        return;
    }

    let expression;
    try {
        expression = new RegExp(pattern, flags);
    } catch (error) {
        status.className = 'regex-workshop-status is-error';
        status.textContent = `正则表达式无效：${error.message}`;
        return;
    }

    const matches = [];
    let truncated = false;
    let match;
    while ((match = expression.exec(text)) !== null) {
        if (matches.length === 100) {
            truncated = true;
            break;
        }
        matches.push(match);
        if (!expression.global) break;
        if (match[0].length === 0) {
            expression.lastIndex += 1;
        }
    }

    status.className = 'regex-workshop-status';
    count.textContent = `${matches.length}${truncated ? '+' : ''} 个`;
    if (!matches.length) {
        status.textContent = '没有找到匹配项。';
        return;
    }
    status.textContent = truncated ? '仅显示前 100 个匹配项。' : '找到以下匹配项：';

    matches.forEach((item, index) => {
        const card = document.createElement('article');
        card.className = 'regex-workshop-match';
        const title = document.createElement('strong');
        title.textContent = `匹配 ${index + 1} · 位置 ${item.index}`;
        const value = document.createElement('code');
        value.textContent = item[0];
        card.append(title, value);

        for (let groupIndex = 1; groupIndex < item.length; groupIndex += 1) {
            const group = document.createElement('p');
            group.className = 'regex-workshop-group';
            group.textContent = `捕获组 ${groupIndex}：${item[groupIndex] === undefined ? '未匹配' : item[groupIndex]}`;
            card.appendChild(group);
        }
        if (item.groups) {
            for (const [name, groupValue] of Object.entries(item.groups)) {
                const group = document.createElement('p');
                group.className = 'regex-workshop-group';
                group.textContent = `命名组 ${name}：${groupValue === undefined ? '未匹配' : groupValue}`;
                card.appendChild(group);
            }
        }
        results.appendChild(card);
    });
}

let regexWorkshopDraft = null;

function getOnlineRegexGroups() {
    if (!Array.isArray(db.onlineRegexGroups)) db.onlineRegexGroups = [];
    return db.onlineRegexGroups;
}

function getOfflineRegexGroups() {
    if (!Array.isArray(db.offlineRegexGroups)) db.offlineRegexGroups = [];
    return db.offlineRegexGroups;
}

function getRegexWorkshopGroups() {
    return regexWorkshopScope === 'offline' ? getOfflineRegexGroups() : getOnlineRegexGroups();
}

function normalizeRegexScripts(scripts) {
    if (!Array.isArray(scripts)) return [];
    return scripts.filter(script => script && typeof script === 'object' && typeof script.findRegex === 'string')
        .map((script, index) => ({
            ...script,
            id: String(script.id || `regex-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`),
            scriptName: String(script.scriptName || script.name || `正则 ${index + 1}`),
            findRegex: script.findRegex,
            replaceString: typeof script.replaceString === 'string' ? script.replaceString : '',
            placement: Array.isArray(script.placement)
                ? script.placement.map(Number).filter(Number.isFinite)
                : [2],
            disabled: script.disabled === true,
            trimStrings: Array.isArray(script.trimStrings)
                ? script.trimStrings.filter(value => typeof value === 'string')
                : [],
            promptOnly: script.promptOnly === true,
            markdownOnly: script.markdownOnly === true,
            runOnEdit: script.runOnEdit === true,
            substituteRegex: Number.isFinite(Number(script.substituteRegex)) ? Number(script.substituteRegex) : 0
        }));
}

function extractOnlineRegexScripts(raw) {
    if (Array.isArray(raw)) return normalizeRegexScripts(raw);
    if (!raw || typeof raw !== 'object') return [];
    if (typeof raw.findRegex === 'string') return normalizeRegexScripts([raw]);
    const data = raw.data && typeof raw.data === 'object' ? raw.data : raw;
    const candidates = [
        raw.regex_scripts,
        raw.extensions?.regex_scripts,
        data.regex_scripts,
        data.extensions?.regex_scripts,
        data.data?.regex_scripts,
        data.data?.extensions?.regex_scripts
    ];
    const scripts = candidates.find(Array.isArray);
    return scripts ? normalizeRegexScripts(scripts) : [];
}

function createCharacterRegexGroup(scripts, name, characterId) {
    const normalized = normalizeRegexScripts(scripts);
    if (!normalized.length) return null;
    const group = {
        id: `regex-card-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: `${name || '角色卡'} 正则`,
        enabled: true,
        characterId,
        scope: 'online',
        scripts: normalized
    };
    getOnlineRegexGroups().push(group);
    return group.id;
}

function importApiPresetRegexGroups(presets) {
    const groups = getOnlineRegexGroups();
    const imported = [];
    for (const preset of Array.isArray(presets) ? presets : []) {
        const scripts = extractOnlineRegexScripts(preset);
        if (!scripts.length || groups.some(group => group.sourcePresetId && group.sourcePresetId === preset.id)) continue;
        const group = {
            id: `regex-api-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name: `${preset.name || 'API 预设'} 正则`,
            enabled: true,
            scope: 'online',
            sourcePresetId: preset.id || null,
            scripts
        };
        groups.push(group);
        imported.push(group);
    }
    return imported;
}

function isOnlineRegexGroupEnabled(group, chat, targetCharacter = chat) {
    if (group.enabled === false) return false;
    if (group.characterId && (!targetCharacter || group.characterId !== targetCharacter.id)) return false;
    return (targetCharacter || chat).regexGroupSettings?.[group.id] !== false;
}

function parseOnlineRegexPattern(value) {
    const match = String(value || '').match(/^\/([\s\S]*)\/([dgimsuvy]*)$/);
    return match ? { pattern: match[1], flags: match[2] } : { pattern: String(value || ''), flags: '' };
}

function substituteRegexVariables(value, chat, escape = false) {
    const names = {
        char: chat.realName || chat.remarkName || chat.name || '',
        user: chat.myName || chat.me?.nickname || 'user'
    };
    return String(value || '').replace(/\{\{(char|user)\}\}/gi, (_match, key) => {
        const name = names[key.toLowerCase()];
        return escape ? name.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&') : name;
    });
}

function filterRegexCapture(value, trimStrings, chat) {
    let result = String(value ?? '');
    for (const trimString of Array.isArray(trimStrings) ? trimStrings : []) {
        if (typeof trimString === 'string' && trimString) {
            result = result.split(substituteRegexVariables(trimString, chat)).join('');
        }
    }
    return result;
}

function resolveOnlineRegexCharacter(chat, senderId) {
    if ((db.characters || []).some(character => character.id === chat?.id)) return chat;
    if (!senderId || senderId === 'user_me') return null;
    const member = chat?.members?.find(item => item.id === senderId || item.originalCharId === senderId);
    const characterId = member?.originalCharId || senderId;
    return (db.characters || []).find(character => character.id === characterId) || null;
}

function applyOnlineRegex(chat, text, role, promptContext = false, depth = null, senderId = null) {
    const targetCharacter = resolveOnlineRegexCharacter(chat, senderId);
    return applyRegexGroups(getOnlineRegexGroups(), chat, text, role, promptContext, depth, targetCharacter);
}

function applyOfflineMeetRegex(session, text, role, promptContext = false, depth = null) {
    const participants = (session?.characters || []).map(character => ({
        ...character,
        regexGroupSettings: character.regexGroupSettings || {}
    }));
    if (!participants.length) {
        return applyRegexGroups(getOfflineRegexGroups(), { id: null }, text, role, promptContext, depth);
    }

    return getOfflineRegexGroups().reduce((result, group) => {
        if (group.enabled === false) return result;
        if (group.characterId && !participants.some(character => character.id === group.characterId)) return result;
        const targets = group.characterId
            ? participants.filter(character => character.id === group.characterId)
            : participants;
        if (!targets.some(character => character.regexGroupSettings?.[group.id] !== false)) return result;
        return applyRegexGroup(group, targets[0], result, role, promptContext, depth);
    }, text);
}

function applyRegexGroups(groups, chat, text, role, promptContext = false, depth = null, targetCharacter = chat) {
    if (typeof text !== 'string' || !chat || !['assistant', 'user'].includes(role)) return text;
    let result = text;
    for (const group of groups) {
        if (!isOnlineRegexGroupEnabled(group, chat, targetCharacter)) continue;
        result = applyRegexGroup(group, targetCharacter || chat, result, role, promptContext, depth);
    }
    return result;
}

function applyRegexGroup(group, chat, text, role, promptContext = false, depth = null) {
    const placement = role === 'assistant' ? 2 : 1;
    let result = text;
    for (const script of Array.isArray(group.scripts) ? group.scripts : []) {
        if (script.disabled) continue;
        if (promptContext ? !script.promptOnly : (script.promptOnly || script.markdownOnly)) continue;
        if (typeof depth === 'number') {
            if (script.minDepth != null && Number.isFinite(Number(script.minDepth)) && depth < Number(script.minDepth)) continue;
            if (script.maxDepth != null && Number.isFinite(Number(script.maxDepth)) && depth > Number(script.maxDepth)) continue;
        }
        const placements = Array.isArray(script.placement) ? script.placement : [2];
        if (!placements.includes(placement)) continue;
        const substituteMode = Number(script.substituteRegex || 0);
        const findRegex = substituteMode === 1 || substituteMode === 2
            ? substituteRegexVariables(script.findRegex, chat, substituteMode === 2)
            : script.findRegex;
        const parsed = parseOnlineRegexPattern(findRegex);
        try {
            const regex = new RegExp(parsed.pattern, parsed.flags);
            const replacement = String(script.replaceString || '')
                .replace(/{{match}}/gi, '$0')
                .replace(/\$&/g, '$0');
            result = result.replace(regex, (...args) => replacement
                .replace(/\$(\d+)|\$<([^>]+)>/g, (_token, index, groupName) => {
                    const matchedValue = index
                        ? args[Number(index)]
                        : args[args.length - 1]?.[groupName];
                    return matchedValue === undefined
                        ? ''
                        : filterRegexCapture(matchedValue, script.trimStrings, chat);
                })
                .replace(/\{\{(char|user)\}\}/gi, (_token, name) =>
                    name.toLowerCase() === 'char'
                        ? (chat.realName || chat.remarkName || chat.name || '')
                        : (chat.myName || chat.me?.nickname || 'user')
                ));
        } catch (error) {
            console.warn(`正则“${script.scriptName || group.name}”无效：`, error);
        }
    }
    return result;
}

function transformOnlineRegexHistory(chat, history) {
    if (!Array.isArray(history)) return history;
    for (const [index, message] of history.entries()) {
        if (!message || !['assistant', 'user'].includes(message.role)) continue;
        const transform = value => {
            if (typeof value !== 'string') return value;
            const wrapped = value.match(/^(\[[^\]\r\n]{1,100}?(?:的消息|的回复|消息|回复)[：:])([\s\S]*)\]$/);
            const depth = history.length - index - 1;
            if (!wrapped) return applyOnlineRegex(chat, value, message.role, true, depth, message.senderId);
            return `${wrapped[1]}${applyOnlineRegex(chat, wrapped[2], message.role, true, depth, message.senderId)}]`;
        };
        message.content = transform(message.content);
        if (Array.isArray(message.parts)) {
            message.parts = message.parts.map(part => part && typeof part.text === 'string'
                ? { ...part, text: transform(part.text) }
                : part);
        }
    }
    return history;
}

function renderRegexCharacterOptions(screen) {
    const select = screen.querySelector('#regex-workshop-character');
    const previous = select.value;
    select.replaceChildren();
    for (const character of db.characters || []) {
        const option = document.createElement('option');
        option.value = character.id;
        option.textContent = character.remarkName || character.realName || '未命名角色';
        select.appendChild(option);
    }
    if ((db.characters || []).some(character => character.id === previous)) select.value = previous;
    screen.querySelector('#regex-workshop-export-character').disabled = !(db.characters || []).length;
}

function renderRegexCharacterFilter(screen) {
    const select = screen.querySelector('#regex-workshop-character-filter');
    const previous = regexWorkshopCharacterFilter;
    select.replaceChildren();
    const allOption = document.createElement('option');
    allOption.value = '';
    allOption.textContent = '全部角色';
    select.appendChild(allOption);
    for (const character of db.characters || []) {
        const option = document.createElement('option');
        option.value = character.id;
        option.textContent = character.remarkName || character.realName || '未命名角色';
        select.appendChild(option);
    }
    regexWorkshopCharacterFilter = (db.characters || []).some(character => character.id === previous) ? previous : '';
    select.value = regexWorkshopCharacterFilter;
}

function renderRegexGroupCharacterOptions(screen) {
    const select = screen.querySelector('#regex-workshop-group-character');
    const currentValue = regexWorkshopDraft?.characterId || regexWorkshopCharacterFilter;
    select.replaceChildren();
    const allOption = document.createElement('option');
    allOption.value = '';
    allOption.textContent = '所有角色（共享分组）';
    select.appendChild(allOption);
    for (const character of db.characters || []) {
        const option = document.createElement('option');
        option.value = character.id;
        option.textContent = character.remarkName || character.realName || '未命名角色';
        select.appendChild(option);
    }
    if ([...select.options].some(option => option.value === currentValue)) select.value = currentValue;
}

function renderRegexOfflineRuleOptions(screen) {
    const select = screen.querySelector('#regex-workshop-offline-rule');
    const currentValue = select.value;
    select.replaceChildren();
    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = '选择线下分组中的规则…';
    select.appendChild(empty);
    for (const group of getOfflineRegexGroups()) {
        for (const [index, script] of (group.scripts || []).entries()) {
            const option = document.createElement('option');
            option.value = `${group.id}:${index}`;
            option.textContent = `${group.name} · ${script.scriptName || `正则 ${index + 1}`}`;
            select.appendChild(option);
        }
    }
    if ([...select.options].some(option => option.value === currentValue)) select.value = currentValue;
}

function loadOfflineRegexRule(event) {
    const [groupId, indexValue] = event.target.value.split(':');
    const group = getOfflineRegexGroups().find(item => item.id === groupId);
    const script = group?.scripts?.[Number(indexValue)];
    if (!script || group.enabled === false || script.disabled) return;
    const parsed = parseOnlineRegexPattern(script.findRegex);
    const screen = document.getElementById('regex-workshop-screen');
    screen.querySelector('#regex-workshop-pattern').value = parsed.pattern;
    screen.querySelector('#regex-workshop-flags').value = parsed.flags || 'gm';
    renderRegexWorkshop(screen);
}

function renderRegexGroups(screen) {
    const container = screen.querySelector('#regex-workshop-groups');
    const empty = screen.querySelector('#regex-workshop-groups-empty');
    container.replaceChildren();
    const characters = db.characters || [];
    const allGroups = getRegexWorkshopGroups();
    const groups = regexWorkshopScope === 'online' && regexWorkshopCharacterFilter
        ? allGroups.filter(group => !group.characterId || group.characterId === regexWorkshopCharacterFilter)
        : allGroups;
    empty.hidden = groups.length > 0;
    screen.querySelector('#regex-workshop-character').closest('.regex-workshop-card').hidden = regexWorkshopScope !== 'online';
    screen.querySelector('#regex-workshop-character-filter-wrap').hidden = regexWorkshopScope !== 'online';
    screen.querySelector('#regex-workshop-group-character-wrap').hidden = regexWorkshopScope !== 'online';
    renderRegexGroupCharacterOptions(screen);
    for (const group of groups) {
        const card = document.createElement('article');
        card.className = 'regex-workshop-group';
        card.dataset.groupId = group.id;
        const header = document.createElement('div');
        header.className = 'regex-workshop-group-heading';
        const name = document.createElement('strong');
        name.textContent = group.name || '未命名分组';
        const count = document.createElement('span');
        count.textContent = `${(group.scripts || []).length} 条`;
        const enabledLabel = document.createElement('label');
        enabledLabel.className = 'regex-workshop-toggle';
        const enabled = document.createElement('input');
        enabled.type = 'checkbox';
        enabled.checked = group.enabled !== false;
        enabled.dataset.action = 'group-enabled';
        enabledLabel.append(enabled, document.createTextNode(regexWorkshopScope === 'online' ? '线上启用' : '线下可用'));
        header.append(name, count, enabledLabel);

        const actions = document.createElement('div');
        actions.className = 'regex-workshop-toolbar';
        actions.append(
            regexWorkshopButton('编辑', 'edit-group'),
            regexWorkshopButton('导出规则', 'export-rules'),
            regexWorkshopButton('导出预设', 'export-preset'),
            regexWorkshopButton('删除', 'delete-group', 'is-danger')
        );

        const roleBox = document.createElement('div');
        roleBox.className = 'regex-workshop-roles';
        const roleTitle = document.createElement('span');
        roleTitle.textContent = regexWorkshopScope === 'online' ? '按角色启用' : '使用范围';
        roleBox.appendChild(roleTitle);
        const visibleCharacters = regexWorkshopScope !== 'online'
            ? []
            : group.characterId
            ? characters.filter(character => character.id === group.characterId)
            : regexWorkshopCharacterFilter
            ? characters.filter(character => character.id === regexWorkshopCharacterFilter)
            : characters;
        if (regexWorkshopScope !== 'online') {
            const offlineHint = document.createElement('small');
            offlineHint.textContent = '线下规则只会载入测试器，不会影响聊天内容。';
            roleBox.appendChild(offlineHint);
        }
        if (regexWorkshopScope === 'online' && !visibleCharacters.length) {
            const noRoles = document.createElement('small');
            noRoles.textContent = group.characterId ? '此规则来自已删除的角色卡角色。' : '暂无角色';
            roleBox.appendChild(noRoles);
        }
        for (const character of visibleCharacters) {
            const label = document.createElement('label');
            label.className = 'regex-workshop-toggle';
            const toggle = document.createElement('input');
            toggle.type = 'checkbox';
            toggle.checked = character.regexGroupSettings?.[group.id] !== false;
            toggle.dataset.action = 'role-enabled';
            toggle.dataset.characterId = character.id;
            label.append(toggle, document.createTextNode(character.remarkName || character.realName || '未命名角色'));
            roleBox.appendChild(label);
        }
        card.append(header, actions, roleBox);
        container.appendChild(card);
    }
}

function regexWorkshopButton(text, action, extraClass = '') {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.action = action;
    button.textContent = text;
    if (extraClass) button.className = extraClass;
    return button;
}

function openRegexGroupEditor(screen, group) {
    regexWorkshopDraft = JSON.parse(JSON.stringify(group));
    if (!Array.isArray(regexWorkshopDraft.scripts)) regexWorkshopDraft.scripts = [];
    screen.querySelector('#regex-workshop-editor').hidden = false;
    screen.querySelector('#regex-workshop-editor-title').textContent = `编辑分组 · ${group.name}`;
    screen.querySelector('#regex-workshop-group-name').value = group.name || '';
    renderRegexGroupCharacterOptions(screen);
    screen.querySelector('#regex-workshop-group-character').value = group.characterId || '';
    screen.querySelector('#regex-workshop-group-character-wrap').hidden = regexWorkshopScope !== 'online';
    renderRegexRuleDraft(screen);
    screen.querySelector('#regex-workshop-editor').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderRegexRuleDraft(screen = document.getElementById('regex-workshop-screen')) {
    if (!screen || !regexWorkshopDraft) return;
    const container = screen.querySelector('#regex-workshop-rules');
    container.replaceChildren();
    regexWorkshopDraft.scripts.forEach((script, index) => {
        const card = document.createElement('article');
        card.className = 'regex-workshop-rule';
        card.dataset.ruleIndex = String(index);
        const field = (labelText, key, value, multiline = false) => {
            const label = document.createElement('label');
            label.className = 'regex-workshop-field';
            const title = document.createElement('span');
            title.textContent = labelText;
            const input = document.createElement(multiline ? 'textarea' : 'input');
            input.dataset.field = key;
            input.spellcheck = false;
            input.value = value || '';
            if (multiline) input.rows = 3;
            else if (key === 'minDepth' || key === 'maxDepth') input.type = 'number';
            label.append(title, input);
            return label;
        };
        const heading = document.createElement('div');
        heading.className = 'regex-workshop-group-heading';
        const title = document.createElement('strong');
        title.textContent = `规则 ${index + 1}`;
        const ruleActions = document.createElement('div');
        ruleActions.className = 'regex-workshop-toolbar';
        ruleActions.append(
            regexWorkshopButton('上移', 'move-rule-up'),
            regexWorkshopButton('下移', 'move-rule-down'),
            regexWorkshopButton('删除规则', 'remove-rule', 'is-danger')
        );
        heading.append(title, ruleActions);
        const switches = document.createElement('div');
        switches.className = 'regex-workshop-roles';
        switches.append(
            regexRuleToggle('启用规则', 'disabled', !script.disabled),
            regexRuleToggle('仅用于上下文', 'promptOnly', !!script.promptOnly),
            regexRuleToggle('仅 Markdown', 'markdownOnly', !!script.markdownOnly),
            regexRuleToggle('编辑消息时运行', 'runOnEdit', !!script.runOnEdit)
        );
        for (const [value, labelText] of [[1, '用户消息'], [2, '角色回复'], [3, '命令']]) {
            switches.appendChild(regexRuleToggle(labelText, `placement-${value}`, (script.placement || [2]).includes(value)));
        }
        const substituteLabel = document.createElement('label');
        substituteLabel.className = 'regex-workshop-field';
        const substituteTitle = document.createElement('span');
        substituteTitle.textContent = '表达式变量替换';
        const substitute = document.createElement('select');
        substitute.dataset.field = 'substituteRegex';
        for (const [value, labelText] of [[0, '关闭'], [1, '原样替换变量'], [2, '转义变量字符']]) {
            const option = document.createElement('option');
            option.value = String(value);
            option.textContent = labelText;
            substitute.appendChild(option);
        }
        substitute.value = String(script.substituteRegex || 0);
        substituteLabel.append(substituteTitle, substitute);
        card.append(
            heading,
            field('名称', 'scriptName', script.scriptName),
            field('匹配表达式（支持 /表达式/标志）', 'findRegex', script.findRegex),
            field('替换内容', 'replaceString', script.replaceString, true),
            field('移除替换捕获值中的文本（每行一条）', 'trimStrings', (script.trimStrings || []).join('\n'), true),
            field('最小上下文深度', 'minDepth', script.minDepth ?? ''),
            field('最大上下文深度', 'maxDepth', script.maxDepth ?? ''),
            substituteLabel,
            switches
        );
        container.appendChild(card);
    });
}

function regexRuleToggle(labelText, field, checked) {
    const label = document.createElement('label');
    label.className = 'regex-workshop-toggle';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.dataset.field = field;
    input.checked = checked;
    label.append(input, document.createTextNode(labelText));
    return label;
}

function addRegexRuleDraft() {
    if (!regexWorkshopDraft) return;
    regexWorkshopDraft.scripts.push({
        id: `regex-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        scriptName: `正则 ${regexWorkshopDraft.scripts.length + 1}`,
        findRegex: '',
        replaceString: '',
        placement: [2],
        disabled: false
    });
    renderRegexRuleDraft();
}

function updateRegexRuleDraft(event) {
    const field = event.target.dataset.field;
    const card = event.target.closest('.regex-workshop-rule');
    const script = regexWorkshopDraft?.scripts[Number(card?.dataset.ruleIndex)];
    if (!field || !script) return;
    if (field === 'disabled') script.disabled = !event.target.checked;
    else if (field === 'promptOnly') script.promptOnly = event.target.checked;
    else if (field === 'markdownOnly' || field === 'runOnEdit') script[field] = event.target.checked;
    else if (field === 'trimStrings') script.trimStrings = event.target.value.split(/\r?\n/).filter(Boolean);
    else if (field === 'minDepth' || field === 'maxDepth') script[field] = event.target.value === '' ? null : Number(event.target.value);
    else if (field === 'substituteRegex') script.substituteRegex = Number(event.target.value);
    else if (field.startsWith('placement-')) {
        const value = Number(field.slice('placement-'.length));
        const placements = new Set(script.placement || []);
        if (event.target.checked) placements.add(value);
        else placements.delete(value);
        script.placement = [...placements];
    } else script[field] = event.target.value;
}

function handleRegexRuleClick(event) {
    const button = event.target.closest('[data-action]');
    if (!button || !regexWorkshopDraft) return;
    const card = button.closest('.regex-workshop-rule');
    const index = Number(card.dataset.ruleIndex);
    if (button.dataset.action === 'remove-rule') {
        regexWorkshopDraft.scripts.splice(index, 1);
    } else if (button.dataset.action === 'move-rule-up' && index > 0) {
        [regexWorkshopDraft.scripts[index - 1], regexWorkshopDraft.scripts[index]] =
            [regexWorkshopDraft.scripts[index], regexWorkshopDraft.scripts[index - 1]];
    } else if (button.dataset.action === 'move-rule-down' && index < regexWorkshopDraft.scripts.length - 1) {
        [regexWorkshopDraft.scripts[index + 1], regexWorkshopDraft.scripts[index]] =
            [regexWorkshopDraft.scripts[index], regexWorkshopDraft.scripts[index + 1]];
    } else return;
    renderRegexRuleDraft();
}

async function saveRegexGroupDraft() {
    if (!regexWorkshopDraft) return;
    const draft = regexWorkshopDraft;
    const groups = draft.scope === 'offline' ? getOfflineRegexGroups() : getOnlineRegexGroups();
    const previousGroups = JSON.parse(JSON.stringify(groups));
    const current = groups.find(group => group.id === draft.id);
    if (current) Object.assign(current, draft, { name: draft.name.trim() || '未命名分组' });
    else groups.push({ ...draft, name: draft.name.trim() || '未命名分组' });
    try {
        await saveData();
        const screen = document.getElementById('regex-workshop-screen');
        closeRegexGroupEditor(screen);
        renderRegexGroups(screen);
        renderRegexOfflineRuleOptions(screen);
    } catch (error) {
        if (draft.scope === 'offline') db.offlineRegexGroups = previousGroups;
        else db.onlineRegexGroups = previousGroups;
        console.error('保存线上正则分组失败：', error);
        showToast(`保存失败：${error.message}`);
    }
}

function closeRegexGroupEditor(screen) {
    regexWorkshopDraft = null;
    screen.querySelector('#regex-workshop-editor').hidden = true;
}

async function handleRegexGroupChange(event) {
    const control = event.target;
    const card = control.closest('.regex-workshop-group');
    const groups = getRegexWorkshopGroups();
    const group = groups.find(item => item.id === card?.dataset.groupId);
    if (!group) return;
    const previousValue = control.dataset.action === 'group-enabled'
        ? group.enabled
        : (db.characters || []).find(item => item.id === control.dataset.characterId)?.regexGroupSettings?.[group.id];
    if (control.dataset.action === 'group-enabled') {
        group.enabled = control.checked;
    } else if (control.dataset.action === 'role-enabled') {
        const character = (db.characters || []).find(item => item.id === control.dataset.characterId);
        if (!character) return;
        if (!character.regexGroupSettings || typeof character.regexGroupSettings !== 'object') character.regexGroupSettings = {};
        character.regexGroupSettings[group.id] = control.checked;
    } else return;
    try {
        await saveData();
        renderRegexGroups(document.getElementById('regex-workshop-screen'));
    } catch (error) {
        if (control.dataset.action === 'group-enabled') group.enabled = previousValue;
        else {
            const character = (db.characters || []).find(item => item.id === control.dataset.characterId);
            if (character?.regexGroupSettings) {
                if (previousValue === undefined) delete character.regexGroupSettings[group.id];
                else character.regexGroupSettings[group.id] = previousValue;
            }
        }
        renderRegexGroups(document.getElementById('regex-workshop-screen'));
        console.error('保存线上正则开关失败：', error);
        showToast(`保存失败：${error.message}`);
    }
}

async function handleRegexGroupClick(event) {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const card = button.closest('.regex-workshop-group');
    const groups = getRegexWorkshopGroups();
    const group = groups.find(item => item.id === card?.dataset.groupId);
    if (!group) return;
    const screen = document.getElementById('regex-workshop-screen');
    if (button.dataset.action === 'edit-group') {
        openRegexGroupEditor(screen, group);
    } else if (button.dataset.action === 'export-rules') {
        downloadRegexJson(group.scripts || [], `${safeRegexFilename(group.name)}_regex_scripts.json`);
    } else if (button.dataset.action === 'export-preset') {
        downloadRegexJson({
            name: group.name,
            extensions: { regex_scripts: group.scripts || [] }
        }, `${safeRegexFilename(group.name)}_preset.json`);
    } else if (button.dataset.action === 'delete-group') {
        if (!confirm(`确定删除正则分组“${group.name}”吗？`)) return;
        const previousGroups = JSON.parse(JSON.stringify(groups));
        const index = groups.indexOf(group);
        groups.splice(index, 1);
        try {
            await saveData();
            renderRegexGroups(screen);
        } catch (error) {
            if (regexWorkshopScope === 'offline') db.offlineRegexGroups = previousGroups;
            else db.onlineRegexGroups = previousGroups;
            console.error('删除线上正则分组失败：', error);
            showToast(`删除失败：${error.message}`);
        }
    }
}

async function importRegexGroupFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
        const raw = JSON.parse(await file.text());
        const scripts = extractOnlineRegexScripts(raw);
        if (!scripts.length) throw new Error('文件中没有找到 regex_scripts 正则规则。');
        const selectedCharacterId = regexWorkshopCharacterFilter || null;
        const name = String(raw.name || raw.data?.name || file.name.replace(/\.json$/i, '') || '导入的正则').slice(0, 100);
        const group = {
            id: `regex-group-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name,
            enabled: true,
            scope: regexWorkshopScope,
            characterId: regexWorkshopScope === 'online' ? regexWorkshopCharacterFilter || null : null,
            scripts
        };
        const isCharacterCard = String(raw.spec || '').startsWith('chara_card')
            || (raw.data && typeof raw.data === 'object'
                && ['first_mes', 'mes_example', 'alternate_greetings'].some(key => key in raw.data))
            || !!(raw.name && raw.description && raw.personality);
        if (isCharacterCard && regexWorkshopScope === 'online') {
            const importedName = raw.data?.name || raw.name;
            const matchedCharacter = (db.characters || []).find(character =>
                [character.realName, character.remarkName].some(name =>
                    name && importedName && name.trim().toLowerCase() === importedName.trim().toLowerCase()
                )
            );
            group.characterId = matchedCharacter?.id || selectedCharacterId || null;
        }
        const groups = getRegexWorkshopGroups();
        groups.push(group);
        try {
            await saveData();
        } catch (error) {
            groups.pop();
            throw error;
        }
        const screen = document.getElementById('regex-workshop-screen');
        renderRegexGroups(screen);
        renderRegexOfflineRuleOptions(screen);
        showToast(`已导入 ${scripts.length} 条正则。`);
    } catch (error) {
        console.error('导入正则失败：', error);
        showToast(`导入失败：${error.message}`);
    } finally {
        event.target.value = '';
    }
}

function safeRegexFilename(name) {
    return String(name || 'regex').replace(/[\\/:*?"<>|]/g, '_').slice(0, 80);
}

function downloadRegexJson(value, filename) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportRegexCharacterCard() {
    const character = (db.characters || []).find(item =>
        item.id === document.getElementById('regex-workshop-character').value
    );
    if (!character) return showToast('请先选择角色。');
    const source = character.stCharacterCard && typeof character.stCharacterCard === 'object'
        ? JSON.parse(JSON.stringify(character.stCharacterCard))
        : null;
    let card;
    if (source?.data && typeof source.data === 'object') {
        card = {
            ...source,
            spec: source.spec || 'chara_card_v2',
            spec_version: source.spec_version || '2.0'
        };
    } else if (source && source.name) {
        card = { spec: 'chara_card_v2', spec_version: '2.0', data: source };
    } else {
        card = {
            spec: 'chara_card_v2',
            spec_version: '2.0',
            data: {
                name: character.realName || character.remarkName || '未命名',
                description: character.persona || '',
                personality: '',
                scenario: '',
                first_mes: '',
                mes_example: '',
                creator_notes: '',
                system_prompt: '',
                post_history_instructions: '',
                alternate_greetings: [],
                tags: [],
                creator: 'UwU',
                character_version: '1.0',
                extensions: {}
            }
        };
    }
    const data = card.data;
    if (!data.extensions || typeof data.extensions !== 'object') data.extensions = {};
    const scripts = [];
    for (const group of getOnlineRegexGroups()) {
        if (group.characterId && group.characterId !== character.id) continue;
        for (const script of Array.isArray(group.scripts) ? group.scripts : []) {
            const exported = { ...script };
            if (!isOnlineRegexGroupEnabled(group, character)) exported.disabled = true;
            scripts.push(exported);
        }
    }
    data.name = character.realName || character.remarkName || data.name || '未命名';
    data.extensions.regex_scripts = scripts;
    downloadRegexJson(card, `${safeRegexFilename(data.name)}_character_card.json`);
}

window.UwURegexWorkshop = {
    extractRegexScripts: extractOnlineRegexScripts,
    createCharacterGroup: createCharacterRegexGroup,
    importApiPresetGroups: importApiPresetRegexGroups,
    apply: applyOnlineRegex,
    applyOfflineMeet: applyOfflineMeetRegex,
    transformHistory: transformOnlineRegexHistory
};
