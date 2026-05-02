from .sources.archive_org import search_archive_org
# from .sources.legittorrents import search_legittorrents
from .metadata import enrich_with_omdb
from .models import Movie

def search_and_save_movies(query):
    """
    Query external sources, enrich with OMDb, save to DB.
    Returns a queryset of Movie objects.
    """
    # 1. fetch from both sources
    results = search_archive_org(query) # + search_legittorrents(query)

    # 2. for each result, save to DB if not already there
    for data in results:
        movie, created = Movie.objects.get_or_create(
            title=data["title"],
            defaults={"torrent_hash": data.get("torrent_hash", "")}
        )

        # 3. if newly created, enrich with OMDb metadata
        # if created:
        meta = enrich_with_omdb(data["title"], data.get("year"))
        print(f"OMDb result for '{data['title']}': {meta}")
        # if meta and meta.get("imdb_rating"):
        #     print(f"OMDb rating for '{data['title']}': {meta['imdb_rating']}")
        if meta:
            for field, value in meta.items():
                setattr(movie, field, value)
            movie.save()

    # 4. return DB queryset filtered by search term
    return Movie.objects.filter(title__icontains=query)


def get_popular_movies():
    """
    No search query — return most popular from DB.
    If DB is empty, fetch from sources first.
    """
    if Movie.objects.count() == 0:
        results = search_archive_org("") # + search_legittorrents("")
        for data in results:
            Movie.objects.get_or_create(
                title=data["title"],
                defaults={"torrent_hash": data.get("torrent_hash", "")}
            )

    return Movie.objects.all().order_by("-view_count")

