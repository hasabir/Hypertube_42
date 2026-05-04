"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ProtectedPage } from "@/components/ProtectedPage";
import {
  addVideoComment,
  getVideoDetails,
  getVideoStreamState,
  listVideoComments,
  markVideoViewed,
  type VideoComment,
  type VideoDetails,
  type VideoStreamState,
  type VideoSubtitle,
} from "@/lib/video-api-mock";
import { resolveAvatarSrc } from "@/lib/avatar";
import { useAuth } from "@/providers/AuthProvider";

function meterLabel(value: number): string {
  return `${Math.max(0, Math.min(100, value))}%`;
}

function subtitleAutoLabel(track: VideoSubtitle): string {
  return track.autoSuggested ? `${track.label} (suggested)` : track.label;
}

function formatTimeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / (1000 * 60));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function WatchPage() {
  const params = useParams<{ movieId: string }>();
  const { user } = useAuth();
  const [details, setDetails] = useState<VideoDetails | null>(null);
  const [stream, setStream] = useState<VideoStreamState | null>(null);
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [selectedSubtitle, setSelectedSubtitle] = useState<string>("off");
  const [commentBody, setCommentBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [commenting, setCommenting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const movieId = params.movieId;

  useEffect(() => {
    let cancelled = false;

    async function loadInitial() {
      setLoading(true);
      setError(null);
      const preferredLanguage = user?.language ?? "en";
      const d = await getVideoDetails(movieId, preferredLanguage);
      if (!d) {
        if (!cancelled) {
          setError("Video not found.");
          setLoading(false);
        }
        return;
      }

      const [s, c] = await Promise.all([
        getVideoStreamState(d.id, d.browserReadable),
        listVideoComments(d.id),
      ]);
      if (cancelled) return;
      setDetails(d);
      setStream(s);
      setComments(c);
      const suggested = d.subtitles.find((track) => track.autoSuggested);
      setSelectedSubtitle(suggested?.id ?? "off");
      setLoading(false);
    }

    void loadInitial();
    return () => {
      cancelled = true;
    };
  }, [movieId, user?.language]);

  useEffect(() => {
    if (!details) return;
    let cancelled = false;
    const interval = window.setInterval(() => {
      void getVideoStreamState(details.id, details.browserReadable).then((s) => {
        if (!cancelled) setStream(s);
      });
    }, 1800);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [details]);

  useEffect(() => {
    if (!details || !stream?.readyToStream) return;
    void markVideoViewed(details.id);
  }, [details, stream?.readyToStream]);

  const currentSubtitle = useMemo(() => {
    if (!details) return null;
    return details.subtitles.find((track) => track.id === selectedSubtitle) ?? null;
  }, [details, selectedSubtitle]);

  const avatarSrc = resolveAvatarSrc(user?.avatarUrl);
  const showMovieLoadingState = loading || (!!details && !!stream && !stream.readyToStream);
  const loadingTitle = details?.title ?? "NEBULA DRIFT";
  const loadingYear = details?.year ?? 2024;
  const loadingDuration = details?.durationMin ?? 124;
  const loadingRating = details?.imdbRating ?? 8.9;
  const loadingViews = details?.downloads?.toLocaleString() ?? "1,243";
  const loadingProgress = stream?.downloadPercent ?? 34;
  const loadingBuffer = stream?.bufferingPercent ?? 34;
  const loadingCast = details?.cast ?? ["Elias Thorne", "Sarah J. Vance", "Marcus Reed"];

  const onSubmitComment = async () => {
    if (!details || !user) return;
    setCommenting(true);
    try {
      await addVideoComment(details.id, user.username, commentBody);
      const next = await listVideoComments(details.id);
      setComments(next);
      setCommentBody("");
    } finally {
      setCommenting(false);
    }
  };

  return (
    <ProtectedPage>
      <div className="min-h-screen overflow-x-hidden bg-[#131313] text-[#e5e2e1]">
        <nav className="fixed top-0 z-50 flex h-20 w-full items-center justify-between bg-[#131313]/60 px-8 backdrop-blur-xl">
          <Link href="/" className="text-2xl font-black tracking-tighter text-[#d2bbff]">
            HYPERTUBE
          </Link>
          <div className="flex items-center gap-8">
            <Link href="/library" className="font-medium text-gray-400 transition-colors hover:text-white">
              Library
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/logout" className="font-medium text-gray-400 transition-colors hover:text-white">
                Logout
              </Link>
              <div className="h-10 w-10 overflow-hidden rounded-full bg-[#2a2a2a]">
                <Image src={avatarSrc} alt="" width={40} height={40} className="h-full w-full object-cover" />
              </div>
            </div>
          </div>
        </nav>

        <main className="min-h-screen pt-20">
          <div className="mx-auto max-w-[1440px] px-8 py-12">
            {error ? (
              <div className="rounded-xl border border-[#ffb4ab]/30 bg-[#93000a]/20 p-6">
                <p className="text-sm text-[#ffb4ab]">{error ?? "Could not load the video."}</p>
                <Link href="/library" className="mt-4 inline-block rounded-lg bg-[#2a2a2a] px-4 py-2 text-sm font-semibold">
                  Return to library
                </Link>
              </div>
            ) : showMovieLoadingState ? (
              <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
                <div className="space-y-8 lg:col-span-8">
                  <div className="relative aspect-video overflow-hidden rounded-xl border border-white/5 bg-[#0e0e0e]">
                    <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-[#1c1b1b] via-[#2a2a2a] to-[#1c1b1b]" />
                    <div className="relative z-10 flex h-full flex-col items-center justify-center">
                      <div className="mb-6 h-20 w-20 rounded-full border-4 border-[#353534] border-t-[#7c3aed]" />
                      <h2 className="mb-2 text-xl font-bold tracking-tight text-[#e5e2e1]">
                        Fetching video... {loadingProgress}%
                      </h2>
                      <p className="text-sm font-medium text-[#ccc3d8]">Connecting to peer network</p>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 flex items-center gap-4 bg-gradient-to-t from-black/80 to-transparent p-6">
                      <span className="material-symbols-outlined text-[#e5e2e1]/40">play_arrow</span>
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#353534]">
                        <div className="h-full bg-[#d2bbff]" style={{ width: `${loadingBuffer}%` }} />
                      </div>
                      <span className="material-symbols-outlined text-[#e5e2e1]/40">fullscreen</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-start justify-between gap-6 md:flex-row">
                    <div className="space-y-4">
                      <h1 className="text-5xl font-black tracking-tighter text-[#e5e2e1] sm:text-6xl">{loadingTitle.toUpperCase()}</h1>
                      <div className="flex flex-wrap items-center gap-4 text-sm font-bold uppercase tracking-widest text-[#ccc3d8]">
                        <span>{loadingYear}</span>
                        <span className="h-1 w-1 rounded-full bg-[#d2bbff]" />
                        <span>{loadingDuration} min</span>
                        <span className="rounded border border-[#d2bbff]/20 bg-[#2a2a2a] px-2 py-0.5 text-[#d2bbff]">
                          IMDb {loadingRating.toFixed(1)}
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm">visibility</span>
                          {loadingViews} views
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#2a2a2a] text-[#d2bbff]">
                        <span className="material-symbols-outlined text-2xl">favorite</span>
                      </button>
                      <button className="flex h-14 items-center gap-2 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#5a00c6] px-8 text-sm font-bold text-[#ede0ff]">
                        <span className="material-symbols-outlined">share</span>
                        Share
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#1c1b1b] p-8">
                    <h3 className="mb-4 text-lg font-bold uppercase tracking-widest text-[#d2bbff]">Synopsis</h3>
                    <p className="text-lg font-medium leading-relaxed text-[#ccc3d8]">
                      {details?.summary ??
                        "In the year 2148, a deep-space salvage crew discovers a derelict vessel emitting a mysterious signal from the edge of a collapsing nebula."}
                    </p>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-xl font-bold tracking-tight text-white">
                      Discussion
                      <span className="ml-2 rounded bg-[#2a2a2a] px-2 py-0.5 text-sm font-medium text-[#ccc3d8]">
                        {comments.length || 24} comments
                      </span>
                    </h3>
                    <div className="relative">
                      <input
                        className="h-16 w-full rounded-xl border-none bg-[#0e0e0e] px-6 text-[#e5e2e1] placeholder:text-[#ccc3d8]/50 focus:ring-2 focus:ring-[#d2bbff]/40"
                        placeholder="Share your thoughts on the Void..."
                        readOnly
                        value=""
                      />
                      <button className="absolute bottom-3 right-3 top-3 rounded-lg bg-[#2a2a2a] px-6 text-sm font-bold text-[#d2bbff]">
                        Post
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-8 lg:col-span-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold uppercase tracking-widest text-[#d2bbff]">Top Cast</h3>
                    {loadingCast.slice(0, 3).map((member) => (
                      <div key={member} className="flex items-center gap-4 rounded-xl bg-[#1c1b1b] p-3">
                        <div className="h-14 w-14 rounded-lg bg-[#2a2a2a]" />
                        <div>
                          <h4 className="font-bold text-[#e5e2e1]">{member}</h4>
                          <p className="text-xs text-[#ccc3d8]">as Main cast</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-lg font-bold uppercase tracking-widest text-[#d2bbff]">Configuration</h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-sm font-bold text-[#ccc3d8]">
                        <span className="material-symbols-outlined text-sm">subtitles</span>
                        Subtitles
                      </label>
                      <button className="flex h-14 w-full items-center justify-between rounded-xl bg-[#1c1b1b] px-4 font-medium text-[#e5e2e1]">
                        <span>English (Official)</span>
                        <span className="material-symbols-outlined">expand_more</span>
                      </button>
                    </div>

                    <div className="space-y-4 rounded-xl border border-white/5 bg-[#0e0e0e] p-6">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#ccc3d8]">Quality</span>
                        <span className="font-bold text-[#d2bbff]">4K Ultra HD</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#ccc3d8]">Audio</span>
                        <span className="font-medium text-[#e5e2e1]">Dolby Atmos</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#ccc3d8]">Seeds</span>
                        <span className="font-bold text-emerald-400">{details?.seeders ?? 1842}</span>
                      </div>
                      <div className="border-t border-white/5 pt-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-tighter text-[#ccc3d8]">Buffer Health</span>
                          <span className="text-xs font-bold text-[#d2bbff]">High</span>
                        </div>
                        <div className="h-1 w-full overflow-hidden rounded-full bg-[#353534]">
                          <div className="h-full bg-gradient-to-r from-[#d2bbff] to-emerald-400" style={{ width: `${loadingBuffer}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : !details || !stream ? (
              <div className="rounded-xl border border-[#ffb4ab]/30 bg-[#93000a]/20 p-6">
                <p className="text-sm text-[#ffb4ab]">Could not load the video.</p>
                <Link href="/library" className="mt-4 inline-block rounded-lg bg-[#2a2a2a] px-4 py-2 text-sm font-semibold">
                  Return to library
                </Link>
              </div>
            ) : (
              <>
                <section className="group relative mb-12 aspect-video w-full overflow-hidden rounded-xl bg-[#0e0e0e]">
                  {stream.readyToStream ? (
                    <video controls className="h-full w-full object-cover" poster={details.coverImage} preload="metadata">
                      <source src={details.streamUrl} type="video/mp4" />
                      {currentSubtitle ? (
                        <track
                          default
                          kind="subtitles"
                          label={currentSubtitle.label}
                          src={currentSubtitle.src}
                          srcLang={currentSubtitle.language}
                        />
                      ) : null}
                    </video>
                  ) : (
                    <Image src={details.coverImage} alt="" fill className="object-cover opacity-80" />
                  )}

                  {!stream.readyToStream ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="rounded-xl bg-black/55 px-6 py-4 text-center backdrop-blur-sm">
                        <p className="text-sm font-semibold text-white">
                          Preparing stream ({meterLabel(stream.bufferingPercent)} buffered)
                        </p>
                        <p className="mt-1 text-xs text-[#ccc3d8]">Torrent and transcoding run in background.</p>
                      </div>
                    </div>
                  ) : null}

                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="absolute left-0 top-0 w-full p-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col">
                        <h1 className="text-3xl font-black tracking-tighter text-white">{details.title.toUpperCase()}</h1>
                        <span className="mt-1 text-xs font-bold uppercase tracking-widest text-[#d2bbff]">
                          Now streaming in {details.container.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">
                  <div className="space-y-12 lg:col-span-8">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="mb-4 flex items-center gap-4">
                          <span className="rounded bg-[#2a2a2a] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#d2bbff]">
                            {details.year}
                          </span>
                          <span className="text-sm font-medium text-[#ccc3d8]">{details.durationMin} min</span>
                          <div className="flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-3 py-1 text-yellow-500">
                            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                              star
                            </span>
                            <span className="text-xs font-black tracking-tight">{details.imdbRating.toFixed(1)}</span>
                          </div>
                        </div>
                        <h2 className="mb-2 text-5xl font-black tracking-tighter text-[#e5e2e1]">{details.title.toUpperCase()}</h2>
                        <p className="flex items-center gap-2 text-sm text-[#ccc3d8]">
                          <span className="material-symbols-outlined text-sm">visibility</span>
                          <span className="font-medium">{details.downloads.toLocaleString()} views</span>
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#d2bbff]">Synopsis</h3>
                      <p className="text-lg font-light leading-relaxed text-[#ccc3d8]">{details.summary}</p>
                    </div>

                    <div className="space-y-6">
                      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#d2bbff]">Key Cast</h3>
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        {details.cast.map((member, idx) => (
                          <div key={member} className="group rounded-xl bg-[#1c1b1b] p-4 transition-colors hover:bg-[#2a2a2a]">
                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#353534] text-sm font-bold text-[#d2bbff]">
                              {member
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <p className="text-sm font-bold text-[#e5e2e1] transition-colors group-hover:text-[#d2bbff]">{member}</p>
                            <p className="text-[11px] font-medium text-[#ccc3d8]">{idx === 0 ? "Lead" : idx === 1 ? "Co-lead" : "Cast"}</p>
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-1 gap-2 text-sm text-[#ccc3d8] sm:grid-cols-2">
                        <p><span className="text-[#d2bbff]">Producer:</span> {details.producer}</p>
                        <p><span className="text-[#d2bbff]">Director:</span> {details.director}</p>
                      </div>
                    </div>

                    <div className="space-y-8 border-t border-white/5 pt-8">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold tracking-tight text-white">
                          Discussion <span className="ml-2 text-sm font-normal text-[#ccc3d8]">{comments.length} comments</span>
                        </h3>
                        <span className="text-xs font-bold text-[#d2bbff]">Newest First</span>
                      </div>

                      <div className="flex gap-4">
                        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-[#353534]">
                          <Image src={avatarSrc} alt="" width={40} height={40} className="h-full w-full object-cover" />
                        </div>
                        <div className="flex-1 rounded-xl bg-[#0e0e0e] p-4 ring-1 ring-[#d2bbff]/20">
                          <textarea
                            className="h-12 w-full resize-none border-none bg-transparent text-sm text-[#e5e2e1] placeholder:text-[#ccc3d8]/50 focus:ring-0"
                            placeholder="Write a comment..."
                            value={commentBody}
                            onChange={(event) => setCommentBody(event.target.value)}
                          />
                          <div className="mt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() => void onSubmitComment()}
                              disabled={commenting || commentBody.trim().length === 0}
                              className="rounded-full bg-[#7c3aed] px-6 py-1.5 text-xs font-bold text-[#ede0ff] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {commenting ? "Posting..." : "Post"}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        {comments.length === 0 ? (
                          <p className="text-sm text-[#ccc3d8]">No comments yet. Start the discussion.</p>
                        ) : (
                          comments.map((comment) => (
                            <article key={comment.id} className="flex gap-4">
                              <div className="h-10 w-10 flex-shrink-0 rounded-full bg-[#2a2a2a]" />
                              <div>
                                <div className="mb-1 flex items-center gap-3">
                                  <span className="text-sm font-bold text-white">@{comment.author}</span>
                                  <span className="text-[10px] font-medium uppercase tracking-tighter text-[#ccc3d8]">
                                    {formatTimeAgo(comment.createdAt)}
                                  </span>
                                </div>
                                <p className="text-sm leading-relaxed text-[#ccc3d8]">{comment.body}</p>
                              </div>
                            </article>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-10 lg:col-span-4">
                    <div className="space-y-8 rounded-2xl bg-[#1c1b1b] p-8">
                      <div>
                        <h4 className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#d2bbff]">Stream Quality</h4>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded bg-[#2a2a2a] px-3 py-1 text-[10px] font-bold text-white">4K ULTRA HD</span>
                          <span className="rounded bg-[#2a2a2a] px-3 py-1 text-[10px] font-bold text-white">DOLBY ATMOS</span>
                          <span className="rounded bg-[#2a2a2a] px-3 py-1 text-[10px] font-bold text-white">
                            {details.container.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h4 className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#d2bbff]">Available Subtitles</h4>
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={() => setSelectedSubtitle("off")}
                            className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                              selectedSubtitle === "off" ? "border-[#d2bbff]/50 bg-[#0e0e0e]" : "border-white/5 bg-[#0e0e0e]"
                            }`}
                          >
                            <span className="text-sm font-medium text-[#e5e2e1]">Off</span>
                            <span className="material-symbols-outlined text-sm text-[#ccc3d8]">
                              {selectedSubtitle === "off" ? "check_circle" : "radio_button_unchecked"}
                            </span>
                          </button>
                          {details.subtitles.map((track) => (
                            <button
                              type="button"
                              key={track.id}
                              onClick={() => setSelectedSubtitle(track.id)}
                              className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                                selectedSubtitle === track.id ? "border-[#d2bbff]/50 bg-[#0e0e0e]" : "border-white/5 bg-[#0e0e0e]"
                              }`}
                            >
                              <span className="text-sm font-medium text-[#e5e2e1]">{subtitleAutoLabel(track)}</span>
                              <span className="material-symbols-outlined text-sm text-[#ccc3d8]">
                                {selectedSubtitle === track.id ? "check_circle" : "download"}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-white/5 pt-6">
                        <h4 className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#d2bbff]">BitTorrent Health</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-[#ccc3d8]">Seeds: {details.seeders.toLocaleString()}</span>
                            <span className="font-bold text-[#6ee7b7]">{meterLabel(stream.downloadPercent)} ready</span>
                          </div>
                          <div className="h-1 w-full overflow-hidden rounded-full bg-[#353534]">
                            <div className="h-full bg-gradient-to-r from-[#7c3aed] to-[#6ee7b7]" style={{ width: meterLabel(stream.downloadPercent) }} />
                          </div>
                          <div className="grid grid-cols-1 gap-2 text-xs text-[#ccc3d8]">
                            <p>Buffering: {meterLabel(stream.bufferingPercent)}</p>
                            <p>Transcoding: {meterLabel(stream.transcodingPercent)}</p>
                            <p>Browser ready: {stream.browserReady ? "yes" : "no"}</p>
                            <p>
                              Cache policy:{" "}
                              {stream.purgeEligibleInDays !== null
                                ? `purge in ${stream.purgeEligibleInDays} days if unwatched`
                                : "saved when full download finishes"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d2bbff]">Related Void Titles</h4>
                      <div className="space-y-4">
                        <Link href="/library" className="group flex gap-4">
                          <div className="h-32 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-[#2a2a2a]">
                            <Image src={details.coverImage} alt="" width={96} height={128} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                          </div>
                          <div className="flex flex-col justify-center">
                            <span className="mb-1 text-xs font-bold text-white transition-colors group-hover:text-[#d2bbff]">{details.title.toUpperCase()}</span>
                            <span className="text-[10px] uppercase text-[#ccc3d8]">{details.genre} • {details.year}</span>
                          </div>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>

      </div>
    </ProtectedPage>
  );
}
