import requests

import requests


def search_public_domain_torrents(query):
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
        return results[:20]
    except requests.RequestException:
        raise requests.RequestException("public domain torrents request failed")
    except ValueError:
        raise ValueError("public domain torrents returned invalid response")