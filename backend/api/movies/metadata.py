import requests
import os

import re

def clean_title(raw):
    year = None

    # Extract year from parentheses and drop everything after the closing paren
    # e.g. "The Fireman (1916) Charlie Chaplin" -> title="The Fireman", year="1916"
    m = re.search(r'\((\d{4})\)', raw)
    if m:
        year = m.group(1)
        raw = raw[:m.start()]  # keep only what's before the opening paren

    # Remove anything still in parentheses or brackets
    raw = re.sub(r'\(.*?\)', ' ', raw)
    raw = re.sub(r'\[.*?\]', ' ', raw)

    # Cut at separator characters that split title from extra info
    raw = re.split(r'[:\-|]', raw)[0]

    # Remove common non-title noise words
    noise = r'\b(full\s+movie|hd|sd|720p|1080p|2160p|4k|hdr|webrip|bluray|dvdrip|hdtv|xvid|x264|x265|hevc|aac|mp4|avi|mkv)\b'
    raw = re.sub(noise, ' ', raw, flags=re.IGNORECASE)

    # Normalize whitespace
    raw = re.sub(r'\s+', ' ', raw).strip()

    # Strip leading/trailing non-alphanumeric characters
    raw = re.sub(r'^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$', '', raw)

    return raw, year

def enrich_with_omdb(title, year=None):
    clean, year = clean_title(title)
    params = {
        "apikey": os.getenv("OMDB_API_KEY", "753d5559"),
        "t": clean,
        "language": "en"
    }
    if year:
        params["y"] = year

    res = requests.get("http://www.omdbapi.com/", params=params)
    data = res.json()
    # print(f"OMDb response for '{title}': {data}")
    if data.get("Response") == "False":
        print(f"********* OMDb error for '{title}': {data.get('Error')}")
        return {}

    raw_year = data.get("Year", str(year) if year else "")
    year_val = int(raw_year[:4]) if raw_year and raw_year[:4].isdigit() else None

    return {
        "imdb_rating": float(data.get("imdbRating", 0) or 0) if data.get("imdbRating", "N/A") != "N/A" else None,
        "genre":       data.get("Genre", ""),
        "director":    data.get("Director", ""),
        "cast":        data.get("Actors", ""),
        "summary":     data.get("Plot", ""),
        "cover_image": data.get("Poster", ""),
        "runtime":     data.get("Runtime", ""),
        "year":        year_val,
    }
    

