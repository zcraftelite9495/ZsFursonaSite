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

from flask import Flask, render_template, jsonify, request, make_response
import json, random

app = Flask(__name__)

# ---- FUNCTIONS ----
# --- IMAGE LOADER ---
def load_images():
    with open('data/art.json') as f:
        return json.load(f)

# --- SET COOKIE ---
def set_cookie(response, key, value, days=7):
    response.set_cookie(key, value, max_age=days * 86400)

# --- FETCH COOKIE ---
def get_cookie(key):
    return request.cookies.get(key)

# --- FILTER IMAGES BY COOKIE ---
def filter_images(images):
    show_ai = get_cookie('showAI')
    show_nsfw = get_cookie('showNSFW')
    if show_nsfw not in ['true', 'True', '1']:  # treat any other value as false
        images = [img for img in images if not img.get('isNSFW', False)]
    if show_ai not in ['true', 'True', '1']:  # treat any other value as false
        images = [img for img in images if not img.get('isAI', False)]
    return images


# ---- ROUTES ----
# --- HOMEPAGE ---
@app.route('/')
def index():
    images = filter_images(load_images())
    random_images = random.sample(images, min(4, len(images)))
    return render_template('index.html', images=random_images)

# --- LIBRARY PAGE ---
@app.route('/library')
def library():
    images = filter_images(load_images())
    return render_template('library.html', images=images)


# ---- API ENDPOINTS ----
# --- IMAGE API ---
@app.route('/api/images')
def images_api():
    images = filter_images(load_images())
    return jsonify(images)

# ---- MAIN PROGRAM LOOP ----
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000, debug=True)
