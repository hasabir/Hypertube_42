import requests

import requests
from bs4 import BeautifulSoup

# def search_legittorrents(query):
#     try:
#         res = requests.get(
#             "https://legittorrents.info/index.php",
#             params={"page": "torrents", "search": query},
#             timeout=10
#         )
#         res.raise_for_status()
#     except requests.RequestException:
#         raise requests.RequestException("Legittorrents request failed")
#     except ValueError:
#         raise ValueError("Legittorrents returned invalid response")

#     soup = BeautifulSoup(res.text, "html.parser")
#     results = []

#     # find the results table
#     table = soup.find("table", {"id": "torrents_table"})
#     if not table:
#         return []

#     for row in table.find_all("tr")[1:]:  # skip header row
#         cols = row.find_all("td")
#         if len(cols) < 3:
#             continue

#         title_tag = cols[0].find("a")
#         if not title_tag:
#             continue

#         title     = title_tag.text.strip()
#         detail_url = "https://legittorrents.info/" + title_tag["href"]

#         results.append({
#             "title":       title,
#             "year":        None,      # legittorrents rarely shows year in list
#             "torrent_url": detail_url, # you fetch the actual .torrent from detail page
#             "source":      "legittorrents"
#         })

#     return results[:20]


# def search_yts(query):
# def search_legittorrents(query):
#     try:
#         res = requests.get(
#             "https://yts.mx/api/v2/list_movies.json",
#             params={
#                 "query_term": query,
#                 "limit":      20,
#                 "sort_by":    "seeds"
#             },
#             timeout=10
#         )
#         res.raise_for_status()
#         data = res.json()
#     except requests.RequestException:
#         raise requests.RequestException("YTS request failed")
#     except ValueError:
#         raise ValueError("YTS returned invalid response")

#     movies = data.get("data", {}).get("movies", [])
#     results = []

#     for movie in movies:
#         # pick the best torrent quality available
#         torrents = movie.get("torrents", [])
#         torrent  = next(
#             (t for t in torrents if t["quality"] == "1080p"),
#             torrents[0] if torrents else None
#         )

#         results.append({
#             "title":        movie.get("title"),
#             "year":         movie.get("year"),
#             "imdb_id":      movie.get("imdb_code"),
#             "imdb_rating":  movie.get("rating"),
#             "cover_image":  movie.get("large_cover_image"),
#             "torrent_hash": torrent["hash"] if torrent else None,
#             "torrent_url":  torrent["url"]  if torrent else None,
#             "source":       "yts"
#         })

#     return results






# def search_public_domain_torrents(query):
def search_legittorrents(query):
    try:
        res = requests.get(
            "https://www.publicdomaintorrents.info/nshowcat.html",
            timeout=10
        )
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(res.text, "html.parser")
        results = []
        for link in soup.find_all("a", href=True):
            title = link.text.strip()
            if query.lower() in title.lower() and len(title) > 3:
                results.append({
                    "title":        title,
                    "year":         None,
                    "torrent_url":  "https://www.publicdomaintorrents.info/" + link["href"],
                    "torrent_hash": None,
                    "source":       "publicdomaintorrents",
                })
            print(f"🤌🤌🤌🤌🤌 title = {title}")
        return results[:20]
    except requests.RequestException:
        raise requests.RequestException("Legittorrents request failed")
    except ValueError:
        raise ValueError("Legittorrents returned invalid response")