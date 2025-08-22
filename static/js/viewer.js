/*
███████╗██╗░██████╗░░███████╗██╗░░░██╗██████╗░░██████╗░█████╗░███╗░░██╗░█████╗░░░░██████╗██╗████████╗███████╗
╚════██║╚█║██╔════╝░░██╔════╝██║░░░██║██╔══██╗██╔════╝██╔══██╗████╗░██║██╔══██╗░░██╔════╝██║╚══██╔══╝██╔════╝
░░███╔═╝░╚╝╚█████╗░░░█████╗░░██║░░░██║██████╔╝╚█████╗░██║░░██║██╔██╗██║███████║░░╚█████╗░██║░░░██║░░░█████╗░░
██╔══╝░░░░░░╚═══██╗░░██╔══╝░░██║░░░██║██╔══██╗░╚═══██╗██║░░██║██║╚████║██╔══██║░░░╚═══██╗██║░░░██║░░░██╔══╝░░
███████╗░░░██████╔╝░░██║░░░░░╚██████╔╝██║░░██║██████╔╝╚█████╔╝██║░╚███║██║░░██║░░██████╔╝██║░░░██║░░░███████╗
╚══════╝░░░╚═════╝░░░╚═╝░░░░░░╚═════╝░╚═╝░░╚═╝╚═════╝░░╚════╝░╚═╝░░╚══╝╚═╝░░╚═╝░░╚═════╝░╚═╝░░░╚═╝░░░╚══════╝

███████████████████████▀███████████████████████████████████████████████
█▄─▄█▄─▀█▀─▄██▀▄─██─▄▄▄▄█▄─▄▄─███▄─█─▄█▄─▄█▄─▄▄─█▄─█▀▀▀█─▄█▄─▄▄─█▄─▄▄▀█
██─███─█▄█─███─▀─██─██▄─██─▄█▀████▄▀▄███─███─▄█▀██─█─█─█─███─▄█▀██─▄─▄█
▀▄▄▄▀▄▄▄▀▄▄▄▀▄▄▀▄▄▀▄▄▄▄▄▀▄▄▄▄▄▀▀▀▀▀▄▀▀▀▄▄▄▀▄▄▄▄▄▀▀▄▄▄▀▄▄▄▀▀▄▄▄▄▄▀▄▄▀▄▄▀

Made with love by ZcraftElite :3
*/

/* ---- GALLERY LOAD FUNCTION ---- */
async function loadGallery(elementId, count = 0, randomize = false) {
    try {
        ensureDefaultCookies();

        const res = await fetch("/art.json");
        let images = await res.json();

        // read cookie settings
        const showAI = getCookie("showAI") === "True";
        const showNSFW = getCookie("showNSFW") === "True";
        const blurNSFW = getCookie("blurNSFW") === "True";

        // filter based on cookie preferences
        images = images.filter(img => {
            if (img.isAI && !showAI) return false;
            if (img.isNSFW && !showNSFW) return false;
            return true;
        });

        // shuffle if requested
        if (randomize) {
            for (let i = images.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [images[i], images[j]] = [images[j], images[i]];
            }
        }

        // slice if count specified (> 0)
        if (count > 0) images = images.slice(0, count);

        const gallery = document.getElementById(elementId);
        if (!gallery) {
            console.error(`Gallery element with id "${elementId}" not found.`);
            return;
        }

        gallery.innerHTML = "";

        images.forEach(img => {
            const thumb = document.createElement("div");
            thumb.className = "thumb";

            // click opens viewer (viewer will load full-res)
            thumb.addEventListener("click", () => openViewer(img));

            // build character list (top inside thumb-text)
            const characters = (img.characters && img.characters.length > 0)
                ? `<span class="character-list">${img.characters.join(" x ")}</span>`
                : "";

            // create the thumbnail <img>
            const imgEl = document.createElement("img");
            imgEl.src = img.webLink 
                ? img.webLink 
                : `/static/images/thumbs/${img.strippedFilename}.webp`;
            imgEl.alt = img.title || "";
            imgEl.loading = "lazy";
            imgEl.decoding = "async";
            imgEl.className = "thumb-img";

            // apply NSFW blur if cookie is set
            if (img.isNSFW && blurNSFW) {
                imgEl.classList.add("blurred-nsfw");
            }

            // build thumb-text and badges
            const thumbText = document.createElement("div");
            thumbText.className = "thumb-text";
            thumbText.innerHTML = `
                ${characters}
                <span class="form-name">${img.shapeshiftForm || ""}</span>
                <span class="art-title">${img.artName || ""}</span>
                <span class="artist-name">${img.artist || ""}</span>
            `;

            const badgeContainer = document.createElement("div");
            badgeContainer.className = "badge-container";
            if (img.isNSFW) {
                const b = document.createElement("div");
                b.className = "nsfw-badge-thumb";
                b.textContent = "NSFW";
                badgeContainer.appendChild(b);
            }
            if (img.isAI) {
                const b = document.createElement("div");
                b.className = "ai-badge-thumb";
                b.textContent = "AI";
                badgeContainer.appendChild(b);
            }

            // assemble thumb
            thumb.appendChild(imgEl);
            thumb.appendChild(thumbText);
            thumb.appendChild(badgeContainer);
            gallery.appendChild(thumb);
        });
    } catch (err) {
        console.error("Error loading gallery:", err);
    }
}


/* ---- ROW GALLERY DISPLAY PREDICTOR ---- */
function predictThumbsPerRow(gallerySelector, options = {}) {
    const gallery = typeof gallerySelector === "string" ? document.querySelector(gallerySelector) : gallerySelector;
    if (!gallery) return 0;

    const style = getComputedStyle(gallery);
    const gapStr = style.gap || style.columnGap || style.rowGap || "0px";
    const gap = parseFloat(gapStr) || 0;

    let thumbWidth = options.thumbWidth || 0;
    if (!thumbWidth) {
        const thumbEl = gallery.querySelector(options.thumbSelector || ".thumb");
        if (thumbEl) {
            thumbWidth = thumbEl.getBoundingClientRect().width;
        } else {
            thumbWidth = options.fallbackWidth || 280;
        }
    }

    const containerWidth = gallery.clientWidth || gallery.getBoundingClientRect().width;
    if (thumbWidth <= 0) return 0;

    const count = Math.floor((containerWidth + gap) / (thumbWidth + gap));
    const result = Math.max(0, count);

    if (options.outputSelector) {
        const outEl = document.querySelector(options.outputSelector);
        if (outEl) outEl.textContent = String(result);
    } else {
        console.log(`Predicted thumbs per row: ${result}`);
    }

    return result;
}


/* ---- OPEN FUNCTION ---- */
function openViewer(img) {
    // Use webLink if available, otherwise fallback to local image
    document.getElementById('viewer-image').src = img.webLink 
        ? img.webLink 
        : `/static/images/${img.filename}`;

    document.getElementById('viewer-title').querySelector('#viewer-form').textContent = img.shapeshiftForm || "";
    document.getElementById('viewer-title').querySelector('#viewer-artname').textContent = img.artName || "";
    document.getElementById('viewer-artist').textContent = img.artist || "";
    document.getElementById('viewer-artist-pic').src = `/static/images/artists/${img.artist_pic}`;

    const viewerChars = document.getElementById('viewer-characters');
    if (viewerChars) {
        viewerChars.innerHTML = (img.characters && img.characters.length > 0)
            ? `<span class="character-list">${img.characters.join(" x ")}</span>`
            : "";
    }

    const aiInfo = document.getElementById('ai-info');
    const nsfwInfo = document.getElementById('nsfw-info');

    if (Boolean(img.isAI)) {
        aiInfo.classList.remove('hidden');
    } else {
        aiInfo.classList.add('hidden');
    }

    if (Boolean(img.isNSFW)) {
        nsfwInfo.classList.remove('hidden');
    } else {
        nsfwInfo.classList.add('hidden');
    }

    document.getElementById('viewer').classList.remove('hidden');
}


/* ---- CLOSE FUNCTION ---- */
function closeViewer() {
    document.getElementById("viewer").classList.add("hidden");
}