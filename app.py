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
from pathlib import Path
from PIL import Image, ImageOps
from flask import Flask, render_template, jsonify, request, make_response, send_file, send_from_directory
import json, random

app = Flask(__name__)

# ---- Definitions ----
BASE_DIR = Path(__file__).parent
STATIC_IMAGES_DIR = BASE_DIR / "static" / "images"
THUMBS_DIR = STATIC_IMAGES_DIR / "thumbs"
THUMBS_DIR.mkdir(parents=True, exist_ok=True)

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
                # auto height based on width while keeping aspect ratio
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


# ---- API ENDPOINTS ----
# --- ART DATABASE ---
@app.route('/art.json')
def art_database():
    return send_file('./data/art.json', mimetype='application/json')

# ---- MAIN PROGRAM LOOP ----
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000, debug=True)
