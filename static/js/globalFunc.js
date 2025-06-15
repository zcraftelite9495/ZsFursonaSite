/*
███████╗██╗░██████╗░░███████╗██╗░░░██╗██████╗░░██████╗░█████╗░███╗░░██╗░█████╗░░░░██████╗██╗████████╗███████╗
╚════██║╚█║██╔════╝░░██╔════╝██║░░░██║██╔══██╗██╔════╝██╔══██╗████╗░██║██╔══██╗░░██╔════╝██║╚══██╔══╝██╔════╝
░░███╔═╝░╚╝╚█████╗░░░█████╗░░██║░░░██║██████╔╝╚█████╗░██║░░██║██╔██╗██║███████║░░╚█████╗░██║░░░██║░░░█████╗░░
██╔══╝░░░░░░╚═══██╗░░██╔══╝░░██║░░░██║██╔══██╗░╚═══██╗██║░░██║██║╚████║██╔══██║░░░╚═══██╗██║░░░██║░░░██╔══╝░░
███████╗░░░██████╔╝░░██║░░░░░╚██████╔╝██║░░██║██████╔╝╚█████╔╝██║░╚███║██║░░██║░░██████╔╝██║░░░██║░░░███████╗
╚══════╝░░░╚═════╝░░░╚═╝░░░░░░╚═════╝░╚═╝░░╚═╝╚═════╝░░╚════╝░╚═╝░░╚══╝╚═╝░░╚═╝░░╚═════╝░╚═╝░░░╚═╝░░░╚══════╝

█████▀████████████████████████████████████████████████████████████████████████████████████████
█─▄▄▄▄█▄─▄███─▄▄─█▄─▄─▀██▀▄─██▄─▄█████▄─▄▄─█▄─██─▄█▄─▀█▄─▄█─▄▄▄─█─▄─▄─█▄─▄█─▄▄─█▄─▀█▄─▄█─▄▄▄▄█
█─██▄─██─██▀█─██─██─▄─▀██─▀─███─██▀████─▄████─██─███─█▄▀─██─███▀███─████─██─██─██─█▄▀─██▄▄▄▄─█
▀▄▄▄▄▄▀▄▄▄▄▄▀▄▄▄▄▀▄▄▄▄▀▀▄▄▀▄▄▀▄▄▄▄▄▀▀▀▄▄▄▀▀▀▀▄▄▄▄▀▀▄▄▄▀▀▄▄▀▄▄▄▄▄▀▀▄▄▄▀▀▄▄▄▀▄▄▄▄▀▄▄▄▀▀▄▄▀▄▄▄▄▄▀

Made with love by ZcraftElite :3
*/

// ---- COOKIE FUNCTIONS ----
// --- SET COOKIE ---
function setCookie(name, value, days = 7) {
    const expires = new Date(Date.now() + days*864e5).toUTCString();
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

// --- FETCH COOKIE ---
function getCookie(name) {
    return document.cookie.split('; ').reduce((r, v) => {
        const [k, val] = v.split('=');
        return k === encodeURIComponent(name) ? decodeURIComponent(val) : r;
    }, null);
}

// ---- POPUP FUNCTION ----
function showPopup({ 
    title = 'Notice', 
    message = '', 
    buttons = [{ text: 'OK', onClick: () => closePopup() }] 
}) {
    // Remove existing popup if any
    const existing = document.getElementById('custom-popup-overlay');
    if (existing) existing.remove();

    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'custom-popup-overlay';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(15, 15, 26, 0.8);
        display: flex; justify-content: center; align-items: center;
        z-index: 10000;
        font-family: 'Ubuntu', sans-serif;
    `;

    // Create popup container
    const popup = document.createElement('div');
    popup.style.cssText = `
        background: #0f0f1a;
        color: #eee;
        padding: 1.5rem 2rem;
        border-radius: 8px;
        box-shadow: 0 0 15px rgba(255,105,180,0.7);
        max-width: 90vw;
        width: 350px;
        text-align: center;
    `;

    // Title
    const h2 = document.createElement('h2');
    h2.textContent = title;
    h2.style.cssText = `
        margin: 0 0 1rem;
        font-weight: 700;
        color: #ff69b4;
        font-size: 1.5rem;
    `;
    popup.appendChild(h2);

    // Message
    const msg = document.createElement('p');
    msg.innerHTML = message;
    msg.style.cssText = `
        margin: 0 0 1.5rem;
        font-size: 1rem;
        line-height: 1.4;
        color: #ddd;
    `;
    popup.appendChild(msg);

    // Buttons container
    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = `
        display: flex;
        justify-content: center;
        gap: 1rem;
    `;

    buttons.forEach(({ text, onClick }) => {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.style.cssText = `
            background: #ff69b4;
            border: none;
            padding: 0.5rem 1.25rem;
            border-radius: 5px;
            color: #0f0f1a;
            font-weight: 600;
            font-size: 1rem;
            cursor: pointer;
            transition: background-color 0.2s ease;
            flex: 1;
            min-width: 70px;
        `;
        btn.onmouseenter = () => btn.style.backgroundColor = '#ff479d';
        btn.onmouseleave = () => btn.style.backgroundColor = '#ff69b4';
        btn.onclick = () => {
            if (typeof onClick === 'function') onClick();
            closePopup();
        };
        btnContainer.appendChild(btn);
    });

    popup.appendChild(btnContainer);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    function closePopup() {
        overlay.remove();
    }
}
