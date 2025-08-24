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

/* ---- VALUE CLEANING FUNCTIONS ---- */
/**
 * Clean an artist name by removing any trailing "(Prompt)" and trimming.
 * @param {string} name - The artist name to clean.
 * @returns {string} The cleaned artist name.
 */
function cleanArtistName(name) {
    if (!name) return "";
    return name.replace(/\s*\(Prompt\)\s*$/i, "").trim();
}

/**
 * Clean a form name by removing any trailing " Form" and trimming.
 * @param {string} name - The form name to clean.
 * @returns {string} The cleaned form name.
 */
function cleanFormName(name) {
    if (!name) return "";
    return name.replace(/\s*Form\s*$/i, "").trim();
}


/* ---- MULTI-CHARACTER INCLUSION CHECK ---- */
/**
 * Checks if an image contains all characters from a required list.
 * @param {string[]} [imgChars=[]] - The list of characters in the image.
 * @param {string[]} [requiredChars=[]] - The list of required characters to check against.
 * @returns {boolean} true if the image contains all required characters.
 */
function hasAllCharacters(imgChars = [], requiredChars = []) {
    if (!requiredChars || requiredChars.length === 0) return true;
    if (!Array.isArray(imgChars)) return false;
    const lowered = imgChars.map(c => String(c).toLowerCase().trim());
    return requiredChars.every(rc => lowered.includes(String(rc).toLowerCase().trim()));
}


/* ---- FILTER OPTIONS FETCHER ---- */
/**
 * Fetches and returns the list of unique artists, forms, and characters from the art
 * JSON. The lists are sorted alphabetically, ignoring case.
 * @returns {Promise<{artists: string[], forms: string[], characters: string[]}>}
 *     A promise that resolves to an object containing the lists of unique
 *     artists, forms, and characters. If there is an error fetching the art JSON,
 *     the promise resolves to an object with empty lists.
 */
async function getFilterOptions() {
    try {
        const res = await fetch("/art.json");
        const images = await res.json();

        const artistSet = new Set();
        const formSet = new Set();
        const charSet = new Set();

        images.forEach(img => {
            const rawArtist = img.artist;
            const artist = cleanArtistName(rawArtist);
            if (artist) artistSet.add(artist);

            const rawForm = img.shapeshiftForm;
            const form = cleanFormName(rawForm);
            if (form) formSet.add(form);

            if (Array.isArray(img.characters)) {
                img.characters.forEach(c => {
                    if (c && String(c).trim()) charSet.add(String(c).trim());
                });
            }
        });

        const artists = Array.from(artistSet).sort((a,b) => a.localeCompare(b, undefined, {sensitivity: "base"}));
        const forms = Array.from(formSet).sort((a,b) => a.localeCompare(b, undefined, {sensitivity: "base"}));
        const characters = Array.from(charSet).sort((a,b) => a.localeCompare(b, undefined, {sensitivity: "base"}));

        return { artists, forms, characters };
    } catch (err) {
        console.error("Error fetching filter options:", err);
        return { artists: [], forms: [], characters: [] };
    }
}


/* ---- GALLERY LOAD FUNCTION ---- */
/**
 * Loads a gallery of thumbnails based on the provided filters and settings.
 * @param {string} elementId - The id of the HTML element to render the gallery in.
 * @param {number} [count=0] - The number of images to show in the gallery. If 0, all images will be shown.
 * @param {boolean} [randomize=false] - Whether to shuffle the images before rendering the gallery.
 * @param {object} [filters={}] - An object containing additional filters to apply when loading the gallery.
 *     The object may contain the following properties:
 *     - `artist`: string - The artist name to filter by (exact match, ignoring trailing " (Prompt)")
 *     - `form`: string - The form name to filter by (exact match, ignoring trailing " Form")
 *     - `characters`: string[] - The list of characters to filter by (all characters must be present)
 *     - `isNSFW`: boolean - The NSFW filter (three-state: true, false, null)
 *     - `isAI`: boolean - The AI filter (three-state: true, false, null)
 *     - `artNameQuery`: string - The substring to search for in the art name (case-insensitive)
 * @returns {Promise<void>} - A promise that resolves when the gallery has finished loading.
 * 
 * @function loadGallery
 * @since v30
 */
async function loadGallery(elementId, count = 0, randomize = false, filters = {}) {
    try {
        ensureDefaultCookies();

        const res = await fetch("/art.json");
        let images = await res.json();

        // read cookie settings
        const showAI = getCookie("showAI") === "True";
        const showNSFW = getCookie("showNSFW") === "True";
        const blurNSFW = getCookie("blurNSFW") === "True";

        // filter based on cookie preferences first
        images = images.filter(img => {
            if (img.isAI && !showAI) return false;
            if (img.isNSFW && !showNSFW) return false;
            return true;
        });

        // normalize incoming filters
        const fArtist = filters.artist ? String(filters.artist).trim() : null;
        const fForm = filters.form ? String(filters.form).trim() : null;
        const fCharacters = Array.isArray(filters.characters) ? filters.characters.filter(Boolean) : [];
        const fIsNSFW = (typeof filters.isNSFW === "boolean") ? filters.isNSFW : null;
        const fIsAI = (typeof filters.isAI === "boolean") ? filters.isAI : null;
        const fisDiscEmoji = (typeof filters.isDiscEmoji === "boolean") ? filters.isDiscEmoji : null;
        const fArtName = filters.artNameQuery ? String(filters.artNameQuery).trim().toLowerCase() : null;

        // apply additional filters (artist/form/characters/NSFW/AI/artName)
        images = images.filter(img => {
            // Artist exact match (ignore trailing " (Prompt)" in data)
            if (fArtist) {
                const imgArtistClean = cleanArtistName(img.artist || "");
                if (imgArtistClean !== fArtist) return false;
            }

            // Form exact match (ignore trailing " Form")
            if (fForm) {
                const imgFormClean = cleanFormName(img.shapeshiftForm || "");
                if (imgFormClean !== fForm) return false;
            }

            // Characters (require all selected)
            if (fCharacters && fCharacters.length > 0) {
                if (!hasAllCharacters(img.characters, fCharacters)) return false;
            }

            // NSFW filter (three-state)
            if (fIsNSFW !== null) {
                const imgNSFW = Boolean(img.isNSFW);
                if (imgNSFW !== fIsNSFW) return false;
            }

            // AI filter (three-state)
            if (fIsAI !== null) {
                const imgAI = Boolean(img.isAI);
                if (imgAI !== fIsAI) return false;
            }

            // Discord filter (three-state)
            if (fisDiscEmoji !== null) {
                const imgDiscord = Boolean(img.isDiscEmoji);
                if (imgDiscord !== fisDiscEmoji) return false;
            }

            // artNameQuery: substring, case-insensitive
            if (fArtName) {
                const artName = String(img.artName || "").toLowerCase();
                if (!artName.includes(fArtName)) return false;
            }

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

        function createBadge(type) {
            const badgeElement = document.createElement("div");
            badgeElement.className = "badge";
            badgeElement.setAttribute('badge-size', 'small');
            badgeElement.setAttribute('badge-style', 'gradient');
            badgeElement.setAttribute('badge', type);
            badgeElement.innerHTML = badgeSVG[type];
            return badgeElement;
        }

        gallery.innerHTML = "";

        images.forEach(img => {
            const thumb = document.createElement("div");
            thumb.className = "thumb";

            // click opens viewer (viewer will load full-res or webLink)
            thumb.addEventListener("click", () => openViewer(img));

            // build character list (top inside thumb-text)
            const characters = (img.characters && img.characters.length > 0)
                ? `<span class="character-list">${img.characters.join(" x ")}</span>`
                : "";

            // create the thumbnail <img> - use webLink if provided, otherwise predictable webp thumb
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

            if (img.isAI) {
                badgeContainer.appendChild(createBadge('ai'));
            }
            if (img.isNSFW) {
                badgeContainer.appendChild(createBadge('nsfw'));
            }
            if (img.isDiscEmoji) {
                badgeContainer.appendChild(createBadge('discord'));
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
/**
 * Predict the number of thumbnails that will fit in a row in a flexbox container
 * given its client width and the width of a single thumbnail.
 *
 * @param {string|HTMLElement} gallerySelector - CSS selector string or HTMLElement
 *   for the gallery container.
 * @param {{thumbWidth: number, thumbSelector: string, fallbackWidth: number,
 *          outputSelector: string}} [options] - Optional settings.
 * @param {number} [options.thumbWidth] - Width of a single thumbnail. If not
 *   provided, the function will attempt to get the width from a thumbnail element.
 * @param {string} [options.thumbSelector] - CSS selector string to find the first
 *   thumbnail element in the container. Defaults to ".thumb".
 * @param {number} [options.fallbackWidth] - Width to use if no thumbnail element is
 *   found. Defaults to 280.
 * @param {string} [options.outputSelector] - CSS selector string for the element
 *   that should display the result. If not provided, the result will be logged to
 *   the console.
 * @returns {number} Predicted number of thumbnails that will fit in a row.
 * 
 * @function predictThumbsPerRow
 * @since v23
 */
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
/**
 * Opens the image viewer and sets the displayed image and metadata.
 * @param {object} img - Object containing image metadata.
 * @property {string} img.filename - Name of the image file.
 * @property {string} [img.webLink] - External link to the image.
 * @property {string} [img.shapeshiftForm] - Shapeshift form of the character.
 * @property {string} [img.artName] - Name of the art.
 * @property {string} [img.artist] - Name of the artist.
 * @property {string} [img.artist_pic] - Name of the artist's profile picture.
 * @property {string[]} [img.characters] - Array of characters in the art.
 * @property {string} [img.creationDate] - Creation date of the art.
 * @property {boolean} [img.isAI] - Whether the image is AI-generated.
 * @property {boolean} [img.isNSFW] - Whether the image is NSFW.
 * 
 * @function openViewer
 * @since v23
 */
function openViewer(img) {
    const viewerContent = document.querySelector('.viewer-content');
    const viewerImage = document.getElementById('viewer-image');
    const viewerArtistPic = document.getElementById('viewer-artist-pic');
    const viewerLoader = document.getElementById('viewer-loader');
    
    viewerImage.src = '';
    viewerImage.onload = null;
    viewerArtistPic.src = '';
    viewerContent.style.width = "200px";
    viewerContent.style.height = "200px";

    viewerLoader.classList.remove('hidden');

    const imagePromises = [];

    const loadImage = (element, src) => {
        return new Promise((resolve, reject) => {
            if (!src) {
                resolve();
                return;
            }
            element.onload = resolve;
            element.onerror = reject;
            element.src = src;
        });
    };

    imagePromises.push(loadImage(viewerImage, img.webLink ? img.webLink : `/static/images/${img.filename}`));
    imagePromises.push(loadImage(viewerArtistPic, `/static/images/artists/${img.artist_pic}`));

    Promise.all(imagePromises)
        .then(() => {
            viewerContent.style.width = "auto";
            viewerContent.style.height = "auto";
            viewerLoader.classList.add('hidden');
        })
        .catch(error => {
            viewerLoader.classList.add('hidden');
            console.error("Error loading images:", error);
        });

    document.getElementById('viewer-artist').textContent = img.artist || "";

    const aiModelDiv = document.querySelector('.viewer-data.artAIModel span');
    const charactersDiv = document.querySelector('.viewer-data.artCharacters span');
    const formDiv = document.querySelector('.viewer-data.artForm span');
    const artNameDiv = document.querySelector('.viewer-data.artName span');
    const artCreationDateDiv = document.querySelector('.viewer-data.artCreationDate span');
    const artRecievalMethodDiv = document.querySelector('.viewer-data.artRecievalMethod span');
    const artRecievalMethodIcon = document.querySelector('.viewer-data.artRecievalMethod i');

    aiModelDiv.textContent = img.aiModel || "Unknown Model";
    charactersDiv.textContent = img.characters?.length > 0 ? img.characters.join(', ') : '';
    formDiv.textContent = img.shapeshiftForm || '';
    artNameDiv.textContent = img.artName || '';
    artCreationDateDiv.textContent = img.creationDate || '';
    artRecievalMethodDiv.textContent = `${img.recievalMethod || ''}${img.recievalPrice ? ` (${img.recievalPrice})` : ''}`;
    artRecievalMethodIcon.className = ({ "Gift": "nf nf-fa-gift", "Fanart": "nf nf-fa-paint_brush", "Commission": "nf nf-fa-money", "Self Made": "nf nf-fa-hammer" })[img.recievalMethod] || '';

    const aiBadge = document.getElementById('viewer-ai-badge');
    const nsfwBadge = document.getElementById('viewer-nsfw-badge');
    const discordBadge = document.getElementById('viewer-discord-badge');
    const downloadButton = document.getElementById('download-button');

    if (Boolean(userIsUK) && Boolean(img.isNSFW)) {
        downloadButton.onclick = () => {
            userFailedUKDownload = true;
            downloadButton.textContent = "NSFW Downloads Unavailable in the UK";
            downloadButton.style.color = "#888";
            downloadButton.style.cursor = "not-allowed"
            showPopup({
                title: `Dammit, why can't I goon to you offline?`,
                message: `<b><u>Heyo UK user.</u></b><br><br>Due to the regulations of your country, in order to protect myself, I cannot allow downloads from an UK-based device.<br><br>However, you can still view the image online, and if you really want a copy, you can always take a screenshot.<br><br>Sorry for the inconvenience!`,
                buttons: [
                    {
                        text: 'I Understand',
                        onClick: () => {
                            setCookie('readUKmessage', 'True', 14);
                        }
                    },
                    {
                        text: 'View Petition',
                        onClick: () => {
                            setCookie('readUKmessage', 'True', 14);
                            window.open('https://petition.parliament.uk/petitions/722903', '_blank');
                        }
                    }
                ]
            });
        };
    } else if ((userFailedUKDownload) && Boolean(img.isNSFW)) {
        downloadButton.textContent = "NSFW Downloads Unavailable in the UK";
        downloadButton.style.color = "#888";
        downloadButton.style.cursor = "not-allowed"
    } else if (Boolean(img.disableDownload)) {
        const downloadButton = document.getElementById('download-button');
        downloadButton.textContent = "Downloads Disabled for this Image";
        downloadButton.style.color = "#888";
        downloadButton.style.cursor = "not-allowed"
        downloadButton.onclick = null;
    } else {
        downloadButton.textContent = "Download Image";
        downloadButton.style.color = "#FFF";
        downloadButton.style.cursor = "pointer";
        downloadButton.onclick = downloadImage;
    }

    if (Boolean(img.isAI)) {
        aiBadge.classList.remove('hidden');
        aiModelDiv.parentElement.style.display = "flex";
    } else {
        aiBadge.classList.add('hidden');
        aiModelDiv.parentElement.style.display = "none";
    }

    if (Boolean(img.isNSFW)) {
        nsfwBadge.classList.remove('hidden');
    } else {
        nsfwBadge.classList.add('hidden');
    }

    if (Boolean(img.isDiscEmoji)) {
        discordBadge.classList.remove('hidden');
    } else {
        discordBadge.classList.add('hidden');
    }

    document.getElementById('viewer').classList.remove('hidden');
}

function downloadImage() {
    const imageUrl = document.getElementById('viewer-image').src;
    if (imageUrl) {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `${img.filename}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

/**
 * Close the image viewer and hide it.
 * 
 * @function closeViewer
 * @since v23
 */
function closeViewer() {
    document.getElementById('viewer').classList.add('hidden');
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeViewer();
    }
});