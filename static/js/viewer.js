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

/* ---- OPEN FUNCTION ---- */
function openViewer(filename, title, artist, artistPic, shapeshiftForm, artName, isAI) {
    document.getElementById('viewer-image').src = `/static/images/${filename}`;
    document.getElementById('viewer-title').querySelector('#viewer-form').textContent = shapeshiftForm;
    document.getElementById('viewer-title').querySelector('#viewer-artname').textContent = artName;
    document.getElementById('viewer-artist').textContent = artist;
    document.getElementById('viewer-artist-pic').src = `/static/images/artists/${artistPic}`;

    const aiBadge = document.getElementById('viewer-ai-badge');
    const aiNote = document.getElementById('viewer-ai-note');
    console.log(isAI);
    if (isAI === 'True') {
        aiBadge.classList.remove('hidden');
        aiNote.classList.remove('hidden');
    } else {
        aiBadge.classList.add('hidden');
        aiNote.classList.add('hidden');
    }

    document.getElementById('viewer').classList.remove('hidden');
}


/* ---- CLOSE FUNCTION ---- */
function closeViewer() {
    document.getElementById("viewer").classList.add("hidden");
}
