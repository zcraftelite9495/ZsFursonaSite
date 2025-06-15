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

from flask import Flask, render_template, jsonify
import json, random

app = Flask(__name__)

# ---- FUNCTIONS ----
# --- IMAGE LOADER ---
def load_images():
    with open('data/art.json') as f:
        return json.load(f)


# ---- ROUTES ----
# --- HOMEPAGE ---
@app.route('/')
def index():
    images = load_images()
    random_images = random.sample(images, min(4, len(images)))
    return render_template('index.html', images=random_images)

# ---- LIBRARY PAGE ----
@app.route('/library')
def library():
    images = load_images()
    return render_template('library.html', images=images)


# ---- API ENDPOINTS ----
# --- IMAGE API ---
@app.route('/api/images')
def images_api():
    return jsonify(load_images())


# ---- MAIN PROGRAM LOOP ----
if __name__ == '__main__':
    app.run(debug=True)
