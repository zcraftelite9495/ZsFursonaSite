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
    Finds the next available top-level ID (alternates use their own 3-digit counter).

    Args:
        art_list (list): A list of art data dictionaries.

    Returns:
        int: The next available ID.
    """
    if not art_list:
        return 1000000
    return max(item["id"] for item in art_list) + 1


def find_next_alt_id(parent_entry):
    """Returns the next 3-digit zero-padded string alt ID unique within a parent."""
    existing = [a.get("id") for a in parent_entry.get("alternates", [])]
    max_num  = max((int(x) for x in existing if str(x).isdigit()), default=0)
    return f"{max_num + 1:03d}"


def find_by_id(art_list, target_id):
    """
    Find an entry by ID, searching both top-level and nested alternates.
    Accepts integer IDs for top-level entries and 'NNNNN-001' composite strings
    for alternates.

    Returns:
        tuple: (parent_entry, alt_entry_or_None). (None, None) if not found.
    """
    target_str = str(target_id)
    if '-' in target_str:
        parts = target_str.rsplit('-', 1)
        try:
            parent_int = int(parts[0])
            alt_sub    = parts[1]
        except ValueError:
            return None, None
        for entry in art_list:
            if entry.get("id") == parent_int:
                for alt in entry.get("alternates", []):
                    if str(alt.get("id")) == alt_sub:
                        return entry, alt
        return None, None
    try:
        target_int = int(target_str)
    except ValueError:
        return None, None
    for entry in art_list:
        if entry.get("id") == target_int:
            return entry, None
    return None, None

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

    mainCharacter = prompt_input("Main Character", default="Z")
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
        "mainCharacter": mainCharacter,
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
        target["mainCharacter"] = prompt_input("Main Character", default=target.get("mainCharacter", "Z"))
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
    Remove an artwork or alternate from the list with the given ID.

    Args:
        args (argparse.Namespace): An object containing the ID of the artwork to remove.
    """
    art_list = load_art()
    parent, alt = find_by_id(art_list, args.id)
    if not parent:
        print(f"Artwork with ID {args.id} not found.")
        return

    if alt is not None:
        alt_sub = str(alt.get("id"))
        parent["alternates"] = [a for a in parent.get("alternates", []) if str(a["id"]) != alt_sub]
        save_art(art_list)
        print(f"✅ Alternate {args.id} removed from parent #{parent['id']}.")
    else:
        art_list[:] = [a for a in art_list if a["id"] != parent["id"]]
        save_art(art_list)
        print(f"✅ Artwork ID {args.id} removed.")


def add_alternate(args):
    """Add an alternate version to an existing artwork."""
    art_list = load_art()
    parent, _ = find_by_id(art_list, args.parent_id)
    if not parent:
        print(f"❌ Parent artwork ID {args.parent_id} not found.")
        return

    print(f"\nAdding alternate to: [{parent['id']}] {parent.get('artName') or parent.get('shapeshiftForm', '')}")

    filename = prompt_input("  Image filename (must exist in static/images/)")
    label    = prompt_input("  Version label", default="Alternate Version")
    is_nsfw  = yes_no("  NSFW?", default=False)
    is_ai    = yes_no("  AI Generated?", default=False)
    ai_model = prompt_input("  AI Model name", default=None, required=False) if is_ai else None
    is_disc  = yes_no("  Available as Discord Emoji?", default=False)
    no_dl    = yes_no("  Disable download?", default=False)

    alt_id   = find_next_alt_id(parent)
    stripped = Path(filename).stem

    alt_entry = {
        "id":              alt_id,
        "filename":        filename,
        "strippedFilename": stripped,
        "filetype":        f"image/{Path(filename).suffix.lstrip('.')}",
        "label":           label,
        "isAI":            is_ai,
        "isNSFW":          is_nsfw,
        "isDiscEmoji":     is_disc,
        "disableDownload": no_dl,
        "aiModel":         ai_model,
    }

    if "alternates" not in parent:
        parent["alternates"] = []
    parent["alternates"].append(alt_entry)
    save_art(art_list)
    full_alt_id = f"{parent['id']}-{alt_id}"
    print(f"✅ Alternate {full_alt_id} added to artwork #{parent['id']}.")


def edit_alternate(args):
    """Edit an existing alternate version by ID."""
    art_list = load_art()
    parent, alt = find_by_id(art_list, args.id)

    if not parent or alt is None:
        print(f"❌ Alternate ID {args.id} not found.")
        return

    print(f"\nEditing alternate [{alt['id']}] '{alt.get('label', '')}' of artwork #{parent['id']}")

    alt["label"]           = prompt_input("  Label", default=alt.get("label", "Alternate Version"))
    alt["isNSFW"]          = yes_no("  NSFW?",                    default=alt.get("isNSFW", False))
    alt["isAI"]            = yes_no("  AI Generated?",             default=alt.get("isAI", False))
    alt["aiModel"]         = prompt_input("  AI Model", default=alt.get("aiModel", ""), required=False) if alt["isAI"] else None
    alt["isDiscEmoji"]     = yes_no("  Discord Emoji?",           default=alt.get("isDiscEmoji", False))
    alt["disableDownload"] = yes_no("  Disable download?",        default=alt.get("disableDownload", False))

    save_art(art_list)
    print(f"✅ Alternate ID {alt['id']} updated.")

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
    remove_parser = subparsers.add_parser("remove", help="Remove an artwork or alternate")
    remove_parser.add_argument("id", help="ID of the artwork (integer) or alternate (e.g. 10000041-001)")

    # Add alternate
    alt_add_parser = subparsers.add_parser("alt-add", help="Add an alternate version to an existing artwork")
    alt_add_parser.add_argument("parent_id", type=int, help="ID of the parent artwork")

    # Edit alternate
    alt_edit_parser = subparsers.add_parser("alt-edit", help="Edit an existing alternate version")
    alt_edit_parser.add_argument("id", help="Composite ID of the alternate (e.g. 10000041-001)")

    args = parser.parse_args()

    if args.command == "add":
        add_artwork(args)
    elif args.command == "list":
        list_artwork(args)
    elif args.command == "edit":
        edit_artwork(args)
    elif args.command == "remove":
        remove_artwork(args)
    elif args.command == "alt-add":
        add_alternate(args)
    elif args.command == "alt-edit":
        edit_alternate(args)

if __name__ == "__main__":
    main()