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

let currentImage = null;

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
async function loadGallery(elementId, count = 0, randomize = false, filters = {}, groupByMainCharacter = false) {
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
        } else {
            // sort by shapeshift form: pinned forms first, then alphabetically
            const PINNED_FORMS = ["Main Form", "True Form", "Humanoid Form"];
            images.sort((a, b) => {
                const fa = cleanFormName(a.shapeshiftForm || "");
                const fb = cleanFormName(b.shapeshiftForm || "");
                const ia = PINNED_FORMS.findIndex(p => cleanFormName(p) === fa);
                const ib = PINNED_FORMS.findIndex(p => cleanFormName(p) === fb);
                if (ia !== -1 && ib !== -1) return ia - ib;
                if (ia !== -1) return -1;
                if (ib !== -1) return 1;
                return fa.localeCompare(fb, undefined, { sensitivity: "base" });
            });
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

        function buildThumb(img) {
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

            if (img.isAI) badgeContainer.appendChild(createBadge('ai'));
            if (img.isNSFW) badgeContainer.appendChild(createBadge('nsfw'));
            if (img.isDiscEmoji) badgeContainer.appendChild(createBadge('discord'));

            thumb.appendChild(imgEl);
            thumb.appendChild(thumbText);
            thumb.appendChild(badgeContainer);
            return thumb;
        }

        if (groupByMainCharacter) {
            // Group images by mainCharacter
            const groups = new Map();
            images.forEach(img => {
                const char = (img.mainCharacter || "").trim() || "Other";
                if (!groups.has(char)) groups.set(char, []);
                groups.get(char).push(img);
            });

            // Sort: "Z" first, then alphabetically
            const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
                if (a === "Z") return -1;
                if (b === "Z") return 1;
                return a.localeCompare(b, undefined, { sensitivity: "base" });
            });

            sortedKeys.forEach(charName => {
                const section = document.createElement("div");
                section.className = "gallery-character-section";

                const title = document.createElement("h2");
                title.className = "gallery-character-title";
                title.textContent = charName;

                const innerGallery = document.createElement("div");
                innerGallery.className = "gallery";

                groups.get(charName).forEach(img => {
                    innerGallery.appendChild(buildThumb(img));
                });

                section.appendChild(title);
                section.appendChild(innerGallery);
                gallery.appendChild(section);
            });
        } else {
            images.forEach(img => gallery.appendChild(buildThumb(img)));
        }
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


/**
 * Copies the current image link to the clipboard.
 * 
 * @function copyImageLink
 * @since v24
 */
function shareImage() {
    if (!currentImage || !currentImage.id) return;

    const url = `${window.location.origin}/view/${currentImage.id}`;
    if (navigator.share) {
        navigator.share({
            title: `Z's World - ${currentImage.artName || 'Artwork'}`,
            text: `Art by ${currentImage.artist}.`,
            url: url
        }).catch(err => console.error("Share failed:", err));
    } else {
        navigator.clipboard.writeText(url).then(() => {
            const notification = document.createElement('div');
            notification.textContent = "Image link copied!";
            notification.style.position = "fixed";
            notification.style.bottom = "20px";
            notification.style.left = "50%";
            notification.style.transform = "translateX(-50%)";
            notification.style.background = "rgba(0,0,0,0.8)";
            notification.style.color = "#fff";
            notification.style.padding = "10px 20px";
            notification.style.borderRadius = "8px";
            notification.style.zIndex = "10000";
            notification.style.fontFamily = "sans-serif";
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 2000);
        }).catch(err => console.error("Failed to copy link:", err));
    }
}


/* ---- MIME TYPE FORMATTER ---- */
/**
 * Format a MIME type like "image/png" into "Image (PNG)".
 * Falls back to empty string when falsy and returns the original value
 * when it can't be parsed.
 * 
 * @param {string} mime
 * @returns {string}
 * 
 * @function formatMimeType
 * @since v76
 */
function formatMimeType(mime) {
    if (!mime) return '';
    const cleaned = String(mime).split(';')[0].trim(); // drop parameters
    const parts = cleaned.split('/');
    if (parts.length !== 2) return String(mime);
    const [type, subtypeRaw] = parts;
    const subtype = (subtypeRaw || '').split('+')[0].split('.').pop(); // handle "svg+xml" etc
    const typeCap = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
    return subtype ? `${typeCap} (${subtype.toUpperCase()})` : typeCap;
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
 * @property {string} [img.artistPic] - Name of the artist's profile picture.
 * @property {string[]} [img.characters] - Array of characters in the art.
 * @property {string} [img.creationDate] - Creation date of the art.
 * @property {boolean} [img.isAI] - Whether the image is AI-generated.
 * @property {boolean} [img.isNSFW] - Whether the image is NSFW.
 * 
 * @function openViewer
 * @since v23
 */
function openViewer(img) {
    currentImage = img;

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
    
    let artistPicPromise;
    if (img.artistPic === "discord") {
        artistPicPromise = fetch(`/api/v1/fetch/discord-avatar?id=${img.id}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch Discord avatar');
                }
                return response.json();
            })
            .then(data => {
                const avatarSrc = data.avatarURL;
                return loadImage(viewerArtistPic, avatarSrc);
            })
            .catch(error => {
                console.error("Error fetching Discord avatar:", error);
                // Fallback or leave blank on API error
                return Promise.resolve();
            });
    } else {
        artistPicPromise = loadImage(viewerArtistPic, `/static/images/artists/${img.artistPic}`);
    }

    imagePromises.push(artistPicPromise);

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
    const artFileTypeDiv = document.querySelector('.viewer-data.artFileType span');
    const artCreationDateDiv = document.querySelector('.viewer-data.artCreationDate span');
    const artRecievalMethodDiv = document.querySelector('.viewer-data.artRecievalMethod span');
    const artRecievalMethodIcon = document.querySelector('.viewer-data.artRecievalMethod i');

    aiModelDiv.textContent = img.aiModel || "Unknown Model";
    charactersDiv.textContent = img.characters?.length > 0 ? img.characters.join(', ') : '';
    formDiv.textContent = img.shapeshiftForm || '';
    artNameDiv.textContent = img.artName || '';
    artFileTypeDiv.textContent = formatMimeType(img.filetype);
    artCreationDateDiv.textContent = img.creationDate || '';
    artRecievalMethodDiv.textContent = `${img.recievalMethod || ''}${img.recievalPrice ? ` (${img.recievalPrice})` : ''}`;
    artRecievalMethodIcon.className = ({ "Gift": "nf nf-fa-gift", "Fanart": "nf nf-fa-paint_brush", "Commission": "nf nf-fa-money", "Self Made": "nf nf-fa-hammer" })[img.recievalMethod] || '';

    const aiBadge = document.getElementById('viewer-ai-badge');
    const nsfwBadge = document.getElementById('viewer-nsfw-badge');
    const discordBadge = document.getElementById('viewer-discord-badge');

    const downloadButton = document.getElementById('download-button');
    const shareButton = document.getElementById('share-button');

    if (!navigator.share) {
        shareButton.textContent = "Copy Link";
    }

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
        downloadButton.textContent = "Unavailable";
        downloadButton.style.color = "#888";
        downloadButton.style.cursor = "not-allowed"
    } else if (Boolean(img.disableDownload)) {
        const downloadButton = document.getElementById('download-button');
        downloadButton.textContent = "Unavailable";
        downloadButton.style.color = "#888";
        downloadButton.style.cursor = "not-allowed"
        downloadButton.onclick = null;
    } else {
        downloadButton.textContent = "Download";
        downloadButton.style.color = "#FFF";
        downloadButton.style.cursor = "pointer";
        downloadButton.onclick = () => downloadImage(img);
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

/**
 * Downloads the image displayed in the viewer with the filename provided.
 * @param {Object} img - The image object containing the filename to use.
 * 
 * @function downloadImage
 * @since v55
 */
function downloadImage(img) {
    const imageUrl = document.getElementById('viewer-image').src;
    if (imageUrl) {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = img.filename;
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
        const editModal = document.getElementById('viewer-edit-modal');
        if (editModal && !editModal.classList.contains('hidden')) {
            closeViewerEditModal();
        } else {
            closeViewer();
        }
    }
});


/* ===================================================
   VIEWER EDIT MODAL (admin users only)
   =================================================== */

/** Initialise a tag-input widget for the viewer edit modal. */
function _veInitTagInput() {
    const wrap  = document.getElementById('ve-tag-wrap');
    const real  = document.getElementById('ve-tag-input');
    if (!wrap || real._veInited) return;
    real._veInited = true;

    let tags = [];

    function render() {
        wrap.querySelectorAll('.admin-tag').forEach(t => t.remove());
        tags.forEach((tag, i) => {
            const el = document.createElement('span');
            el.className = 'admin-tag';
            el.textContent = tag;
            const rm = document.createElement('button');
            rm.type = 'button';
            rm.textContent = '×';
            rm.onclick = () => { tags.splice(i, 1); render(); };
            el.appendChild(rm);
            wrap.insertBefore(el, real);
        });
    }

    real.addEventListener('keydown', e => {
        if ((e.key === 'Enter' || e.key === ',') && real.value.trim()) {
            e.preventDefault();
            const val = real.value.trim().replace(/,$/, '');
            if (val && !tags.includes(val)) { tags.push(val); render(); }
            real.value = '';
        } else if (e.key === 'Backspace' && !real.value && tags.length) {
            tags.pop(); render();
        }
    });

    wrap._setTags = (arr) => { tags = arr.slice(); render(); };
    wrap._getTags = () => tags.slice();
}

/** Bind conditional field visibility for the viewer edit modal. */
function _veBindConditional() {
    const artistPic     = document.getElementById('ve-artistPic');
    const discordField  = document.getElementById('ve-discordID-field');
    const fileField     = document.getElementById('ve-artistFile-field');
    const recievalMethod = document.getElementById('ve-recievalMethod');
    const priceField    = document.getElementById('ve-recievalPrice-field');
    const isAI          = document.getElementById('ve-isAI');
    const aiField       = document.getElementById('ve-aiModel-field');

    function updateArtist() {
        const isDiscord = artistPic.value === 'discord';
        discordField.style.display = isDiscord ? '' : 'none';
        fileField.style.display    = isDiscord ? 'none' : '';
    }
    function updateRecieval() {
        priceField.style.display = recievalMethod.value === 'Commission' ? '' : 'none';
    }
    function updateAI() {
        aiField.style.display = isAI.checked ? '' : 'none';
    }

    artistPic.addEventListener('change', updateArtist);
    recievalMethod.addEventListener('change', updateRecieval);
    isAI.addEventListener('change', updateAI);

    updateArtist();
    updateRecieval();
    updateAI();
}

/** Populate artist file dropdown dynamically. */
async function _veLoadArtistFiles(selectedFile) {
    const sel = document.getElementById('ve-artistFile');
    if (sel.dataset.loaded) {
        if (selectedFile) sel.value = selectedFile;
        return;
    }
    try {
        const res  = await fetch('/api/v1/admin/artist-files');
        const data = await res.json();
        sel.innerHTML = '';
        (data.files || []).forEach(f => {
            const opt = document.createElement('option');
            opt.value = f;
            opt.textContent = f;
            sel.appendChild(opt);
        });
        sel.dataset.loaded = '1';
        if (selectedFile) sel.value = selectedFile;
    } catch (_) {}
}

/** Open the viewer edit modal and populate it with currentImage data. */
async function openViewerEditModal() {
    const img = currentImage;
    if (!img) return;

    _veInitTagInput();

    document.getElementById('ve-id').value             = img.id;
    document.getElementById('ve-artName').value        = img.artName        || '';
    document.getElementById('ve-creationDate').value   = img.creationDate   || '';
    document.getElementById('ve-shapeshiftForm').value = img.shapeshiftForm || '';
    document.getElementById('ve-mainCharacter').value  = img.mainCharacter  || 'Z';
    document.getElementById('ve-artist').value         = img.artist         || '';
    document.getElementById('ve-discordID').value      = img.discordID      || '';
    document.getElementById('ve-aiModel').value        = img.aiModel        || '';
    document.getElementById('ve-recievalPrice').value  = img.recievalPrice  || '';
    document.getElementById('ve-recievalMethod').value = img.recievalMethod || 'Self Made';

    const isFileArtist = img.artistPic && img.artistPic !== 'discord';
    document.getElementById('ve-artistPic').value = isFileArtist ? 'file' : 'discord';
    await _veLoadArtistFiles(isFileArtist ? img.artistPic : null);

    document.getElementById('ve-isAI').checked            = Boolean(img.isAI);
    document.getElementById('ve-isNSFW').checked           = Boolean(img.isNSFW);
    document.getElementById('ve-isDiscEmoji').checked      = Boolean(img.isDiscEmoji);
    document.getElementById('ve-disableDownload').checked  = Boolean(img.disableDownload);

    const chars = Array.isArray(img.characters) ? img.characters : [];
    document.getElementById('ve-tag-wrap')._setTags(chars);

    _veBindConditional();

    const statusEl = document.getElementById('viewer-edit-status');
    statusEl.style.display = 'none';

    document.getElementById('viewer-edit-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

/** Close the viewer edit modal. */
function closeViewerEditModal() {
    document.getElementById('viewer-edit-modal').classList.add('hidden');
    document.body.style.overflow = '';
}

// Close on overlay click
document.getElementById('viewer-edit-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('viewer-edit-modal')) closeViewerEditModal();
});

// Submit handler
document.getElementById('viewer-edit-form').addEventListener('submit', async e => {
    e.preventDefault();

    const id         = parseInt(document.getElementById('ve-id').value);
    const statusEl   = document.getElementById('viewer-edit-status');
    const submitBtn  = e.target.querySelector('[type="submit"]');

    submitBtn.disabled    = true;
    submitBtn.textContent = 'Saving…';
    statusEl.style.display = 'none';

    const artistPicVal = document.getElementById('ve-artistPic').value;
    const artistPic    = artistPicVal === 'discord'
        ? 'discord'
        : (document.getElementById('ve-artistFile')?.value || 'discord');

    const payload = {
        artName:         document.getElementById('ve-artName').value.trim(),
        creationDate:    document.getElementById('ve-creationDate').value,
        shapeshiftForm:  document.getElementById('ve-shapeshiftForm').value.trim(),
        mainCharacter:   document.getElementById('ve-mainCharacter').value.trim() || 'Z',
        characters:      document.getElementById('ve-tag-wrap')._getTags(),
        artist:          document.getElementById('ve-artist').value.trim(),
        artistPic,
        discordID:       document.getElementById('ve-discordID').value.trim(),
        aiModel:         document.getElementById('ve-aiModel').value.trim() || null,
        recievalMethod:  document.getElementById('ve-recievalMethod').value,
        recievalPrice:   document.getElementById('ve-recievalPrice').value.trim() || null,
        isAI:            document.getElementById('ve-isAI').checked,
        isNSFW:          document.getElementById('ve-isNSFW').checked,
        isDiscEmoji:     document.getElementById('ve-isDiscEmoji').checked,
        disableDownload: document.getElementById('ve-disableDownload').checked,
    };

    function setStatus(type, msg) {
        statusEl.className  = `admin-status admin-status-${type}`;
        statusEl.textContent = msg;
        statusEl.style.display = '';
    }

    try {
        const res  = await fetch(`/api/v1/admin/edit/${id}`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(payload)
        });
        const data = await res.json();

        if (res.ok && data.success) {
            setStatus('success', '✓ Changes saved. Reloading gallery…');
            // Update currentImage so the viewer reflects changes immediately
            Object.assign(currentImage, payload);
            setTimeout(() => {
                closeViewerEditModal();
                // Reload the gallery data so filters/sorting are fresh
                if (typeof applyFilters === 'function') applyFilters();
            }, 1000);
        } else {
            setStatus('error', data.error || 'Save failed.');
        }
    } catch (err) {
        setStatus('error', 'Network error — please try again.');
        console.error(err);
    } finally {
        submitBtn.disabled    = false;
        submitBtn.textContent = 'Save Changes';
    }
});

// Auth check on load — show edit button only for logged-in users
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res  = await fetch('/api/v1/auth/status');
        const data = await res.json();
        if (data.logged_in) {
            const btn = document.getElementById('viewer-edit-button');
            if (btn) btn.classList.remove('hidden');
        }
    } catch (_) {}
});