#!/usr/bin/env python3
import json
import os
import argparse
from pathlib import Path

# ---- Constants ----
DATA_DIR = Path("data")
ART_FILE = DATA_DIR / "art.json"
IMAGE_DIR = Path("static/images")

# ---- Ensure directories exist ----
DATA_DIR.mkdir(exist_ok=True)
IMAGE_DIR.mkdir(parents=True, exist_ok=True)

def load_art():
    """
    Loads the art data from the `ART_FILE`.

    Returns:
        list: A list of art data dictionaries loaded from the `ART_FILE`.
    """
    if ART_FILE.exists():
        with open(ART_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def save_art(art_list):
    """
    Saves the given art data to the `ART_FILE`.

    Args:
        art_list (list): A list of art data dictionaries to be saved.

    Returns:
        None
    """
    with open(ART_FILE, "w", encoding="utf-8") as f:
        json.dump(art_list, f, indent=4, ensure_ascii=False)

def find_next_id(art_list):
    """
    Finds the next available ID in the given art list.

    If the art list is empty, returns `1000000`. Otherwise, returns the maximum ID in the list plus one.

    Args:
        art_list (list): A list of art data dictionaries.

    Returns:
        int: The next available ID in the art list.
    """
    if not art_list:
        return 1000000
    return max(item["id"] for item in art_list) + 1

def validate_filename(filename):
    """
    Validates if the given filename exists in the `IMAGE_DIR`.

    Args:
        filename (str): The filename to be validated.

    Raises:
        ValueError: If the filename does not exist in the `IMAGE_DIR`.
    """
    if not (IMAGE_DIR / filename).exists():
        raise ValueError(f"Image file not found in {IMAGE_DIR}: {filename}")

def prompt_input(prompt, default=None, required=True):
    """
    Prompts the user for input with an optional default value and required flag.

    Args:
        prompt (str): The prompt to be displayed to the user.
        default (str): The default value to be returned if the user does not enter a value. Defaults to None.
        required (bool): Whether the input field is required. Defaults to True.

    Returns:
        str: The user's input, or the default value if the user did not enter a value and default is not None.
    """
    while True:
        display_default = f" [{default or ''}]" if default is not None else ""
        value = input(f"{prompt}{display_default}: ").strip()
        if not value and default is not None:
            return default
        if not value and required:
            print("This field is required.")
            continue
        return value

def yes_no(prompt, default=None):
    """
    Prompts the user for a yes/no input with an optional default value.

    Args:
        prompt (str): The prompt to be displayed to the user.
        default (str): The default value to be returned if the user does not enter a value. Defaults to None.

    Returns:
        bool: True if the user enters 'y' or 'yes', False if the user enters 'n' or 'no'.

    Raises:
        ValueError: If the user does not enter 'y' or 'n'.
    """
    while True:
        display_default = f" (y/n) [{default or ''}]" if default is not None else " (y/n)"
        value = input(f"{prompt}{display_default}: ").strip().lower()
        if not value and default is not None:
            value = default
        if value in ("y", "yes"):
            return True
        elif value in ("n", "no"):
            return False
        else:
            print("Please enter 'y' or 'n'.")

def add_artwork(args):
    """
    Adds a new artwork to the data file.

    Args:
        args (Namespace): The parsed command line arguments.

    Returns:
        None
    """
    art_list = load_art()

    print("=== Add New Artwork ===")
    filename = prompt_input("Filename (must exist in ./static/images)", required=True)
    validate_filename(filename)

    title = prompt_input("Title", default=filename)
    strippedFilename = prompt_input("Stripped Filename", default=filename.rsplit(".", 1)[0])
    filetype = prompt_input("Filetype (e.g., image/png)", default="image/png")
    
    isAI = yes_no("Is this AI-generated?", default="y")
    isNSFW = yes_no("Is this NSFW?", default="n")
    isDiscEmoji = yes_no("Is this a Discord emoji?", default="n")

    aiModel = None
    if isAI:
        aiModel = prompt_input("AI Model", default="Sora 1.0 Turbo")

    artist = prompt_input("Artist", required=True)
    artistPic = prompt_input("Artist Pic (filename in ./static/images/artists/ or 'discord')", default="discord")
    discordID = ""
    if artistPic == "discord":
        discordID = prompt_input("Discord ID", required=True)

    shapeshiftForm = prompt_input("Shapeshift Form", default="") + " Form"
    characters_input = prompt_input("Characters (comma-separated)", default="")
    characters = [c.strip() for c in characters_input.split(",")] if characters_input else []
    artName = prompt_input("Art Name", default="")
    creationDate = prompt_input("Creation Date (YYYY-MM-DD)", default="")
    
    recievalMethod = prompt_input("Recieval Method", default="Self Made")
    recievalPrice = None
    if recievalMethod == "Commission":
        recievalPrice = prompt_input("Recieval Price", required=True)

    disableDownload = yes_no("Disable download?", default="n")

    new_entry = {
        "filename": filename,
        "title": title,
        "strippedFilename": strippedFilename,
        "filetype": filetype,
        "aiModel": aiModel,
        "artist": artist,
        "artistPic": artistPic,
        "discordID": discordID,
        "shapeshiftForm": shapeshiftForm,
        "characters": characters,
        "artName": artName,
        "creationDate": creationDate,
        "recievalMethod": recievalMethod,
        "recievalPrice": recievalPrice,
        "isAI": isAI,
        "isNSFW": isNSFW,
        "isDiscEmoji": isDiscEmoji,
        "disableDownload": disableDownload,
        "id": find_next_id(art_list)
    }

    art_list.append(new_entry)
    save_art(art_list)
    print(f"\n✅ Artwork added with ID: {new_entry['id']}")

def list_artwork(args):
    """
    List artwork based on the given arguments.

    Args:
        args (Namespace): The parsed command line arguments.

    Returns:
        None
    """
    art_list = load_art()
    if not art_list:
        print("No artwork found.")
        return

    filtered = art_list
    if args.id:
        filtered = [a for a in filtered if a["id"] == args.id]
    if args.artist:
        filtered = [a for a in filtered if args.artist.lower() in a["artist"].lower()]
    if args.title:
        filtered = [a for a in filtered if args.title.lower() in a["title"].lower()]
    if args.nsfw is not None:
        filtered = [a for a in filtered if a["isNSFW"] == args.nsfw]

    if not filtered:
        print("No matching artwork.")
        return

    for art in filtered:
        print(f"ID: {art['id']} | Title: {art['title']} | Artist: {art['artist']} | AI: {art['isAI']} | NSFW: {art['isNSFW']}")

def edit_artwork(args):
    """
    Edit an artwork based on the given arguments.

    Args:
        args (Namespace): The parsed command line arguments.

    Returns:
        None
    """
    art_list = load_art()
    target = next((a for a in art_list if a["id"] == args.id), None)
    if not target:
        print(f"Artwork with ID {args.id} not found.")
        return

    print(f"=== Editing Artwork ID {args.id} ===")
    print("Leave blank to keep current value.")

    try:
        filename = prompt_input("Filename", default=target["filename"])
        validate_filename(filename)
        target["filename"] = filename
        target["title"] = prompt_input("Title", default=target["title"])
        target["strippedFilename"] = prompt_input("Stripped Filename", default=target["strippedFilename"])
        target["filetype"] = prompt_input("Filetype", default=target["filetype"])

        isAI = yes_no("Is this AI-generated?", default="y" if target["isAI"] else "n")
        isNSFW = yes_no("Is this NSFW?", default="y" if target["isNSFW"] else "n")
        isDiscEmoji = yes_no("Is this a Discord emoji?", default="y" if target["isDiscEmoji"] else "n")

        aiModel = target.get("aiModel")
        if isAI:
            aiModel = prompt_input("AI Model", default=aiModel or "Sora 1.0 Turbo")
        else:
            aiModel = None

        target["isAI"] = isAI
        target["isNSFW"] = isNSFW
        target["isDiscEmoji"] = isDiscEmoji
        target["aiModel"] = aiModel

        target["artist"] = prompt_input("Artist", default=target["artist"])
        artistPic = prompt_input("Artist Pic", default=target["artistPic"])
        target["artistPic"] = artistPic
        if artistPic == "discord":
            target["discordID"] = prompt_input("Discord ID", default=target.get("discordID", ""))
        else:
            target["discordID"] = ""

        target["shapeshiftForm"] = prompt_input("Shapeshift Form", default=target["shapeshiftForm"])
        chars = prompt_input("Characters (comma-separated)", default=", ".join(target["characters"]))
        target["characters"] = [c.strip() for c in chars.split(",")] if chars else []
        target["artName"] = prompt_input("Art Name", default=target["artName"])
        target["creationDate"] = prompt_input("Creation Date", default=target["creationDate"])

        recievalMethod = prompt_input("Recieval Method", default=target["recievalMethod"])
        target["recievalMethod"] = recievalMethod
        if recievalMethod == "Commission":
            price = prompt_input("Recieval Price", default=target.get("recievalPrice") or "")
            target["recievalPrice"] = price if price else None
        else:
            target["recievalPrice"] = None

        target["disableDownload"] = yes_no("Disable download?", default="y" if target["disableDownload"] else "n")

        save_art(art_list)
        print("✅ Artwork updated.")
    except KeyboardInterrupt:
        print("\nEdit cancelled.")

def remove_artwork(args):
    """
    Remove an artwork from the list with the given ID.

    Args:
        args (argparse.Namespace): An object containing the ID of the artwork to remove.
    """
    art_list = load_art()
    before_len = len(art_list)
    art_list[:] = [a for a in art_list if a["id"] != args.id]
    if len(art_list) == before_len:
        print(f"Artwork with ID {args.id} not found.")
    else:
        save_art(art_list)
        print(f"✅ Artwork ID {args.id} removed.")

def main():
    parser = argparse.ArgumentParser(description="Manage your art database (art.json)")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Add
    subparsers.add_parser("add", help="Add a new artwork entry")

    # List
    list_parser = subparsers.add_parser("list", help="List artwork entries")
    list_parser.add_argument("--id", type=int, help="Filter by ID")
    list_parser.add_argument("--artist", help="Filter by artist name")
    list_parser.add_argument("--title", help="Filter by title")
    list_parser.add_argument("--nsfw", type=lambda x: x.lower() == "true", help="Filter by NSFW (true/false)")

    # Edit
    edit_parser = subparsers.add_parser("edit", help="Edit an existing artwork")
    edit_parser.add_argument("id", type=int, help="ID of the artwork to edit")

    # Remove
    remove_parser = subparsers.add_parser("remove", help="Remove an artwork")
    remove_parser.add_argument("id", type=int, help="ID of the artwork to remove")

    args = parser.parse_args()

    if args.command == "add":
        add_artwork(args)
    elif args.command == "list":
        list_artwork(args)
    elif args.command == "edit":
        edit_artwork(args)
    elif args.command == "remove":
        remove_artwork(args)

if __name__ == "__main__":
    main()