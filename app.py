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

# --- MY FAVORITE THINGS PAGE ---
@app.route('/favs')
def favs():
    return render_template('favs.html')

# --- SPECIFIC IMAGE VIEW PAGE ---
@app.route('/view/<image_id>')
def view_image(image_id):
    images = load_images()
    img = next((i for i in images if str(i.get("id")) == str(image_id)), None)

    if not img:
        return render_template("404.html"), 404

    meta = {
        "title": f"Z's World - Art - {img['artName'] or img['shapeshiftForm']}",
        "description": "",
        "url": f"https://zcraftelite.net/view/{image_id}",
        "image": url_for("static", filename=f"images/thumbs/{img['strippedFilename']}.webp", _external=True),
        "redirect": url_for("library", id=image_id, _external=True)
    }

    if img['isAI']:
        meta["description"] = f"Generated by {img.get('artist', 'Unknown')}"
        meta = adapt_meta_desc(meta, f"Generated using {img.get('aiModel', 'Unknown Model')}")
    else:
        meta["description"] = f"Created by {img.get('artist', 'Unknown')}"

    meta = adapt_meta_desc(meta, f"Created on {img.get('creationDate', 'Unknown Date')}")

    return render_template("share.html", meta=meta, image=img)

@app.route('/embed/<image_id>')
def embed_image(image_id):
    images = load_images()
    img = next((i for i in images if str(i.get("id")) == str(image_id)), None)
    if not img:
        return render_template("404.html"), 404
    return render_template("embed.html", ID=image_id, image=img)

# ---- API ENDPOINTS ----
# --- ART DATABASE ---
@app.route('/art.json')
def art_database():
    return send_file('./data/art.json', mimetype='application/json')

# --- OAUTH LOGIN ENDPOINT ---
@app.route('/api/v1/oauth/login')
def oauth_login():
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
