function debounce(fn, wait = 250) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), wait);
    };
}

function triStateToFilter(stateStr) {
    if (stateStr === "include") return true;
    if (stateStr === "exclude") return false; 
    return null; 
}

function cycleTriState(btn) {
    const current = btn.getAttribute("data-state") || "neutral";
    const order = ["neutral", "include", "exclude"];
    const next = order[(order.indexOf(current) + 1) % order.length];
    btn.setAttribute("data-state", next);
    btn.setAttribute("aria-pressed", next === "include");
    
    btn.textContent = next === "include" ? "✓" : (next === "exclude" ? "X" : "─");
}

function readFiltersFromUI() {
    const artist = document.getElementById("gallery-artist-select").value || null;
    const form = document.getElementById("gallery-form-select").value || null;

    const characters = Array.from(document.querySelectorAll("#gallery-characters-list input[type='checkbox']:checked"))
        .map(cb => cb.value);

    const quickArtist = document.getElementById("gallery-artist-quick").value || null;
    const quickForm = document.getElementById("gallery-form-quick").value || null;

    const finalArtist = quickArtist || artist;
    const finalForm = quickForm || form;

    const nsfwState = document.getElementById("gallery-nsfw-toggle").getAttribute("data-state");
    const aiState = document.getElementById("gallery-ai-toggle").getAttribute("data-state");
    const discordState = document.getElementById("gallery-discord-toggle").getAttribute("data-state");

    const isNSFW = triStateToFilter(nsfwState);
    const isAI = triStateToFilter(aiState);
    const isDiscEmoji = triStateToFilter(discordState);

    const artNameQuery = (document.getElementById("gallery-search-input").value || "").trim();

    return {
        artist: finalArtist || null,
        form: finalForm || null,
        characters: characters.length ? characters : [],
        isNSFW: isNSFW,
        isAI: isAI,
        isDiscEmoji: isDiscEmoji,
        artNameQuery: artNameQuery || null
    };
}

async function populateFilterControls() {
    const opts = await getFilterOptions();

    function esc(s) {
        return String(s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    const charList = document.getElementById("gallery-characters-list");
    const charPopup = document.getElementById("gallery-characters-popup");
    if (charList) {
        charList.innerHTML = opts.characters.map(c =>
            `<label><input type="checkbox" value="${esc(c)}"> <span>${esc(c)}</span></label>`
        ).join("");
    }
    if (charPopup) {
        charPopup.innerHTML = `<div class="gallery-multiselect" style="grid-template-columns: repeat(auto-fill, minmax(140px, 1fr))">` +
            opts.characters.map(c => `<label><input type="checkbox" value="${esc(c)}"> ${esc(c)}</label>`).join("") +
            `</div>`;
    }

    const nativeArtistSelect = document.getElementById("gallery-artist-select");
    const nativeFormSelect = document.getElementById("gallery-form-select");
    const nativeArtistQuick = document.getElementById("gallery-artist-quick");
    const nativeFormQuick = document.getElementById("gallery-form-quick");

    if (nativeArtistSelect) {
        nativeArtistSelect.innerHTML = `<option value="">— Any —</option>` +
            (opts.artists || []).map(a => `<option value="${esc(a)}">${esc(a)}</option>`).join("");
    }
    if (nativeFormSelect) {
        nativeFormSelect.innerHTML = `<option value="">— Any —</option>` +
            (opts.forms || []).map(f => `<option value="${esc(f)}">${esc(f)}</option>`).join("");
    }
    if (nativeArtistQuick) {
        nativeArtistQuick.innerHTML = `<option value="">Artist — Any</option>` +
            (opts.artists || []).map(a => `<option value="${esc(a)}">${esc(a)}</option>`).join("");
    }
    if (nativeFormQuick) {
        nativeFormQuick.innerHTML = `<option value="">Form — Any</option>` +
            (opts.forms || []).map(f => `<option value="${esc(f)}">${esc(f)}</option>`).join("");
    }

    document.querySelectorAll(".gallery-dropdown-custom[data-select-id]").forEach(custom => {
        const selectId = custom.dataset.selectId;
        const hiddenSelect = document.getElementById(selectId);
        const ul = custom.querySelector(".gallery-dropdown-options");
        const selectedLabelEl = custom.querySelector(".gallery-dropdown-selected .gallery-dropdown-option-label");

        
        const isArtist = /artist/i.test(selectId);
        const isForm = /form/i.test(selectId);
        let source = [];
        let defaultLabel = "— Any —";
        if (isArtist) {
            source = opts.artists || [];
            defaultLabel = selectId.includes("quick") ? "Artist — Any" : "— Any —";
        } else if (isForm) {
            source = opts.forms || [];
            defaultLabel = selectId.includes("quick") ? "Form — Any" : "— Any —";
        }

        if (hiddenSelect) {
            hiddenSelect.innerHTML = `<option value="">${esc(defaultLabel)}</option>` +
                source.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join("");
        }

        if (ul) {
            const listHtml =
                `<li class="gallery-dropdown-option" role="option" data-value=""><span class="gallery-dropdown-option-label">${esc(defaultLabel)}</span></li>` +
                source.map(v => `<li class="gallery-dropdown-option" role="option" data-value="${esc(v)}"><span class="gallery-dropdown-option-label">${esc(v)}</span></li>`).join("");
            ul.innerHTML = listHtml;
        }

        if (selectedLabelEl) {
            selectedLabelEl.textContent = defaultLabel;
        }
    });

    if (typeof initGalleryDropdowns === "function") initGalleryDropdowns();
    else if (typeof galleryInitDropdowns === "function") galleryInitDropdowns();
}

function initGalleryDropdowns() {
    if (!window.__galleryDropdownDocHandler) {
        window.__galleryDropdownDocHandler = (e) => {
            document.querySelectorAll('.gallery-dropdown-custom.gallery-dropdown-open').forEach(c => {
                if (!c.contains(e.target)) c.classList.remove('gallery-dropdown-open');
            });
        };
        document.addEventListener('click', window.__galleryDropdownDocHandler);
    }

    document.querySelectorAll(".gallery-dropdown-custom").forEach(container => {
        if (container.dataset.dropdownInit) return;
        container.dataset.dropdownInit = 'true';

        const hiddenSelect = container.querySelector(".gallery-dropdown-select-hidden");
        const selected = container.querySelector(".gallery-dropdown-selected");
        const list = container.querySelector(".gallery-dropdown-options");

        if (!selected || !list) return;

        let timeoutId;

        container.addEventListener('mouseenter', () => {
            clearTimeout(timeoutId); 
        });

        container.addEventListener('mouseleave', () => {
            timeoutId = setTimeout(() => {
                container.classList.remove("gallery-dropdown-open");
            }, 500);
        });

        container.addEventListener('click', (e) => {
            if (selected.contains(e.target)) {
                e.stopPropagation();
                container.classList.toggle("gallery-dropdown-open");
                return;
            }

            const opt = e.target.closest('.gallery-dropdown-option');
            if (opt && list.contains(opt)) {
                e.stopPropagation();
                const value = opt.dataset.value ?? "";
                const label = opt.querySelector(".gallery-dropdown-option-label")?.textContent?.trim() || opt.textContent.trim();

                const visibleLabel = selected.querySelector(".gallery-dropdown-option-label");
                if (visibleLabel) visibleLabel.textContent = label;

                if (hiddenSelect) {
                    hiddenSelect.value = value;
                    hiddenSelect.dispatchEvent(new Event("change", { bubbles: true }));
                }

                list.querySelectorAll('.gallery-dropdown-option').forEach(o => o.setAttribute("aria-selected", "false"));
                opt.setAttribute("aria-selected", "true");
                container.classList.remove("gallery-dropdown-open");
            }
        });
    });
}




function initGalleryControls() {
    
    const filterToggle = document.getElementById("gallery-filter-toggle");
    const filterPopup = document.getElementById("gallery-filter-popup");
    const applyBtn = document.getElementById("gallery-apply-btn");
    const resetBtn = document.getElementById("gallery-reset-btn");
    const searchInput = document.getElementById("gallery-search-input");
    const charactersToggle = document.getElementById("gallery-characters-toggle");
    const charactersPopup = document.getElementById("gallery-characters-popup");
    const nsfwBtn = document.getElementById("gallery-nsfw-toggle");
    const aiBtn = document.getElementById("gallery-ai-toggle");
    const discordBtn = document.getElementById("gallery-discord-toggle");
    const artistQuick = document.getElementById("gallery-artist-quick");
    const formQuick = document.getElementById("gallery-form-quick");

    function applyFiltersNow() {
        const filters = readFiltersFromUI();
        loadGallery("gallery", 0, false, filters);
    }
    const debouncedApply = debounce(applyFiltersNow, 300);

    populateFilterControls().then(() => {
        debouncedApply();
    });

    function openPopup(popup, toggleBtn) {
        popup.setAttribute("aria-hidden", "false");
        if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "true");
    }
    function closePopup(popup, toggleBtn) {
        popup.setAttribute("aria-hidden", "true");
        if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "false");
    }

    if (filterToggle && filterPopup) {
        filterToggle.addEventListener("click", (e) => {
            const opened = filterPopup.getAttribute("aria-hidden") === "false";
            if (opened) closePopup(filterPopup, filterToggle); else openPopup(filterPopup, filterToggle);
        });
    }

    if (charactersToggle && charactersPopup) {
        charactersToggle.addEventListener("click", (e) => {
            const opened = charactersPopup.getAttribute("aria-hidden") === "false";
            if (opened) closePopup(charactersPopup, charactersToggle); else openPopup(charactersPopup, charactersToggle);
        });

        charactersPopup.addEventListener("change", (e) => {
            const val = e.target?.value;
            if (!val) return; 
            const mainCheckbox = document.querySelector(`#gallery-characters-list input[type='checkbox'][value="${CSS.escape(val)}"]`);
            if (mainCheckbox) mainCheckbox.checked = e.target.checked;
            debouncedApply();
        });
    }

    document.addEventListener("click", (e) => {
        if (filterPopup && !filterPopup.contains(e.target) && filterToggle && !filterToggle.contains(e.target)) {
            closePopup(filterPopup, filterToggle);
        }
        if (charactersPopup && !charactersPopup.contains(e.target) && charactersToggle && !charactersToggle.contains(e.target)) {
            closePopup(charactersPopup, charactersToggle);
        }
    });

    
    [nsfwBtn, aiBtn, discordBtn].forEach(btn => {
        if (!btn) return;
        btn.textContent = "─";
        btn.addEventListener("click", (e) => {
            cycleTriState(btn);
            debouncedApply();
        });
    });

    if (applyBtn) applyBtn.addEventListener("click", () => {
        closePopup(filterPopup, filterToggle);
        debouncedApply();
    });

    if (resetBtn) resetBtn.addEventListener("click", () => {
        document.getElementById("gallery-search-input").value = "";
        document.getElementById("gallery-artist-select").value = "";
        document.getElementById("gallery-form-select").value = "";
        document.getElementById("gallery-artist-quick").value = "";
        document.getElementById("gallery-form-quick").value = "";

        document.querySelectorAll("#gallery-characters-list input[type='checkbox']").forEach(cb => cb.checked = false);
        document.querySelectorAll("#gallery-characters-popup input[type='checkbox']").forEach(cb => cb.checked = false);

        [nsfwBtn, aiBtn, discordBtn].forEach(btn => {
            if (!btn) return;
            btn.setAttribute("data-state", "neutral");
            btn.textContent = "─";
            btn.setAttribute("aria-pressed", "false");
        });

        debouncedApply();
    });

    const mainCharList = document.getElementById("gallery-characters-list");
    if (mainCharList) {
        mainCharList.addEventListener("change", (e) => {
            const val = e.target?.value;
            if (!val) return;
            const quickCb = document.querySelector(`#gallery-characters-popup input[type="checkbox"][value="${CSS.escape(val)}"]`);
            if (quickCb) quickCb.checked = e.target.checked;
            debouncedApply();
        });
    }

    if (artistQuick) artistQuick.addEventListener("change", debouncedApply);
    if (formQuick) formQuick.addEventListener("change", debouncedApply);

    const artistMain = document.getElementById("gallery-artist-select");
    const formMain = document.getElementById("gallery-form-select");
    if (artistMain) artistMain.addEventListener("change", debouncedApply);
    if (formMain) formMain.addEventListener("change", debouncedApply);

    if (searchInput) searchInput.addEventListener("input", debouncedApply);
}


document.addEventListener("DOMContentLoaded", () => {
    initGalleryControls();
});