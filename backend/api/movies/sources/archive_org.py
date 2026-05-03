# import requests


# def search_archive_org(query):
#     try:
#         res = requests.get(
#             "https://archive.org/advancedsearch.php",
#             params={
#                 # restrict to feature films and short films only
#                 "q":      f'title:({query}) AND mediatype:movies AND subject:(film OR "silent film" OR "feature film" OR "short film" OR cinema)',
#                 "fl[]":   ["identifier", "title", "year", "description"],
#                 "rows":   50,
#                 "output": "json",
#                 "sort[]": "downloads desc",# most downloaded first = more likely real films
#             },
#             timeout=10
#         )
#         res.raise_for_status()
#     except requests.RequestException:
#         return []

#     items = res.json().get("response", {}).get("docs", [])

#     # patterns that clearly indicate non-film content
#     skip_patterns = [
#         r'SFGTV', r'CSPAN', r'WHHITV', r'MMCTV', r'TV\d+',
#         r'\d{1,2}/\d{1,2}/\d{2,4}',        # dates like 2/8/17
#         r'\d+:\d+[ap]m',                     # times like 5:30pm
#         r'(police|commission|council|board|meeting|forum|hearing)',
#         r'(lecture|talk|interview|sermon|webinar|podcast)',
#         r'(news|live:|Q&A|episode|instagram|youtube)',
#         r'(memorial day|town hall|veterans day)',
#     ]

#     import re
#     results = []

#     for item in items:
#         title = item.get("title", "") or ""

#         # skip non-film content
#         if any(re.search(p, title, re.IGNORECASE) for p in skip_patterns):
#             continue

#         # skip very long titles — real film titles are short
#         if len(title) > 100:
#             continue

#         identifier  = item.get("identifier", "")
#         torrent_url = f"https://archive.org/download/{identifier}/{identifier}_archive.torrent"

#         results.append({
#             "title":       title,
#             "year":        item.get("year"),
#             "torrent_url": torrent_url,
#             "torrent_hash": None,
#             "source":      "archive.org",
#         })

#         if len(results) >= 20:
#             break

#     return results



import requests

import re

# def clean_title(raw):
#     year = None

#     # Extract year from parentheses and drop everything after the closing paren
#     # e.g. "The Fireman (1916) Charlie Chaplin" -> title="The Fireman", year="1916"
#     m = re.search(r'\((\d{4})\)', raw)
#     if m:
#         year = m.group(1)
#         raw = raw[:m.start()]  # keep only what's before the opening paren

#     # Remove anything still in parentheses or brackets
#     raw = re.sub(r'\(.*?\)', ' ', raw)
#     raw = re.sub(r'\[.*?\]', ' ', raw)

#     # Cut at separator characters that split title from extra info
#     raw = re.split(r'[:\-|]', raw)[0]

#     # Remove common non-title noise words
#     noise = r'\b(full\s+movie|hd|sd|720p|1080p|2160p|4k|hdr|webrip|bluray|dvdrip|hdtv|xvid|x264|x265|hevc|aac|mp4|avi|mkv)\b'
#     raw = re.sub(noise, ' ', raw, flags=re.IGNORECASE)

#     # Normalize whitespace
#     raw = re.sub(r'\s+', ' ', raw).strip()

#     # Strip leading/trailing non-alphanumeric characters
#     raw = re.sub(r'^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$', '', raw)

#     return raw, year


def search_archive_org(query):
    try:
        res = requests.get(
            "https://archive.org/advancedsearch.php",
            params={
                # restrict to feature films and short films only
                "q":      f'title:({query}) AND mediatype:movies AND subject:(film OR "silent film" OR "feature film" OR "short film" OR cinema)',
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

        # skip very long titles — real film titles are short
        if len(title) > 100:
            continue

        identifier  = item.get("identifier", "")
        torrent_url = f"https://archive.org/download/{identifier}/{identifier}_archive.torrent"


        print(f"-----------------------------> raw title: {title}")
        # clean, year = clean_title(title)
        # clean_title = re.sub(r'\s*\(.*?\)\s*', '', title).strip()  
        # print("-----------------------------> cleaned title:", clean, "year:", year)
        print("###########################################################")        
        # if not clean_title:
        #     continue
        
        
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