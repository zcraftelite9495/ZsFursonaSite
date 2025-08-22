/* Debounce helper */
function debounce(fn, wait = 250) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), wait);
    };
}

/* Convert tri-state string to filter value */
function triStateToFilter(stateStr) {
    if (stateStr === "include") return true;
    if (stateStr === "exclude") return false;
    return null; // neutral
}

/* Toggle tri-state: neutral -> include -> exclude -> neutral */
function cycleTriState(btn) {
    const current = btn.getAttribute("data-state") || "neutral";
    const order = ["neutral", "include", "exclude"];
    const next = order[(order.indexOf(current) + 1) % order.length];
    btn.setAttribute("data-state", next);
    btn.setAttribute("aria-pressed", next === "include");
    // set visible text: ✓ for include, − for exclude, — for neutral
    btn.textContent = next === "include" ? "✓" : (next === "exclude" ? "−" : "─");
}

/* Build filters object from UI */
function readFiltersFromUI() {
    const artist = document.getElementById("gallery-artist-select").value || null;
    const form = document.getElementById("gallery-form-select").value || null;

    const characters = Array.from(document.querySelectorAll("#gallery-characters-list input[type='checkbox']:checked"))
        .map(cb => cb.value);

    // quick dropdown duplicates
    const quickArtist = document.getElementById("gallery-artist-quick").value || null;
    const quickForm = document.getElementById("gallery-form-quick").value || null;

    const finalArtist = quickArtist || artist;
    const finalForm = quickForm || form;

    const nsfwState = document.getElementById("gallery-nsfw-toggle").getAttribute("data-state");
    const aiState = document.getElementById("gallery-ai-toggle").getAttribute("data-state");

    const isNSFW = triStateToFilter(nsfwState);
    const isAI = triStateToFilter(aiState);

    const artNameQuery = (document.getElementById("gallery-search-input").value || "").trim();

    return {
        artist: finalArtist || null,
        form: finalForm || null,
        characters: characters.length ? characters : [],
        isNSFW: isNSFW,
        isAI: isAI,
        artNameQuery: artNameQuery || null
    };
}

/* Populate filter option UI using getFilterOptions() */
async function populateFilterControls() {
    const opts = await getFilterOptions();
    const artistSelect = document.getElementById("gallery-artist-select");
    const formSelect = document.getElementById("gallery-form-select");
    const artistQuick = document.getElementById("gallery-artist-quick");
    const formQuick = document.getElementById("gallery-form-quick");
    const charList = document.getElementById("gallery-characters-list");
    const charPopup = document.getElementById("gallery-characters-popup");

    // clear
    [artistSelect, formSelect, artistQuick, formQuick].forEach(el => {
        if (!el) return;
        // leave first option intact
        const keep = el.tagName === "SELECT" ? [el.firstElementChild] : [];
        el.innerHTML = "";
    });

    // populate artist selects
    if (artistSelect) {
        artistSelect.innerHTML = `<option value="">— Any —</option>` +
            opts.artists.map(a => `<option value="${a}">${a}</option>`).join("");
    }
    if (artistQuick) {
        artistQuick.innerHTML = `<option value="">Artist — Any</option>` +
            opts.artists.map(a => `<option value="${a}">${a}</option>`).join("");
    }

    // populate form selects
    if (formSelect) {
        formSelect.innerHTML = `<option value="">— Any —</option>` +
            opts.forms.map(f => `<option value="${f}">${f}</option>`).join("");
    }
    if (formQuick) {
        formQuick.innerHTML = `<option value="">Form — Any</option>` +
            opts.forms.map(f => `<option value="${f}">${f}</option>`).join("");
    }

    // populate characters (checkboxes) for filter popup and quick popup
    if (charList) {
        charList.innerHTML = opts.characters.map(c =>
            `<label><input type="checkbox" value="${c}"> <span>${c}</span></label>`
        ).join("");
    }

    if (charPopup) {
        charPopup.innerHTML = `<div style="padding:0.5rem; max-height:12rem; overflow:auto;">` +
            opts.characters.map(c => `<label style="display:block; margin:0.15rem 0;"><input type="checkbox" value="${c}"> ${c}</label>`).join("") +
            `</div>`;
    }
}

/* Hook up UI actions and call loadGallery when filters change */
function initGalleryControls() {
    // references
    const filterToggle = document.getElementById("gallery-filter-toggle");
    const filterPopup = document.getElementById("gallery-filter-popup");
    const applyBtn = document.getElementById("gallery-apply-btn");
    const resetBtn = document.getElementById("gallery-reset-btn");
    const searchInput = document.getElementById("gallery-search-input");
    const charactersToggle = document.getElementById("gallery-characters-toggle");
    const charactersPopup = document.getElementById("gallery-characters-popup");
    const nsfwBtn = document.getElementById("gallery-nsfw-toggle");
    const aiBtn = document.getElementById("gallery-ai-toggle");
    const artistQuick = document.getElementById("gallery-artist-quick");
    const formQuick = document.getElementById("gallery-form-quick");

    // helper to read UI and call loadGallery
    function applyFiltersNow() {
        const filters = readFiltersFromUI();
        loadGallery("gallery", 0, false, filters);
    }
    const debouncedApply = debounce(applyFiltersNow, 300);

    // populate options, then initial load with no filters
    populateFilterControls().then(() => {
        debouncedApply();
    });

    // popup toggle helpers
    function openPopup(popup, toggleBtn) {
        popup.setAttribute("aria-hidden", "false");
        if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "true");
    }
    function closePopup(popup, toggleBtn) {
        popup.setAttribute("aria-hidden", "true");
        if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "false");
    }

    // filter popup toggle
    if (filterToggle && filterPopup) {
        filterToggle.addEventListener("click", (e) => {
            const opened = filterPopup.getAttribute("aria-hidden") === "false";
            if (opened) closePopup(filterPopup, filterToggle); else openPopup(filterPopup, filterToggle);
        });
    }

    // characters quick toggle
    if (charactersToggle && charactersPopup) {
        charactersToggle.addEventListener("click", (e) => {
            const opened = charactersPopup.getAttribute("aria-hidden") === "false";
            if (opened) closePopup(charactersPopup, charactersToggle); else openPopup(charactersPopup, charactersToggle);
        });

        // clicking a checkbox in quick popup should sync with main popup checkboxes
        charactersPopup.addEventListener("change", (e) => {
            const val = e.target?.value;
            if (!val) return;
            // toggle matching checkbox in main list
            const mainCheckbox = document.querySelector(`#gallery-characters-list input[type='checkbox'][value="${CSS.escape(val)}"]`);
            if (mainCheckbox) mainCheckbox.checked = e.target.checked;
            debouncedApply();
        });
    }

    // clicking outside closes popups
    document.addEventListener("click", (e) => {
        if (filterPopup && !filterPopup.contains(e.target) && filterToggle && !filterToggle.contains(e.target)) {
            closePopup(filterPopup, filterToggle);
        }
        if (charactersPopup && !charactersPopup.contains(e.target) && charactersToggle && !charactersToggle.contains(e.target)) {
            closePopup(charactersPopup, charactersToggle);
        }
    });

    // tri-state toggles
    [nsfwBtn, aiBtn].forEach(btn => {
        if (!btn) return;
        // render initial glyph for neutral
        btn.textContent = "─";
        btn.addEventListener("click", (e) => {
            cycleTriState(btn);
            debouncedApply();
        });
    });

    // apply / reset buttons
    if (applyBtn) applyBtn.addEventListener("click", () => {
        closePopup(filterPopup, filterToggle);
        debouncedApply();
    });

    if (resetBtn) resetBtn.addEventListener("click", () => {
        // reset UI controls
        document.getElementById("gallery-search-input").value = "";
        document.getElementById("gallery-artist-select").value = "";
        document.getElementById("gallery-form-select").value = "";
        document.getElementById("gallery-artist-quick").value = "";
        document.getElementById("gallery-form-quick").value = "";

        // uncheck all character checkboxes
        document.querySelectorAll("#gallery-characters-list input[type='checkbox']").forEach(cb => cb.checked = false);
        document.querySelectorAll("#gallery-characters-popup input[type='checkbox']").forEach(cb => cb.checked = false);

        // reset tri-state to neutral
        [nsfwBtn, aiBtn].forEach(btn => {
            if (!btn) return;
            btn.setAttribute("data-state", "neutral");
            btn.textContent = "─";
            btn.setAttribute("aria-pressed", "false");
        });

        debouncedApply();
    });

    // any change in the main characters list should update quick popup and apply
    const mainCharList = document.getElementById("gallery-characters-list");
    if (mainCharList) {
        mainCharList.addEventListener("change", (e) => {
            const val = e.target?.value;
            if (!val) return;
            // sync quick popup checkbox if present
            const quickCb = document.querySelector(`#gallery-characters-popup input[type="checkbox"][value="${CSS.escape(val)}"]`);
            if (quickCb) quickCb.checked = e.target.checked;
            debouncedApply();
        });
    }

    // artist/form quick selects apply immediately
    if (artistQuick) artistQuick.addEventListener("change", debouncedApply);
    if (formQuick) formQuick.addEventListener("change", debouncedApply);

    // artist/form main selects apply immediately
    const artistMain = document.getElementById("gallery-artist-select");
    const formMain = document.getElementById("gallery-form-select");
    if (artistMain) artistMain.addEventListener("change", debouncedApply);
    if (formMain) formMain.addEventListener("change", debouncedApply);

    // search input debounce
    if (searchInput) searchInput.addEventListener("input", debouncedApply);
}

/* Initialize on DOMContentLoaded */
document.addEventListener("DOMContentLoaded", () => {
    initGalleryControls();
});