/*
███████╗██╗░██████╗░░███████╗██╗░░░██╗██████╗░░██████╗░█████╗░███╗░░██╗░█████╗░░░░██████╗██╗████████╗███████╗
╚════██║╚█║██╔════╝░░██╔════╝██║░░░██║██╔══██╗██╔════╝██╔══██╗████╗░██║██╔══██╗░░██╔════╝██║╚══██╔══╝██╔════╝
░░███╔═╝░╚╝╚█████╗░░░█████╗░░██║░░░██║██████╔╝╚█████╗░██║░░██║██╔██╗██║███████║░░╚█████╗░██║░░░██║░░░█████╗░░
██╔══╝░░░░░░╚═══██╗░░██╔══╝░░██║░░░██║██╔══██╗░╚═══██╗██║░░██║██║╚████║██╔══██║░░░╚═══██╗██║░░░██║░░░██╔══╝░░
███████╗░░░██████╔╝░░██║░░░░░╚██████╔╝██║░░██║██████╔╝╚█████╔╝██║░╚███║██║░░██║░░██████╔╝██║░░░██║░░░███████╗
╚══════╝░░░╚═════╝░░░╚═╝░░░░░░╚═════╝░╚═╝░░╚═╝╚═════╝░░╚════╝░╚═╝░░╚══╝╚═╝░░╚═╝░░╚═════╝░╚═╝░░░╚═╝░░░╚══════╝

█████████████████████████████
█─▄▄▄▄█▄─▄▄─█─▄▄▄─█─▄▄▄─███
█─██▄─██─▄█▀█─███▀█─███▀███
▀▄▄▄▄▄▀▄▄▄▄▄▀▄▄▄▄▄▀▄▄▄▄▄▀▀▀

Made with love by ZcraftElite :3
*/

/* ===================================================
   TAB SWITCHING
   =================================================== */
document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.admin-tab-panel').forEach(p => p.style.display = 'none');
        tab.classList.add('active');
        document.getElementById('tab-' + tab.dataset.tab).style.display = 'block';
    });
});


/* ===================================================
   TAG INPUT HELPER
   Supports two instances: upload form (u-) and edit modal (e-)
   =================================================== */
function initTagInput(prefix) {
    const wrap = document.getElementById(`${prefix}-tag-wrap`);
    const realInput = document.getElementById(`${prefix}-tag-input`);
    const hidden = document.getElementById(`${prefix}-characters`);
    if (!wrap || !realInput || !hidden) return;

    let tags = [];

    function render() {
        wrap.querySelectorAll('.admin-tag').forEach(el => el.remove());
        tags.forEach((tag, i) => {
            const el = document.createElement('div');
            el.className = 'admin-tag';
            el.innerHTML = `<span>${esc(tag)}</span><button type="button" aria-label="Remove">&times;</button>`;
            el.querySelector('button').addEventListener('click', () => {
                tags.splice(i, 1);
                render();
            });
            wrap.insertBefore(el, realInput);
        });
        hidden.value = tags.join(',');
    }

    function addTag(val) {
        val = val.trim();
        if (val && !tags.includes(val)) {
            tags.push(val);
            render();
        }
        realInput.value = '';
    }

    realInput.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag(realInput.value);
        } else if (e.key === 'Backspace' && realInput.value === '' && tags.length) {
            tags.pop();
            render();
        }
    });

    realInput.addEventListener('blur', () => {
        if (realInput.value.trim()) addTag(realInput.value);
    });

    wrap.addEventListener('click', () => realInput.focus());

    // expose setTags for pre-filling
    wrap._setTags = (arr) => { tags = arr.slice(); render(); };
    wrap._getTags = () => tags.slice();
}

function esc(str) {
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

initTagInput('u');
initTagInput('e');


/* ===================================================
   CONDITIONAL FIELD VISIBILITY
   =================================================== */
function bindConditionalFields(prefix) {
    const artistPic      = document.getElementById(`${prefix}-artistPic`);
    const discordField   = document.getElementById(`${prefix}-discordID-field`);
    const fileField      = document.getElementById(`${prefix}-artistFile-field`);
    const isAI           = document.getElementById(`${prefix}-isAI`);
    const aiModelField   = document.getElementById(`${prefix}-aiModel-field`);
    const recievalMethod = document.getElementById(`${prefix}-recievalMethod`);
    const priceField     = document.getElementById(`${prefix}-recievalPrice-field`);

    function updateArtistPic() {
        if (!artistPic) return;
        const isDiscord = artistPic.value === 'discord';
        if (discordField) discordField.style.display = isDiscord ? '' : 'none';
        if (fileField)    fileField.style.display    = isDiscord ? 'none' : '';
    }

    function updateAI() {
        if (!isAI || !aiModelField) return;
        aiModelField.style.display = isAI.checked ? '' : 'none';
    }

    function updateRecieval() {
        if (!recievalMethod || !priceField) return;
        priceField.style.display = recievalMethod.value === 'Commission' ? '' : 'none';
    }

    if (artistPic)      artistPic.addEventListener('change', updateArtistPic);
    if (isAI)           isAI.addEventListener('change', updateAI);
    if (recievalMethod) recievalMethod.addEventListener('change', updateRecieval);

    // Run once on init
    updateArtistPic();
    updateAI();
    updateRecieval();
}

bindConditionalFields('u');
bindConditionalFields('e');


/* ===================================================
   UPLOAD — ALTERNATE VERSION TOGGLE
   =================================================== */
document.getElementById('u-isAlternate').addEventListener('change', function () {
    const section = document.getElementById('u-alt-section');
    section.style.display = this.checked ? '' : 'none';
});


/* ===================================================
   UPLOAD ZONE (DRAG & DROP + FILE PICKER)
   =================================================== */
const uploadZone    = document.getElementById('upload-zone');
const fileInput     = document.getElementById('file-input');
const zonePrompt    = document.getElementById('upload-zone-prompt');
const zonePreview   = document.getElementById('upload-zone-preview');
const previewImg    = document.getElementById('preview-img');
const previewName   = document.getElementById('preview-filename');
const clearFileBtn  = document.getElementById('clear-file-btn');

let selectedFile = null;

function showPreview(file) {
    selectedFile = file;
    const url = URL.createObjectURL(file);
    previewImg.src = url;
    previewName.textContent = file.name;
    zonePrompt.style.display = 'none';
    zonePreview.style.display = 'flex';
}

function clearFile() {
    selectedFile = null;
    fileInput.value = '';
    previewImg.src = '';
    previewName.textContent = '';
    zonePrompt.style.display = '';
    zonePreview.style.display = 'none';
}

uploadZone.addEventListener('click', e => {
    if (e.target === clearFileBtn || clearFileBtn.contains(e.target)) return;
    fileInput.click();
});

fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) showPreview(fileInput.files[0]);
});

clearFileBtn.addEventListener('click', e => {
    e.stopPropagation();
    clearFile();
});

uploadZone.addEventListener('dragover', e => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
});

uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));

uploadZone.addEventListener('drop', e => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        showPreview(file);
    }
});


/* ===================================================
   UPLOAD FORM SUBMISSION
   =================================================== */
const uploadForm      = document.getElementById('upload-form');
const uploadStatus    = document.getElementById('upload-status');
const uploadSubmitBtn = document.getElementById('upload-submit-btn');

function setStatus(el, type, msg) {
    el.className = 'admin-status ' + type;
    el.textContent = msg;
    el.style.display = 'block';
}

uploadForm.addEventListener('submit', async e => {
    e.preventDefault();

    if (!selectedFile) {
        setStatus(uploadStatus, 'error', 'Please select an image file first.');
        return;
    }

    uploadSubmitBtn.disabled = true;
    uploadSubmitBtn.textContent = 'Uploading…';
    uploadStatus.style.display = 'none';

    const fd = new FormData();
    fd.append('file', selectedFile);
    fd.append('artName',        document.getElementById('u-artName').value.trim());
    fd.append('shapeshiftForm', document.getElementById('u-shapeshiftForm').value.trim());
    fd.append('mainCharacter',  document.getElementById('u-mainCharacter').value.trim() || 'Z');
    fd.append('characters',     document.getElementById('u-characters').value);
    fd.append('artist',         document.getElementById('u-artist').value.trim());
    fd.append('creationDate',   document.getElementById('u-creationDate').value);
    fd.append('recievalMethod', document.getElementById('u-recievalMethod').value);
    fd.append('recievalPrice',  document.getElementById('u-recievalPrice').value.trim());

    const artistPicVal = document.getElementById('u-artistPic').value;
    fd.append('artistPic', artistPicVal === 'discord' ? 'discord' : document.getElementById('u-artistFile').value);
    fd.append('discordID', document.getElementById('u-discordID').value.trim());

    fd.append('aiModel',         document.getElementById('u-aiModel').value.trim());
    fd.append('isAI',            document.getElementById('u-isAI').checked ? 'true' : 'false');
    fd.append('isNSFW',          document.getElementById('u-isNSFW').checked ? 'true' : 'false');
    fd.append('isDiscEmoji',     document.getElementById('u-isDiscEmoji').checked ? 'true' : 'false');
    fd.append('disableDownload', document.getElementById('u-disableDownload').checked ? 'true' : 'false');

    // Alternate mode
    const isAlt = document.getElementById('u-isAlternate').checked;
    if (isAlt) {
        const parentId = document.getElementById('u-parentId').value.trim();
        if (!parentId) {
            setStatus(uploadStatus, 'error', 'Please enter the Parent Artwork ID for alternate upload.');
            uploadSubmitBtn.disabled = false;
            uploadSubmitBtn.innerHTML = '<i class="nf nf-fa-upload"></i>&nbsp; Upload Artwork';
            return;
        }
        fd.append('parentId', parentId);
        fd.append('label',    document.getElementById('u-altLabel').value.trim() || 'Alternate Version');
    }

    try {
        const res  = await fetch('/api/v1/admin/upload', { method: 'POST', body: fd });
        const data = await res.json();

        if (res.ok && data.success) {
            const msg = data.parentId
                ? `✓ Alternate added to artwork #${data.parentId}! Alt ID: ${data.id}`
                : `✓ Uploaded successfully! ID: ${data.id}`;
            setStatus(uploadStatus, 'success', msg);
            resetUploadForm();
        } else {
            setStatus(uploadStatus, 'error', data.error || 'Upload failed.');
        }
    } catch (err) {
        setStatus(uploadStatus, 'error', 'Network error — please try again.');
        console.error(err);
    } finally {
        uploadSubmitBtn.disabled = false;
        uploadSubmitBtn.innerHTML = '<i class="nf nf-fa-upload"></i>&nbsp; Upload Artwork';
    }
});

document.getElementById('upload-reset-btn').addEventListener('click', resetUploadForm);

function resetUploadForm() {
    uploadForm.reset();
    clearFile();
    document.getElementById('u-tag-wrap')._setTags([]);
    uploadStatus.style.display = 'none';
    // re-run conditional visibility
    bindConditionalFields('u');
}


/* ===================================================
   MANAGE TAB — SEARCH FILTER
   =================================================== */
document.getElementById('manage-search').addEventListener('input', function () {
    const q = this.value.toLowerCase().trim();
    document.querySelectorAll('.admin-artwork-card').forEach(card => {
        const haystack = card.dataset.search || '';
        card.style.display = (!q || haystack.includes(q)) ? '' : 'none';
    });
});


/* ===================================================
   EDIT MODAL
   =================================================== */
function openEditModal(img) {
    document.getElementById('e-id').value           = img.id;
    document.getElementById('e-artName').value      = img.artName    || '';
    document.getElementById('e-creationDate').value = img.creationDate || '';
    document.getElementById('e-shapeshiftForm').value = img.shapeshiftForm || '';
    document.getElementById('e-mainCharacter').value  = img.mainCharacter  || 'Z';
    document.getElementById('e-artist').value       = img.artist     || '';
    document.getElementById('e-discordID').value    = img.discordID  || '';
    document.getElementById('e-aiModel').value      = img.aiModel    || '';
    document.getElementById('e-recievalPrice').value = img.recievalPrice || '';

    // Artist pic
    const artistPicEl = document.getElementById('e-artistPic');
    artistPicEl.value = (img.artistPic && img.artistPic !== 'discord') ? 'file' : 'discord';
    const artistFileEl = document.getElementById('e-artistFile');
    if (artistFileEl && img.artistPic && img.artistPic !== 'discord') {
        artistFileEl.value = img.artistPic;
    }

    // Recieval method
    document.getElementById('e-recievalMethod').value = img.recievalMethod || 'Self Made';

    // Checkboxes
    document.getElementById('e-isAI').checked            = Boolean(img.isAI);
    document.getElementById('e-isNSFW').checked           = Boolean(img.isNSFW);
    document.getElementById('e-isDiscEmoji').checked      = Boolean(img.isDiscEmoji);
    document.getElementById('e-disableDownload').checked  = Boolean(img.disableDownload);

    // Tags
    const chars = Array.isArray(img.characters) ? img.characters : [];
    document.getElementById('e-tag-wrap')._setTags(chars);

    // Update conditional fields
    bindConditionalFields('e');

    // Alternates section
    renderAltList(img.alternates || [], img.id);
    _bindAltAddSection(img.id);

    document.getElementById('edit-status').style.display = 'none';
    document.getElementById('edit-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeEditModal() {
    document.getElementById('edit-modal').classList.add('hidden');
    document.body.style.overflow = '';
}

// Close on overlay click
document.getElementById('edit-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('edit-modal')) closeEditModal();
});

// Edit form submission
document.getElementById('edit-form').addEventListener('submit', async e => {
    e.preventDefault();

    const id = parseInt(document.getElementById('e-id').value);
    const editStatus = document.getElementById('edit-status');
    const submitBtn  = e.target.querySelector('[type="submit"]');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving…';
    editStatus.style.display = 'none';

    const artistPicVal = document.getElementById('e-artistPic').value;
    const artistPic    = artistPicVal === 'discord'
        ? 'discord'
        : (document.getElementById('e-artistFile')?.value || 'discord');

    const payload = {
        artName:         document.getElementById('e-artName').value.trim(),
        creationDate:    document.getElementById('e-creationDate').value,
        shapeshiftForm:  document.getElementById('e-shapeshiftForm').value.trim(),
        mainCharacter:   document.getElementById('e-mainCharacter').value.trim() || 'Z',
        characters:      document.getElementById('e-tag-wrap')._getTags(),
        artist:          document.getElementById('e-artist').value.trim(),
        artistPic:       artistPic,
        discordID:       document.getElementById('e-discordID').value.trim(),
        aiModel:         document.getElementById('e-aiModel').value.trim() || null,
        recievalMethod:  document.getElementById('e-recievalMethod').value,
        recievalPrice:   document.getElementById('e-recievalPrice').value.trim() || null,
        isAI:            document.getElementById('e-isAI').checked,
        isNSFW:          document.getElementById('e-isNSFW').checked,
        isDiscEmoji:     document.getElementById('e-isDiscEmoji').checked,
        disableDownload: document.getElementById('e-disableDownload').checked,
    };

    try {
        const res  = await fetch(`/api/v1/admin/edit/${id}`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(payload)
        });
        const data = await res.json();

        if (res.ok && data.success) {
            setStatus(editStatus, 'success', '✓ Changes saved successfully.');
            // Update the card label in the manage grid
            const card = document.querySelector(`.admin-artwork-card[data-id="${id}"]`);
            if (card) {
                const nameEl = card.querySelector('.admin-artwork-title');
                if (nameEl) nameEl.textContent = payload.artName || payload.shapeshiftForm || '';
                const artistEl = card.querySelector('.admin-artwork-artist');
                if (artistEl) artistEl.textContent = payload.artist || '';
                card.dataset.search = `${payload.artName} ${payload.shapeshiftForm} ${payload.artist}`.toLowerCase();
            }
            setTimeout(closeEditModal, 1200);
        } else {
            setStatus(editStatus, 'error', data.error || 'Save failed.');
        }
    } catch (err) {
        setStatus(editStatus, 'error', 'Network error — please try again.');
        console.error(err);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Changes';
    }
});


/* ===================================================
   ALTERNATE VERSIONS MANAGEMENT
   =================================================== */

/**
 * Render the alternate list inside the edit modal.
 * @param {Array} alts - Array of alternate objects.
 * @param {number} parentId - ID of the parent artwork.
 */
function renderAltList(alts, parentId) {
    const list = document.getElementById('edit-alt-list');
    list.innerHTML = '';

    if (!alts.length) {
        list.innerHTML = '<p style="font-size:0.78rem;color:rgba(255,255,255,0.3);margin:0 0 4px;">No alternate versions yet.</p>';
        return;
    }

    alts.forEach(alt => {
        const row = document.createElement('div');
        row.className = 'admin-alt-item';
        row.dataset.altId = `${parentId}-${alt.id}`;

        // Thumbnail
        const thumb = document.createElement('img');
        thumb.className = 'alt-thumb';
        thumb.src = `/static/images/thumbs/${(alt.strippedFilename || alt.filename.replace(/\.[^.]+$/, ''))}.webp`;
        thumb.onerror = () => { thumb.src = `/static/images/${alt.filename}`; };
        row.appendChild(thumb);

        // Label input
        const labelInput = document.createElement('input');
        labelInput.className = 'admin-alt-label-input admin-input';
        labelInput.type = 'text';
        labelInput.value = alt.label || '';
        labelInput.placeholder = 'Version label';
        labelInput.style.flex = '1';
        row.appendChild(labelInput);

        // Flag checkboxes
        const flags = [
            { id: 'isAI',            label: 'AI' },
            { id: 'isNSFW',          label: 'NSFW' },
            { id: 'isDiscEmoji',     label: 'Discord' },
            { id: 'disableDownload', label: 'No DL' },
        ];
        flags.forEach(f => {
            const lbl = document.createElement('label');
            lbl.className = 'alt-flag';
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.checked = Boolean(alt[f.id]);
            cb.dataset.flag = f.id;
            lbl.appendChild(cb);
            lbl.appendChild(document.createTextNode(f.label));
            row.appendChild(lbl);
        });

        // Save button
        const saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.className = 'admin-alt-upload-btn';
        saveBtn.style.fontSize = '0.75rem';
        saveBtn.style.padding = '4px 10px';
        saveBtn.textContent = 'Save';
        saveBtn.onclick = async () => {
            saveBtn.disabled = true;
            saveBtn.textContent = '…';
            const payload = { label: labelInput.value.trim() };
            row.querySelectorAll('input[data-flag]').forEach(cb => {
                payload[cb.dataset.flag] = cb.checked;
            });
            if (!payload.isAI) payload.aiModel = null;
            try {
                const res  = await fetch(`/api/v1/admin/edit/${row.dataset.altId}`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (res.ok && data.success) {
                    saveBtn.textContent = '✓';
                    setTimeout(() => { saveBtn.disabled = false; saveBtn.textContent = 'Save'; }, 1200);
                } else {
                    alert(data.error || 'Save failed.');
                    saveBtn.disabled = false; saveBtn.textContent = 'Save';
                }
            } catch (err) {
                alert('Network error.'); saveBtn.disabled = false; saveBtn.textContent = 'Save';
            }
        };
        row.appendChild(saveBtn);

        // Remove button
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'admin-alt-remove';
        removeBtn.textContent = 'Remove';
        removeBtn.onclick = () => {
            showPopup({
                title: 'Remove Alternate',
                message: `Remove <b>${esc(alt.label || 'this alternate')}</b>? The image file will not be deleted.`,
                buttons: [
                    { text: 'Remove', onClick: async () => {
                        const res  = await fetch(`/api/v1/admin/delete/${alt.id}`, { method: 'POST' });
                        const data = await res.json();
                        if (res.ok && data.success) {
                            row.remove();
                            if (!list.querySelector('.admin-alt-item')) {
                                list.innerHTML = '<p style="font-size:0.78rem;color:rgba(255,255,255,0.3);margin:0 0 4px;">No alternate versions yet.</p>';
                            }
                        } else {
                            alert(data.error || 'Remove failed.');
                        }
                    }},
                    { text: 'Cancel', onClick: () => {} }
                ]
            });
        };
        row.appendChild(removeBtn);

        list.appendChild(row);
    });
}

/**
 * Bind the Add Alternate inline upload section for a given parent.
 * @param {number} parentId
 */
function _bindAltAddSection(parentId) {
    const addBtn   = document.getElementById('alt-add-submit-btn');
    const isAIChk  = document.getElementById('alt-add-isAI');
    const aiWrap   = document.getElementById('alt-add-aimodel-wrap');
    const statusEl = document.getElementById('alt-add-status');

    // Toggle AI model field
    isAIChk.onchange = () => {
        aiWrap.style.display = isAIChk.checked ? '' : 'none';
    };

    // Replace submit handler (clone to remove old listeners)
    const newBtn = addBtn.cloneNode(true);
    addBtn.parentNode.replaceChild(newBtn, addBtn);
    document.getElementById('alt-add-isAI').onchange = isAIChk.onchange; // re-bind after clone

    newBtn.addEventListener('click', async () => {
        const fileInput = document.getElementById('alt-add-file');
        const label     = document.getElementById('alt-add-label').value.trim() || 'Alternate Version';

        if (!fileInput.files.length) {
            setStatus(statusEl, 'error', 'Please select an image file.');
            return;
        }

        newBtn.disabled  = true;
        newBtn.textContent = 'Uploading…';
        statusEl.style.display = 'none';

        const fd = new FormData();
        fd.append('file',            fileInput.files[0]);
        fd.append('parentId',        String(parentId));
        fd.append('label',           label);
        fd.append('isAI',            document.getElementById('alt-add-isAI').checked ? 'true' : 'false');
        fd.append('isNSFW',          document.getElementById('alt-add-isNSFW').checked ? 'true' : 'false');
        fd.append('isDiscEmoji',     document.getElementById('alt-add-isDiscEmoji').checked ? 'true' : 'false');
        fd.append('disableDownload', document.getElementById('alt-add-disableDownload').checked ? 'true' : 'false');
        fd.append('aiModel',         document.getElementById('alt-add-aiModel').value.trim());

        try {
            const res  = await fetch('/api/v1/admin/upload', { method: 'POST', body: fd });
            const data = await res.json();

            if (res.ok && data.success) {
                setStatus(statusEl, 'success', `✓ Alternate added (ID: ${data.id})`);
                // Append new row to existing list
                const list = document.getElementById('edit-alt-list');
                // Clear "no alternates" placeholder if present
                list.querySelectorAll('p').forEach(p => p.remove());
                renderAltList(
                    [...document.querySelectorAll('#edit-alt-list .admin-alt-item')].map(r => ({
                        id: r.dataset.altId.split('-').pop(), // 3-digit alt sub-ID
                        filename: '',
                        label: r.querySelector('.admin-alt-label-input')?.value || '',
                        isAI: false, isNSFW: false, isDiscEmoji: false, disableDownload: false
                    })).concat([data.entry]),
                    parentId
                );
                // Reset add form
                fileInput.value = '';
                document.getElementById('alt-add-label').value = '';
                document.getElementById('alt-add-isAI').checked = false;
                document.getElementById('alt-add-isNSFW').checked = false;
                document.getElementById('alt-add-isDiscEmoji').checked = false;
                document.getElementById('alt-add-disableDownload').checked = false;
                document.getElementById('alt-add-aiModel').value = '';
                aiWrap.style.display = 'none';
            } else {
                setStatus(statusEl, 'error', data.error || 'Upload failed.');
            }
        } catch (err) {
            setStatus(statusEl, 'error', 'Network error — please try again.');
            console.error(err);
        } finally {
            newBtn.disabled = false;
            newBtn.innerHTML = '<i class="nf nf-fa-plus"></i>&nbsp; Add Alternate';
        }
    });
}


/* ===================================================
   DELETE CONFIRMATION
   =================================================== */
function confirmDelete(id, label) {
    showPopup({
        title: 'Delete Artwork',
        message: `Are you sure you want to remove <b>${esc(label)}</b> from the database?<br><br><small style="opacity:0.6">The image file itself will not be deleted.</small>`,
        buttons: [
            {
                text: 'Delete',
                onClick: () => doDelete(id)
            },
            {
                text: 'Cancel',
                onClick: () => {}
            }
        ]
    });
}

async function doDelete(id) {
    try {
        const res  = await fetch(`/api/v1/admin/delete/${id}`, { method: 'POST' });
        const data = await res.json();
        if (res.ok && data.success) {
            const card = document.querySelector(`.admin-artwork-card[data-id="${id}"]`);
            if (card) card.remove();
        } else {
            alert(data.error || 'Delete failed.');
        }
    } catch (err) {
        alert('Network error — please try again.');
        console.error(err);
    }
}
