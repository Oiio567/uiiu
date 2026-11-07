function getOfflineMeetPromptPresets() {
    if (!Array.isArray(db.offlineMeetPromptPresets)) db.offlineMeetPromptPresets = [];
    return db.offlineMeetPromptPresets;
}

let editingOfflineMeetPresetId = null;
let offlineMeetPresetDraft = null;

function openPresetWorkshop(returnTarget = 'more-screen') {
    let screen = document.getElementById('preset-workshop-screen');
    if (!screen) {
        const phoneScreen = document.querySelector('.phone-screen');
        if (!phoneScreen) throw new Error('无法找到应用页面容器');
        phoneScreen.insertAdjacentHTML('beforeend', `
            <section id="preset-workshop-screen" class="screen">
                <header class="app-header preset-workshop-header">
                    <button class="back-btn" data-target="more-screen" aria-label="返回">‹</button>
                    <div class="title-container"><h1 class="title">预设工坊</h1></div>
                    <div class="placeholder"></div>
                </header>
                <main class="content preset-workshop-content">
                    <section id="preset-workshop-manager" class="preset-workshop-card">
                        <div class="preset-workshop-heading">
                            <span class="preset-workshop-heading-icon" aria-hidden="true">☷</span>
                            <div>
                                <h2>SillyTavern 提示词预设</h2>
                                <p>导入 SillyTavern JSON 预设，在 Meet 中按场景自由选择。</p>
                            </div>
                        </div>
                        <div class="preset-workshop-import">
                            <label class="preset-workshop-file-label" for="preset-workshop-file">选择 JSON 文件</label>
                            <input id="preset-workshop-file" type="file" accept=".json,application/json" multiple>
                            <p>支持 SillyTavern 提示词列表及其启用状态；未识别的模板变量会原样保留。</p>
                        </div>
                        <div class="preset-workshop-section-heading">
                            <h3>已导入预设</h3>
                            <span id="preset-workshop-count"></span>
                        </div>
                        <div id="preset-workshop-list" class="preset-workshop-list"></div>
                        <p id="preset-workshop-empty" class="preset-workshop-empty" hidden>尚未导入预设，将使用内置 Meet 提示词。</p>
                    </section>
                    <section id="preset-workshop-editor" class="preset-workshop-card" hidden>
                        <div class="preset-workshop-editor-heading">
                            <div>
                                <h2 id="preset-workshop-editor-title">编辑预设</h2>
                                <p>可逐条启用、停用或修改提示词内容。</p>
                            </div>
                        </div>
                        <div id="preset-workshop-entries" class="preset-workshop-entries"></div>
                        <p id="preset-workshop-no-entries" class="preset-workshop-empty" hidden>此预设没有可编辑的提示词条目。</p>
                        <div class="preset-workshop-editor-actions">
                            <button id="preset-workshop-cancel-edit" type="button">取消</button>
                            <button id="preset-workshop-save-edit" type="button">保存修改</button>
                        </div>
                    </section>
                </main>
            </section>
        `);
        screen = document.getElementById('preset-workshop-screen');
        bindPresetWorkshop(screen);
    }

    editingOfflineMeetPresetId = null;
    offlineMeetPresetDraft = null;
    screen.querySelector('.preset-workshop-header .back-btn').dataset.target = returnTarget;
    screen.querySelector('#preset-workshop-manager').hidden = false;
    screen.querySelector('#preset-workshop-editor').hidden = true;
    screen.querySelector('.preset-workshop-header .title').textContent = '预设工坊';
    renderPresetWorkshop(screen);
    switchScreen('preset-workshop-screen');
}

function normalizeImportedOfflineMeetPreset(raw, filename) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('文件内容必须是 JSON 对象。');
    const data = raw.data && typeof raw.data === 'object' ? raw.data : raw;
    const prompts = Array.isArray(data.prompts) ? data.prompts : [];
    if (!prompts.some(prompt => typeof prompt?.content === 'string' || typeof prompt?.system_prompt === 'string')) {
        throw new Error('没有找到 SillyTavern prompts 提示词列表。');
    }
    return {
        id: `meet-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: String(raw.name || data.name || filename.replace(/\.json$/i, '') || 'SillyTavern 预设').slice(0, 100),
        enabled: true,
        data
    };
}

async function importOfflineMeetPromptFiles(event) {
    const files = [...event.target.files];
    if (!files.length) return;
    const imported = [];
    const errors = [];
    let persistenceFailed = false;
    for (const file of files) {
        try {
            const raw = JSON.parse(await file.text());
            imported.push(normalizeImportedOfflineMeetPreset(raw, file.name));
        } catch (error) {
            errors.push(`${file.name}: ${error.message}`);
        }
    }

    if (imported.length) {
        const presets = getOfflineMeetPromptPresets();
        presets.push(...imported);
        if (!db.activeOfflineMeetPromptPresetId) db.activeOfflineMeetPromptPresetId = imported[0].id;
        persistenceFailed = !await saveOfflineMeetSettings('保存导入的见面预设');
    }
    event.target.value = '';
    const screen = document.getElementById('preset-workshop-screen');
    renderPresetWorkshop(screen);
    renderOfflineMeetPresetOptions();
    const summary = imported.length ? `已导入 ${imported.length} 个预设。` : '没有导入预设。';
    if (persistenceFailed) {
        if (errors.length) showToast(`预设未能保存到本机。${errors.join(' ')}`);
    } else {
        showToast(errors.length ? `${summary}${errors.join(' ')}` : summary);
    }
}

function renderPresetWorkshop(screen) {
    const list = screen.querySelector('#preset-workshop-list');
    const empty = screen.querySelector('#preset-workshop-empty');
    const presets = getOfflineMeetPromptPresets();
    list.replaceChildren();
    empty.hidden = presets.length > 0;
    screen.querySelector('#preset-workshop-count').textContent = `${presets.length} 个`;

    presets.forEach(preset => {
        const row = document.createElement('article');
        row.className = 'preset-workshop-row';
        row.dataset.presetId = preset.id;

        const info = document.createElement('div');
        info.className = 'preset-workshop-row-info';
        const name = document.createElement('input');
        name.className = 'preset-workshop-name';
        name.type = 'text';
        name.value = preset.name;
        name.maxLength = 100;
        name.dataset.action = 'rename';
        name.setAttribute('aria-label', '预设名称');
        const meta = document.createElement('small');
        const promptCount = Array.isArray(preset.data?.prompts) ? preset.data.prompts.length : 0;
        meta.textContent = `${promptCount} 条提示词${preset.id === db.activeOfflineMeetPromptPresetId ? ' · 当前使用' : ''}`;
        info.append(name, meta);

        const controls = document.createElement('div');
        controls.className = 'preset-workshop-controls';
        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.dataset.action = 'edit';
        editButton.textContent = '编辑';

        const exportButton = document.createElement('button');
        exportButton.type = 'button';
        exportButton.dataset.action = 'export';
        exportButton.textContent = '导出';
        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.dataset.action = 'delete';
        deleteButton.textContent = '删除';
        controls.append(editButton, exportButton, deleteButton);
        row.append(info, controls);
        list.appendChild(row);
    });
}

function getOfflineMeetPromptEntryState(preset, prompt) {
    let enabled = prompt.enabled !== false;
    for (const group of preset.data?.prompt_order || []) {
        for (const entry of group.order || []) {
            if (entry.identifier === prompt.identifier && entry.enabled === false) enabled = false;
        }
    }
    return enabled;
}

function openOfflineMeetPresetEditor(preset) {
    const screen = document.getElementById('preset-workshop-screen');
    editingOfflineMeetPresetId = preset.id;
    offlineMeetPresetDraft = JSON.parse(JSON.stringify(preset));
    screen.querySelector('#preset-workshop-manager').hidden = true;
    screen.querySelector('#preset-workshop-editor').hidden = false;
    screen.querySelector('.preset-workshop-header .title').textContent = '编辑预设';
    screen.querySelector('#preset-workshop-editor-title').textContent = preset.name;
    renderOfflineMeetPromptEntries(screen, offlineMeetPresetDraft);
}

function renderOfflineMeetPromptEntries(screen, preset) {
    const list = screen.querySelector('#preset-workshop-entries');
    const empty = screen.querySelector('#preset-workshop-no-entries');
    list.replaceChildren();
    const prompts = Array.isArray(preset.data?.prompts) ? preset.data.prompts : [];
    const editablePrompts = prompts
        .map((prompt, index) => ({ prompt, index }))
        .filter(({ prompt }) => prompt && typeof prompt === 'object'
            && (typeof prompt.content === 'string' || typeof prompt.system_prompt === 'string'));
    empty.hidden = editablePrompts.length > 0;

    editablePrompts.forEach(({ prompt, index }) => {
        const entry = document.createElement('article');
        entry.className = 'preset-workshop-entry';
        entry.dataset.promptIndex = String(index);

        const heading = document.createElement('div');
        heading.className = 'preset-workshop-entry-heading';
        const toggleLabel = document.createElement('label');
        toggleLabel.className = 'preset-workshop-entry-toggle';
        const toggle = document.createElement('input');
        toggle.type = 'checkbox';
        toggle.checked = getOfflineMeetPromptEntryState(preset, prompt);
        toggle.dataset.field = 'enabled';
        toggleLabel.append(toggle, document.createTextNode('启用此条目'));

        const titleLabel = document.createElement('label');
        titleLabel.className = 'preset-workshop-entry-title';
        titleLabel.textContent = '条目名称';
        const title = document.createElement('input');
        title.type = 'text';
        title.value = prompt.name || prompt.identifier || `提示词条目 ${index + 1}`;
        title.dataset.field = 'name';
        titleLabel.appendChild(title);
        heading.append(toggleLabel, titleLabel);

        const contentLabel = document.createElement('label');
        contentLabel.className = 'preset-workshop-entry-content';
        contentLabel.textContent = '提示词内容';
        const content = document.createElement('textarea');
        content.rows = 7;
        content.value = typeof prompt.content === 'string' ? prompt.content : prompt.system_prompt;
        content.dataset.field = 'content';
        contentLabel.appendChild(content);
        entry.append(heading, contentLabel);
        list.appendChild(entry);
    });
}

function updateOfflineMeetPromptDraft(event) {
    const field = event.target.dataset.field;
    if (!field || !offlineMeetPresetDraft) return;
    const entry = event.target.closest('.preset-workshop-entry');
    const index = Number(entry?.dataset.promptIndex);
    const prompt = offlineMeetPresetDraft.data.prompts[index];
    if (!prompt) return;

    if (field === 'name') {
        prompt.name = event.target.value;
    } else if (field === 'content') {
        if (typeof prompt.content === 'string' || typeof prompt.system_prompt !== 'string') {
            prompt.content = event.target.value;
        } else {
            prompt.system_prompt = event.target.value;
        }
    } else if (field === 'enabled') {
        prompt.enabled = event.target.checked;
        for (const group of offlineMeetPresetDraft.data.prompt_order || []) {
            for (const orderEntry of group.order || []) {
                if (orderEntry.identifier === prompt.identifier) {
                    orderEntry.enabled = event.target.checked;
                }
            }
        }
    }
}

function closeOfflineMeetPresetEditor() {
    const screen = document.getElementById('preset-workshop-screen');
    editingOfflineMeetPresetId = null;
    offlineMeetPresetDraft = null;
    screen.querySelector('#preset-workshop-manager').hidden = false;
    screen.querySelector('#preset-workshop-editor').hidden = true;
    screen.querySelector('.preset-workshop-header .title').textContent = '预设工坊';
}

async function saveOfflineMeetPresetEditor() {
    const presets = getOfflineMeetPromptPresets();
    const index = presets.findIndex(preset => preset.id === editingOfflineMeetPresetId);
    if (index < 0 || !offlineMeetPresetDraft) return;
    const original = presets[index];
    const draft = offlineMeetPresetDraft;
    draft.name = original.name;
    draft.enabled = original.enabled;
    presets[index] = draft;
    if (!await saveOfflineMeetSettings('保存预设条目修改')) {
        presets[index] = original;
        return;
    }

    const screen = document.getElementById('preset-workshop-screen');
    closeOfflineMeetPresetEditor();
    renderPresetWorkshop(screen);
    renderOfflineMeetPresetOptions();
}

async function handlePresetWorkshopAction(event) {
    const control = event.target.closest('[data-action]');
    if (!control) return;
    const row = control.closest('.preset-workshop-row');
    const id = row?.dataset.presetId;
    const presets = getOfflineMeetPromptPresets();
    const preset = presets.find(item => item.id === id);
    if (!preset) return;

    if (control.dataset.action === 'rename') {
        preset.name = control.value.trim() || '未命名预设';
        await saveOfflineMeetSettings('保存预设名称');
        renderPresetWorkshop(document.getElementById('preset-workshop-screen'));
        renderOfflineMeetPresetOptions();
        return;
    }
    if (control.dataset.action === 'edit') {
        openOfflineMeetPresetEditor(preset);
        return;
    }
    if (control.dataset.action === 'delete') {
        if (!confirm(`确定删除“${preset.name}”吗？`)) return;
        presets.splice(presets.indexOf(preset), 1);
        if (db.activeOfflineMeetPromptPresetId === preset.id) {
            db.activeOfflineMeetPromptPresetId = null;
        }
    } else if (control.dataset.action === 'export') {
        const blob = new Blob([JSON.stringify({ ...preset.data, name: preset.name }, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `${preset.name.replace(/[\\/:*?"<>|]/g, '_')}.json`;
        anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        return;
    }

    await saveOfflineMeetSettings('保存见面预设设置');
    renderPresetWorkshop(document.getElementById('preset-workshop-screen'));
    renderOfflineMeetPresetOptions();
}

function bindPresetWorkshop(screen) {
    screen.querySelector('#preset-workshop-file').addEventListener('change', importOfflineMeetPromptFiles);
    screen.querySelector('#preset-workshop-list').addEventListener('change', handlePresetWorkshopAction);
    screen.querySelector('#preset-workshop-list').addEventListener('click', event => {
        if (event.target.closest('button[data-action]')) handlePresetWorkshopAction(event);
    });
    screen.querySelector('#preset-workshop-entries').addEventListener('input', updateOfflineMeetPromptDraft);
    screen.querySelector('#preset-workshop-entries').addEventListener('change', updateOfflineMeetPromptDraft);
    screen.querySelector('#preset-workshop-cancel-edit').addEventListener('click', closeOfflineMeetPresetEditor);
    screen.querySelector('#preset-workshop-save-edit').addEventListener('click', saveOfflineMeetPresetEditor);
}
