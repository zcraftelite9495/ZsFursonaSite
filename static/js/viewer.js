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
            const aiBadge = document.createElement("div");
            aiBadge.className = "thumb-viewer-badge ai-badge"; // Use a new class name
            aiBadge.innerHTML = `<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/></svg>`;
            badgeContainer.appendChild(aiBadge);
        }
        if (img.isNSFW) {
            const nsfwBadge = document.createElement("div");
            nsfwBadge.className = "thumb-viewer-badge nsfw-badge"; // Use a new class name
            nsfwBadge.innerHTML = `<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20 1C20 0.447715 20.4477 0 21 0C21.5523 0 22 0.447715 22 1V2H23C23.5523 2 24 2.44772 24 3C24 3.55228 23.5523 4 23 4H22V5C22 5.55228 21.5523 6 21 6C20.4477 6 20 5.55228 20 5V4H19C18.4477 4 18 3.55228 18 3C18 2.44772 18.4477 2 19 2H20V1Z"/><path d="M21.1936 8.07463C21.7016 7.85776 22.297 8.09138 22.4668 8.6169C23.145 10.7148 23.1792 12.9766 22.5523 15.1064C21.8308 17.5572 20.2788 19.6804 18.1626 21.1117C16.0464 22.5429 13.498 23.193 10.9548 22.9502C8.41165 22.7075 6.03225 21.5871 4.22503 19.7814C2.4178 17.9757 1.29545 15.5972 1.05062 13.0542C0.805783 10.5112 1.45373 7.96227 2.88325 5.84491C4.31277 3.72755 6.43471 2.17379 8.88488 1.4503C11.0142 0.821568 13.2759 0.853957 15.3744 1.53036C15.9001 1.69979 16.1342 2.29501 15.9178 2.80311C15.7013 3.31122 15.1136 3.54496 14.5846 3.38623C12.9184 2.88626 11.1353 2.8783 9.4532 3.37498C7.45003 3.96647 5.71522 5.23677 4.5465 6.96784C3.37778 8.69891 2.84804 10.7828 3.04821 12.8619C3.24838 14.9409 4.16596 16.8855 5.64348 18.3618C7.121 19.8381 9.06631 20.754 11.1455 20.9525C13.2247 21.1509 15.3082 20.6195 17.0383 19.4493C18.7684 18.2792 20.0373 16.5433 20.6271 14.5397C21.1224 12.8572 21.113 11.074 20.6116 9.40826C20.4525 8.87941 20.6857 8.29149 21.1936 8.07463Z"/><path d="M7.71054 9.14472L7.29441 9.35279C6.69971 9.65014 5.99999 9.21769 5.99999 8.55279C5.99999 8.214 6.1914 7.9043 6.49441 7.75279L7.78884 7.10557C7.9277 7.03615 8.08081 7 8.23605 7H8.99999C9.55227 7 9.99999 7.44772 9.99999 8V16C9.99999 16.5523 9.55227 17 8.99999 17C8.4477 17 7.99999 16.5523 7.99999 16V9.32361C7.99999 9.17493 7.84352 9.07823 7.71054 9.14472Z"/><path fill-rule="evenodd" clip-rule="evenodd" d="M18 9C18 7.89543 17.1046 7 16 7H14C12.8954 7 12 7.89543 12 9V10.5C12 11.3284 12.6716 12 13.5 12C12.6716 12 12 12.6716 12 13.5V15C12 16.1046 12.8954 17 14 17H16C17.1046 17 18 16.1046 18 15V13.5C18 12.6716 17.3284 12 16.5 12C17.3284 12 18 11.3284 18 10.5V9ZM16 10C16 9.44771 15.5523 9 15 9C14.4477 9 14 9.44771 14 10C14 10.5523 14.4477 11 15 11C15.5523 11 16 10.5523 16 10ZM16 14C16 14.5523 15.5523 15 15 15C14.4477 15 14 14.5523 14 14C14 13.4477 14.4477 13 15 13C15.5523 13 16 13.4477 16 14Z"/></svg>`;
            badgeContainer.appendChild(nsfwBadge);
        }
        if (img.isDiscEmoji) {
            const nsfwBadge = document.createElement("div");
            nsfwBadge.className = "thumb-viewer-badge discord-badge"; // Use a new class name
            nsfwBadge.innerHTML = `<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>`;
            badgeContainer.appendChild(nsfwBadge);
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
    document.getElementById('viewer-image').src = img.webLink
        ? img.webLink
        : `/static/images/${img.filename}`;

    document.getElementById('viewer-artist').textContent = img.artist || "";
    document.getElementById('viewer-artist-pic').src = `/static/images/artists/${img.artist_pic}`;

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