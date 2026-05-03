

import requests

import re


def search_archive_org(query):
    try:
        res = requests.get(
            "https://archive.org/advancedsearch.php",
            params={
                # restrict to feature films and short films only
                # "q":      f'title:({query}) AND mediatype:movies AND subject:(film OR "silent film" OR "feature film" OR "short film" OR cinema)',
                "q":      f'{query}) AND mediatype:movies',
                "fl[]":   ["identifier", "title", "year", "description"],
                "rows":   50,
                "output": "json",
                "sort[]": "downloads desc",# most downloaded first = more likely real films
            },
            timeout=10
        )
        res.raise_for_status()
    except requests.RequestException:
        return []

    items = res.json().get("response", {}).get("docs", [])

    # patterns that clearly indicate non-film content
    skip_patterns = [
        r'SFGTV', r'CSPAN', r'WHHITV', r'MMCTV', r'TV\d+',
        r'\d{1,2}/\d{1,2}/\d{2,4}',        # dates like 2/8/17
        r'\d+:\d+[ap]m',                     # times like 5:30pm
        r'(police|commission|council|board|meeting|forum|hearing)',
        r'(lecture|talk|interview|sermon|webinar|podcast)',
        r'(news|live:|Q&A|episode|instagram|youtube)',
        r'(memorial day|town hall|veterans day)',
    ]

    import re
    results = []

    for item in items:
        title = item.get("title", "") or ""

        # skip non-film content
        if any(re.search(p, title, re.IGNORECASE) for p in skip_patterns):
            continue

        # skip very long titles — hopefully real film titles are short
        if len(title) > 100:
            continue

        identifier  = item.get("identifier", "")
        torrent_url = f"https://archive.org/download/{identifier}/{identifier}_archive.torrent"

        
        
        results.append({
            "title":       title,
            "year":        item.get("year"),
            "torrent_url": torrent_url,
            "torrent_hash": None,
            "source":      "archive.org",
        })

        if len(results) >= 20:
            break
    return results






def search_archive_org_feature_films(query=""):
    try:
        q = f'title:({query}) AND collection:feature_films' if query else 'collection:feature_films'
        res = requests.get(
            "https://archive.org/advancedsearch.php",
            params={
                "q":      q,
                "fl[]":   ["identifier", "title", "year"],
                "rows":   20,
                "output": "json",
                "sort[]": "downloads desc",
            },
            timeout=10
        )
        res.raise_for_status()
        items = res.json().get("response", {}).get("docs", [])
    except requests.RequestException:
        return []

    results = []
    for item in items:
        title = item.get("title", "") or ""
        if not title or len(title) > 100:
            continue
        identifier = item.get("identifier", "")
        results.append({
            "title":        title,
            "year":         item.get("year"),
            "torrent_url":  f"https://archive.org/download/{identifier}/{identifier}_archive.torrent",
            "torrent_hash": None,
            "source":       "archive.org/feature_films",
        })
    return results

