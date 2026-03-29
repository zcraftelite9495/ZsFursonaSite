"""
███████╗██╗░██████╗░░███████╗██╗░░░██╗██████╗░░██████╗░█████╗░███╗░░██╗░█████╗░░░░██████╗██╗████████╗███████╗
╚════██║╚█║██╔════╝░░██╔════╝██║░░░██║██╔══██╗██╔════╝██╔══██╗████╗░██║██╔══██╗░░██╔════╝██║╚══██╔══╝██╔════╝
░░███╔═╝░╚╝╚█████╗░░░█████╗░░██║░░░██║██████╔╝╚█████╗░██║░░██║██╔██╗██║███████║░░╚█████╗░██║░░░██║░░░█████╗░░
██╔══╝░░░░░░╚═══██╗░░██╔══╝░░██║░░░██║██╔══██╗░╚═══██╗██║░░██║██║╚████║██╔══██║░░░╚═══██╗██║░░░██║░░░██╔══╝░░
███████╗░░░██████╔╝░░██║░░░░░╚██████╔╝██║░░██║██████╔╝╚█████╔╝██║░╚███║██║░░██║░░██████╔╝██║░░░██║░░░███████╗
╚══════╝░░░╚═════╝░░░╚═╝░░░░░░╚═════╝░╚═╝░░╚═╝╚═════╝░░╚════╝░╚═╝░░╚══╝╚═╝░░╚═╝░░╚═════╝░╚═╝░░░╚═╝░░░╚══════╝

█████████████████████████████████████████████████████████████████████████████
█▄─▄▄─█▄─▄████▀▄─██─▄▄▄▄█▄─█─▄███▄─▄─▀██▀▄─██─▄▄▄─█▄─█─▄█▄─▄▄─█▄─▀█▄─▄█▄─▄▄▀█
██─▄████─██▀██─▀─██▄▄▄▄─██─▄▀█████─▄─▀██─▀─██─███▀██─▄▀███─▄█▀██─█▄▀─███─██─█
▀▄▄▄▀▀▀▄▄▄▄▄▀▄▄▀▄▄▀▄▄▄▄▄▀▄▄▀▄▄▀▀▀▄▄▄▄▀▀▄▄▀▄▄▀▄▄▄▄▄▀▄▄▀▄▄▀▄▄▄▄▄▀▄▄▄▀▀▄▄▀▄▄▄▄▀▀

Made with love by ZcraftElite :3
"""

import os
import logging
from dotenv import load_dotenv
from pathlib import Path
from PIL import Image, ImageOps
from flask import Flask, render_template, jsonify, request, make_response, send_file, send_from_directory, url_for, redirect, session
from werkzeug.utils import secure_filename
import json, random, requests, secrets

app = Flask(__name__)

# ---- Load Environment Variables from `.env` if it Exists ----
if os.path.exists('.env'):
    load_dotenv()

# ---- Definitions ----
app.secret_key = os.getenv('APP_SECRET_KEY')

BASE_DIR = Path(__file__).parent
STATIC_IMAGES_DIR = BASE_DIR / "static" / "images"
THUMBS_DIR = STATIC_IMAGES_DIR / "thumbs"
THUMBS_DIR.mkdir(parents=True, exist_ok=True)

ARTISTS_DIR = STATIC_IMAGES_DIR / "artists"
ARTISTS_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'}

DISCORD_API_KEY = os.getenv('DISCORD_API_KEY')

OIDC_AUTHORIZATION_ENDPOINT = os.getenv('OIDC_AUTHORIZATION_ENDPOINT')
OIDC_TOKEN_ENDPOINT = os.getenv('OIDC_TOKEN_ENDPOINT')
OIDC_USERINFO_ENDPOINT = os.getenv('OIDC_USERINFO_ENDPOINT')
OIDC_REDIRECT_URI = os.getenv('OIDC_REDIRECT_URI')
OIDC_CLIENT_ID = os.getenv('OIDC_CLIENT_ID')
OIDC_CLIENT_SECRET = os.getenv('OIDC_CLIENT_SECRET')
VERIFY_SSL = False

# ---- FUNCTIONS ----
# --- IMAGE LOADER ---
def load_images():
    """
    Loads the JSON data from the art.json file.
    """
    with open('data/art.json') as f:
        return json.load(f)

# --- IMAGE SAVER ---
def save_images(images):
    """Saves the art list back to art.json."""
    with open('data/art.json', 'w', encoding='utf-8') as f:
        json.dump(images, f, indent=4, ensure_ascii=False)

# --- ALLOWED FILE CHECK ---
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_IMAGE_EXTENSIONS

# --- FIND ENTRY BY ID (searches top-level and nested alternates) ---
def find_by_id(art_list, target_id):
    """
    Returns (parent_entry, alt_entry_or_None).
    Accepts:
    - An integer or plain integer string  → top-level entry
    - 'NNNNN-001' composite string        → alternate '001' under parent NNNNN
    Returns (None, None) if not found.
    """
    target_str = str(target_id)
    if '-' in target_str:
        parts = target_str.rsplit('-', 1)
        try:
            parent_int = int(parts[0])
            alt_sub    = parts[1]          # e.g. "001"
        except ValueError:
            return None, None
        for entry in art_list:
            if entry.get("id") == parent_int:
                for alt in entry.get("alternates", []):
                    if str(alt.get("id")) == alt_sub:
                        return entry, alt
        return None, None
    # Plain integer → top-level
    try:
        target_int = int(target_str)
    except ValueError:
        return None, None
    for entry in art_list:
        if entry.get("id") == target_int:
            return entry, None
    return None, None


def find_next_alt_id(parent_entry):
    """Returns the next 3-digit zero-padded string alt ID unique within a parent."""
    existing = [a.get("id") for a in parent_entry.get("alternates", [])]
    max_num  = max((int(x) for x in existing if str(x).isdigit()), default=0)
    return f"{max_num + 1:03d}"

# --- SET COOKIE ---
def set_cookie(response, key, value, days=7):
    """
    Sets a cookie value.

    :param key: The id/name of the cookie to set.
    :param value: The value to set the cookie to.
    :param days: The number of days to set the cookie for.
    """
    response.set_cookie(key, value, max_age=days * 86400)

# --- FETCH COOKIE ---
def get_cookie(key):
    """
    Fetches a cookie value.

    :param key: The id/name of the cookie to fetch.
    """
    return request.cookies.get(key)

# --- CREATE THUMBNAIL ---
def create_thumbnails(images, thumb_size=(280, 0), force=False):
    """
    Generate thumbnails for each image in images list.
    Saves thumbnails as WebP in THUMBS_DIR with the same base filename.
    
    :param images: list of dicts from art.json with 'filename' keys
    :param thumb_size: tuple (width, height) for thumbnails. Height=0 keeps aspect ratio.
    :param force: if True, regenerate even if thumbnail exists
    """
    created = []
    for img in images:
        src_file = Path("static/images") / img["filename"]
        thumb_file = THUMBS_DIR / (Path(img["filename"]).stem + ".webp")

        if not src_file.exists():
            continue
        if thumb_file.exists() and not force:
            continue

        with Image.open(src_file) as im:
            im = ImageOps.exif_transpose(im)  # respect EXIF orientation
            if thumb_size[1] == 0:
                wpercent = thumb_size[0] / float(im.width)
                hsize = int(float(im.height) * float(wpercent))
                im = im.resize((thumb_size[0], hsize), Image.LANCZOS)
            else:
                im.thumbnail(thumb_size, Image.LANCZOS)
            im.save(thumb_file, format="WEBP", quality=85)
            created.append(thumb_file.name)
    return created

# ---- THUMBNAIL AUTOGENERATION ----
try:
    images = load_images()
    created_thumbs = create_thumbnails(images)
    if created_thumbs:
        print(f"Generated {len(created_thumbs)} thumbnails")
except Exception as e:
    logging.exception("Failed to generate thumbnails at startup")

# ---- OPENGRAPH METADATA ADAPTATION ----
def adapt_meta_desc(meta, text):
    ua = request.headers.get("User-Agent", "").lower()
    if "discordbot" in ua:
        meta["description"] += f"\n{text}"
    else:
        meta["description"] += f" ~ {text}"
    return meta


# ---- ROUTES ----
# --- HOMEPAGE ---
@app.route('/')
def index():
    return render_template('index.html')

# --- LIBRARY PAGE ---
@app.route('/library')
def library():
    return render_template('library.html')

# --- CHARACTERS PAGE ---
@app.route('/characters')
def characters():
    return render_template('characters.html')

# --- MY FAVORITE THINGS PAGE ---
@app.route('/favs')
def favs():
    return render_template('favs.html')

# --- SPECIFIC IMAGE VIEW PAGE ---
@app.route('/view/<image_id>')
def view_image(image_id):
    images = load_images()

    parent, alt = find_by_id(images, image_id)
    if not parent:
        return render_template("404.html"), 404

    # Use the alternate's own fields (filename, flags) when present, fall back to parent
    display = alt if alt else parent

    meta = {
        "title": f"Z's World - Art - {parent.get('artName') or parent.get('shapeshiftForm', '')}",
        "description": "",
        "url": f"https://zcraftelite.net/view/{image_id}",
        "image": url_for("static", filename=f"images/thumbs/{display['strippedFilename']}.webp", _external=True),
        "redirect": url_for("library", id=image_id, _external=True)
    }

    if display.get('isAI'):
        meta["description"] = f"Generated by {parent.get('artist', 'Unknown')}"
        meta = adapt_meta_desc(meta, f"Generated using {display.get('aiModel', 'Unknown Model')}")
    else:
        meta["description"] = f"Created by {parent.get('artist', 'Unknown')}"

    meta = adapt_meta_desc(meta, f"Created on {parent.get('creationDate', 'Unknown Date')}")

    return render_template("share.html", meta=meta, image=display)

@app.route('/embed/<image_id>')
def embed_image(image_id):
    images = load_images()

    parent, _ = find_by_id(images, image_id)
    if not parent:
        return render_template("404.html"), 404
    return render_template("embed.html", ID=image_id, image=parent)

# --- LOGOUT ---
@app.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return redirect(url_for('index'))

# ---- ADMIN ----
# --- ADMIN PAGE ---
@app.route('/admin')
def admin():
    if not session.get('username'):
        return redirect(url_for('index'))
    images = load_images()
    artist_files = sorted(
        f.name for f in ARTISTS_DIR.iterdir()
        if f.is_file() and allowed_file(f.name)
    )
    return render_template('admin.html', images=images, artist_files=artist_files)

# --- AUTH STATUS ---
@app.route('/api/v1/auth/status')
def auth_status():
    username = session.get('username')
    return jsonify({"logged_in": bool(username), "username": username or ""})

# --- UPLOAD ARTWORK ---
@app.route('/api/v1/admin/upload', methods=['POST'])
def admin_upload():
    if not session.get('username'):
        return jsonify({"error": "Unauthorized"}), 401

    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['file']
    if not file or file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    if not allowed_file(file.filename):
        return jsonify({"error": "File type not allowed. Use PNG, JPG, GIF, WebP, BMP, or SVG."}), 400

    filename = secure_filename(file.filename)
    filepath = STATIC_IMAGES_DIR / filename

    # Avoid overwriting existing files by appending a counter
    if filepath.exists():
        stem = Path(filename).stem
        ext = Path(filename).suffix
        counter = 1
        while filepath.exists():
            filename = f"{stem}_{counter}{ext}"
            filepath = STATIC_IMAGES_DIR / filename
            counter += 1

    file.save(str(filepath))

    stripped = Path(filename).stem
    filetype = file.content_type or f"image/{Path(filename).suffix.lstrip('.')}"

    art_list = load_images()

    is_ai = request.form.get('isAI') == 'true'
    is_nsfw = request.form.get('isNSFW') == 'true'
    is_disc_emoji = request.form.get('isDiscEmoji') == 'true'
    disable_download = request.form.get('disableDownload') == 'true'
    ai_model = request.form.get('aiModel') or None
    if not is_ai:
        ai_model = None

    # Only top-level IDs contribute to the global pool; alts use their own 3-digit counter
    all_ids = [e["id"] for e in art_list]
    new_id = max(all_ids, default=999999) + 1

    # --- Upload as alternate of an existing artwork ---
    parent_id_raw = request.form.get('parentId', '').strip()
    if parent_id_raw:
        try:
            parent_id = int(parent_id_raw)
        except ValueError:
            return jsonify({"error": "parentId must be an integer"}), 400

        parent_entry, _ = find_by_id(art_list, parent_id)
        if not parent_entry:
            return jsonify({"error": f"Parent artwork {parent_id} not found"}), 404

        alt_id = find_next_alt_id(parent_entry)
        alt_entry = {
            "id": alt_id,
            "filename": filename,
            "strippedFilename": stripped,
            "filetype": filetype,
            "label": request.form.get('label', 'Alternate Version'),
            "isAI": is_ai,
            "isNSFW": is_nsfw,
            "isDiscEmoji": is_disc_emoji,
            "disableDownload": disable_download,
            "aiModel": ai_model,
        }

        if "alternates" not in parent_entry:
            parent_entry["alternates"] = []
        parent_entry["alternates"].append(alt_entry)
        save_images(art_list)

        try:
            create_thumbnails([{"filename": filename, "strippedFilename": stripped}], force=True)
        except Exception as e:
            logging.warning(f"Thumbnail generation failed for alternate: {e}")

        full_alt_id = f"{parent_id}-{alt_id}"
        return jsonify({"success": True, "id": full_alt_id, "entry": alt_entry, "parentId": parent_id})

    # --- Standard top-level upload ---
    characters_raw = request.form.get('characters', '')
    characters = [c.strip() for c in characters_raw.split(',') if c.strip()]

    recieval_method = request.form.get('recievalMethod', 'Self Made')
    recieval_price = request.form.get('recievalPrice') or None
    if recieval_method != 'Commission':
        recieval_price = None

    artist_pic = request.form.get('artistPic', 'discord')
    discord_id = request.form.get('discordID', '') if artist_pic == 'discord' else ''

    new_entry = {
        "filename": filename,
        "title": request.form.get('title') or filename,
        "strippedFilename": stripped,
        "filetype": filetype,
        "aiModel": ai_model,
        "artist": request.form.get('artist', ''),
        "artistPic": artist_pic,
        "discordID": discord_id,
        "shapeshiftForm": request.form.get('shapeshiftForm', ''),
        "mainCharacter": request.form.get('mainCharacter', 'Z'),
        "characters": characters,
        "artName": request.form.get('artName', ''),
        "creationDate": request.form.get('creationDate', ''),
        "recievalMethod": recieval_method,
        "recievalPrice": recieval_price,
        "isAI": is_ai,
        "isNSFW": is_nsfw,
        "isDiscEmoji": is_disc_emoji,
        "disableDownload": disable_download,
        "id": new_id
    }

    art_list.append(new_entry)
    save_images(art_list)

    try:
        create_thumbnails([new_entry], force=True)
    except Exception as e:
        logging.warning(f"Thumbnail generation failed for uploaded file: {e}")

    return jsonify({"success": True, "id": new_entry["id"], "entry": new_entry})

# --- EDIT ARTWORK ---
@app.route('/api/v1/admin/edit/<image_id>', methods=['POST'])
def admin_edit(image_id):
    if not session.get('username'):
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    art_list = load_images()
    parent, alt = find_by_id(art_list, image_id)

    if not parent:
        return jsonify({"error": f"Artwork {image_id} not found"}), 404

    if alt is not None:
        # Editing an alternate — only allow alternate-specific fields
        alt_fields = ['label', 'isAI', 'isNSFW', 'isDiscEmoji', 'disableDownload', 'aiModel']
        for field in alt_fields:
            if field in data:
                alt[field] = data[field]
        if not alt.get('isAI'):
            alt['aiModel'] = None
        save_images(art_list)
        return jsonify({"success": True, "entry": alt})

    # Editing a top-level entry
    target = parent
    editable_fields = [
        'title', 'artName', 'shapeshiftForm', 'mainCharacter', 'characters',
        'artist', 'artistPic', 'discordID', 'aiModel',
        'isAI', 'isNSFW', 'isDiscEmoji', 'disableDownload',
        'recievalMethod', 'recievalPrice', 'creationDate'
    ]
    for field in editable_fields:
        if field in data:
            target[field] = data[field]

    if not target.get('isAI'):
        target['aiModel'] = None
    if not target.get('artistPic') == 'discord':
        target['discordID'] = ''
    if target.get('recievalMethod') != 'Commission':
        target['recievalPrice'] = None

    save_images(art_list)
    return jsonify({"success": True, "entry": target})

# --- DELETE ARTWORK ---
@app.route('/api/v1/admin/artist-files')
def admin_artist_files():
    if not session.get('username'):
        return jsonify({"error": "Unauthorized"}), 401
    files = sorted(f.name for f in ARTISTS_DIR.iterdir() if f.is_file())
    return jsonify({"files": files})


@app.route('/api/v1/admin/delete/<image_id>', methods=['POST'])
def admin_delete(image_id):
    if not session.get('username'):
        return jsonify({"error": "Unauthorized"}), 401

    art_list = load_images()
    parent, alt = find_by_id(art_list, image_id)

    if not parent:
        return jsonify({"error": f"Artwork {image_id} not found"}), 404

    if alt is not None:
        # Remove alternate from parent's alternates list (compare 3-digit string IDs)
        alt_sub = str(alt.get("id"))
        parent["alternates"] = [a for a in parent.get("alternates", []) if str(a["id"]) != alt_sub]
    else:
        # Remove top-level entry
        art_list = [a for a in art_list if a["id"] != parent["id"]]

    save_images(art_list)
    return jsonify({"success": True})

# ---- API ENDPOINTS ----
# --- ART DATABASE ---
@app.route('/art.json')
def art_database():
    return send_file('./data/art.json', mimetype='application/json')

# --- CHARACTER DATABASE ---
@app.route('/characters.json')
def character_database():
    return send_file('./data/characters.json', mimetype='application/json')

# --- OAUTH LOGIN ENDPOINT ---
@app.route('/api/v1/oauth/login')
def oauth_login():
    """
    Redirects the user to the Authentik OAuth login page.

    This endpoint is used to start the OAuth login flow. It generates a random state string, stores it in the session, and redirects the user to the Authentik OAuth login page.

    :return: A redirect response to the Authentik OAuth login page.
    :rtype: flask.Response
    """
    state = secrets.token_urlsafe(16)
    session['oauth_state'] = state

    auth_url = (
        f"{OIDC_AUTHORIZATION_ENDPOINT}?"
        f"response_type=code&"
        f"client_id={OIDC_CLIENT_ID}&"
        f"scope=openid%20profile%20email%20offline_access&"
        f"redirect_uri={OIDC_REDIRECT_URI}&"
        f"state={state}"
    )

    logging.info(f"Redirecting to Authentik for OAuth login: {auth_url}")
    return redirect(auth_url)

# --- OAUTH CALLBACK ENDPOINT ---
@app.route('/api/v1/oauth/callback')
def oauth_callback():
    """
    Handles the OAuth callback from Authentik.

    This endpoint is used to exchange the authorization code for an access token, retrieve the user's information from Authentik, and log the user in.

    :param code: The authorization code provided by Authentik.
    :param state: The state string provided by Authentik.
    :param error: An error message provided by Authentik.
    :param error_description: A description of the error provided by Authentik.

    :return: A redirect response to the index page.
    :rtype: flask.Response

    :raises requests.exceptions.RequestException: If there is an error exchanging the authorization code for an access token, or retrieving the user's information.
    """
    code = request.args.get('code')
    state = request.args.get('state')
    error = request.args.get('error')
    error_description = request.args.get('error_description', 'No description provided.')

    if error:
        logging.error(f"OAuth error: {error} - {error_description}")
        return render_template("index.html", error=f"OAuth login failed: {error_description}")

    stored_state = session.pop('oauth_state', None)
    if state != stored_state:
        logging.error(f"OAuth state mismatch. Received: {state}, Expected: {stored_state}")
        return render_template("index.html", error="OAuth state mismatch. Please try again.")

    if not code:
        logging.error("Missing authorization code in OAuth callback.")
        return render_template("index.html", error="OAuth callback missing authorization code.")

    try:
        token_response = requests.post(
            OIDC_TOKEN_ENDPOINT,
            verify=VERIFY_SSL,
            data={
                'grant_type': 'authorization_code',
                'code': code,
                'redirect_uri': OIDC_REDIRECT_URI,
                'client_id': OIDC_CLIENT_ID,
                'client_secret': OIDC_CLIENT_SECRET
            }
        )
        token_response.raise_for_status()
        tokens = token_response.json()
        logging.debug(f"OAuth token response: {tokens}")
    except requests.exceptions.RequestException as e:
        logging.error(f"Error exchanging OAuth code for tokens: {e}")
        return redirect(url_for('index'))

    access_token = tokens.get('access_token')
    if not access_token:
        logging.error("No access token received from Authentik.")
        return redirect(url_for('index'))

    try:
        userinfo_response = requests.get(
            OIDC_USERINFO_ENDPOINT,
            verify=VERIFY_SSL,
            headers={'Authorization': f'Bearer {access_token}'}
        )
        userinfo_response.raise_for_status()
        user_info = userinfo_response.json()
        logging.debug(f"Userinfo: {user_info}")
    except requests.exceptions.RequestException as e:
        logging.error(f"Error fetching user info: {e}")
        return redirect(url_for('index'))

    username = (
        user_info.get('preferred_username')
        or user_info.get('email')
        or user_info.get('sub')
    )

    if not username:
        logging.error("Could not retrieve username from Authentik userinfo.")
        return redirect(url_for('index'))

    session['username'] = username

    logging.info(f"User {username} successfully logged in via Authentik.")
    return redirect(url_for('index'))

# --- GET DISCORD PROFILE PICTURE ----
@app.route('/api/v1/fetch/discord-avatar')
def fetch_discord_avatar():
    """
    Fetch a Discord user's avatar information.

    Parameters:
        id (str): Image ID

    Returns:
    dict: {
        "discordID": str,
        "avatarURL": str,
        "avatarHash": str or None,
        "isAnimated": bool,
        "note": str or None
    }

    Raises:
        400: Missing image 'id' parameter
        401: Discord API key not found or missing
        404: Image with ID '{image_id}' not found
        429: Rate limit hit on Discord API
        500: Internal server error during API request to Discord
    """
    image_id = request.args.get('id')
    if not image_id:
        return jsonify({"error": "Missing image 'id' parameter"}), 400

    images = load_images()
    img = next((i for i in images if str(i.get("id")) == str(image_id)), None)

    if not img:
        return jsonify({"error": f"Image with ID '{image_id}' not found"}), 404

    discord_id = img.get('discordID')

    if not discord_id:
        return jsonify({"error": f"Image with ID '{image_id}' has no associated discordID"}), 404

    # Discord API endpoint for a User resource
    DISCORD_API_URL = f"https://discord.com/api/v10/users/{discord_id}"
    
    # Headers must include the Authorization header with the bot token
    headers = {
        "Authorization": f"Bot {DISCORD_API_KEY}",
        "User-Agent": "DiscordAvatarFetcher (https://world.zcraftelite.net, v1)"
    }

    if not DISCORD_API_KEY:
        return jsonify({"error": "Discord API key not found or missing."}), 401

    try:
        response = requests.get(DISCORD_API_URL, headers=headers)
        
        if response.status_code == 200:
            user_data = response.json()
            avatar_hash = user_data.get('avatar')
            
            if avatar_hash:
                # Determine if the avatar is animated (GIF)
                is_animated = avatar_hash.startswith('a_')
                
                # Construct the CDN URL
                avatar_extension = "gif" if is_animated else "png"
                avatar_url = f"https://cdn.discordapp.com/avatars/{discord_id}/{avatar_hash}.{avatar_extension}?size=128" # Common size
                
                return jsonify({
                    "discordID": discord_id,
                    "avatarURL": avatar_url,
                    "avatarHash": avatar_hash,
                    "isAnimated": is_animated
                })
            else:
                # User has the default avatar, which is determined by their ID modulo 6
                # https://cdn.discordapp.com/embed/avatars/0.png through 5.png
                try:
                    default_index = int(discord_id) % 6
                    default_avatar_url = f"https://cdn.discordapp.com/embed/avatars/{default_index}.png"
                except ValueError:
                    # Fallback for non-integer discordID (should not happen for User IDs)
                    default_avatar_url = "https://discord.com/assets/26d246c433c2a637ba23c914b434b9d0.png"
                
                return jsonify({
                    "discordID": discord_id,
                    "avatarURL": default_avatar_url,
                    "avatarHash": None,
                    "isAnimated": False,
                    "note": "User has the default avatar."
                })

        elif response.status_code == 404:
            return jsonify({"error": f"Discord user with ID '{discord_id}' not found."}), 404
        elif response.status_code == 429:
            return jsonify({"error": "Rate limit hit on Discord API. Try again later."}), 429
        else:
            logging.error(f"Discord API error for ID {discord_id}: {response.status_code} - {response.text}")
            return jsonify({"error": f"Failed to fetch from Discord API. Status: {response.status_code}"}), 500

    except requests.exceptions.RequestException as e:
        logging.exception(f"HTTP request failed: {e}")
        return jsonify({"error": "Internal server error during API request to Discord."}), 500


# ---- MAIN PROGRAM LOOP ----
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000, debug=True)
