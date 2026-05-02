import requests
import os

import re



def enrich_with_omdb(title, year=None):
    params = {
        "apikey": os.getenv("OMDB_API_KEY", "753d5559"),
        "t": title,
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

    raw_year = data.get("Year", "")
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
    

