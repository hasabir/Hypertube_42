from .sources.archive_org import search_archive_org
from .sources.legittorrents import search_public_domain_torrents
from .sources.archive_org import search_archive_org_feature_films
from .metadata import enrich_with_omdb
from .models import Movie


def search_and_save_movies(query):
    """
    Query external sources, enrich with OMDb, save to DB.
    Returns a queryset of Movie objects.
    """
    # 1. fetch from both sources
    results =  search_public_domain_torrents(query) + search_archive_org(query) + search_archive_org_feature_films(query)
    metadata = []
    # 2. for each result, save to DB if not already there
    for data in results:
        title = data["title"]
        if not title:
            continue

        movie, created = Movie.objects.get_or_create(title=title)

        # always write source-level fields so they stay fresh
        movie.torrent_hash = data.get("torrent_hash") or movie.torrent_hash
        movie.torrent_url = data.get("torrent_url", "") or movie.torrent_url
        movie.source = data.get("source", "")
        if data.get("year") and not movie.year:
            try:
                movie.year = int(data["year"])
            except (ValueError, TypeError):
                pass

        # 3. enrich with OMDb metadata only when not yet enriched
        if created or not movie.imdb_rating:
            print(f"🤬🤬🤬 Enriching '{title} | {data.get('year')}' with OMDb...")
            meta = enrich_with_omdb(title, data.get("year"))
            print(f"OMDb result for '{title}': {meta}")
            if meta:
                for field, value in meta.items():
                    setattr(movie, field, value)
                metadata.append(meta)

        movie.save()

    # 4. return DB queryset filtered by search term
    return Movie.objects.filter(title__icontains=query)




def get_popular_movies():
    print("Fetching popular movies...")
    if Movie.objects.count() == 0:
        # fetch a default set of popular public domain films
        results = (
            search_archive_org_feature_films("") + search_archive_org("chaplin nosferatu keaton")
        )
        for data in results:
            movie, created = Movie.objects.get_or_create(
                title=data["title"],
                source=data.get("source", ""),
                defaults={"torrent_url": data.get("torrent_url", "")}
            )
            if created:
                meta = enrich_with_omdb(data["title"], data.get("year"))
                if meta:
                    for field, value in meta.items():
                        setattr(movie, field, value)
                    movie.save()

    return Movie.objects.all().order_by("-view_count")




# def get_popular_movies():
#     """
#     No search query — return most popular from DB.
#     If DB is empty, fetch from sources first.
#     """
#     print("Fetching popular movies...")
#     if Movie.objects.count() == 0:
#         results = search_public_domain_torrents("")
#         # results = search_archive_org("") # + search_public_domain_torrents("")
#         for data in results:
#             Movie.objects.get_or_create(
#                 title=data["title"],
#                 defaults={"torrent_hash": data.get("torrent_hash", "")}
#             )

#     return Movie.objects.all().order_by("-view_count")

