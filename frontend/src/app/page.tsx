"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";

const HERO_SRC =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD4E-qf29H7bRKnWtYPFL5JQI3DSHP7nsh0JtpDO6DpYQKdcLhBKpDEvsQ9XrflP2ypbavrrbBrbyHLMnC25ktmuZO1Ga7H04udrjM5z7h6K2efECBU24K6sCbKPgihzgWlR4ziT5lqj-u9z11V1_b_CvBPvxOckQRjoxWoYCyXmvDKysDeOFlbh_T96d9DAviRo2qi3--otp_m22SxlQdyVhHezPYuvEqmd95gbmqxLykLQ4WFaihJjuRRV3ETu0rnuBzCjN87vIU";

const POPULAR: {
  title: string;
  year: string;
  label: string;
  rating: string;
  image: string;
}[] = [
  {
    title: "Void Horizon",
    year: "2023",
    label: "4K",
    rating: "8.4",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBwKIPCWxpt6HsgyiTKpjsAYlbVt8ioaBBoEfPYuszJ7_JAHjxvdXcQsKRDpzewX9yjloCnEE4xilRQpWsFU5pMKumOFD9flr6b6jR5J23DWQpe0wkHynzEGhpPkh3uWA4j2gq5AE7_e-vNw7gsl80Fl2BbxIxl1nnYGJtqmTcDAc9hQINocVPQcNc9UMAigoDGue1TXsMxufunXVX5btbkGmr31I3f_tw6pfND89k7PLa-ud-EMfTtNwsGHywgiojP9bxvE3Ieyw4",
  },
  {
    title: "Digital Rain",
    year: "2024",
    label: "HDR",
    rating: "7.9",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCnUh9IBS1SfX9FpXRssIjz0XPV7Py1pcDVJxcVD42kwvxerLbhmjRw81J8VdeFI8HSlP8M8ev34b-nepOu9jzBMEMroLONT1x0RAiEYumshPDaKBNMHF-pkV9b2QJIqxgx2e8jBoDRTzZXi1pgtn9wvVCpYEjufNfzjPgrTA7LkCUSewJGSkY1eqaZcvD9aDGTc2TD-Ewcx68qf_J0dslFfjI5IJ6epxbe_hMCNY0iQwrMUOsCSOy2RJrSQQMrA9pr13SjIZ6-HQ0",
  },
  {
    title: "Internal Flame",
    year: "2022",
    label: "1080P",
    rating: "9.1",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCDAHSYQMdQAXH4cieHh0s_a6zAtzcUljVZ2OtEWMoLZwvd1pRFddWzviqsM7BrhPSP3TcIynVaNW8msDriAZA5enruRL42J7brSgtCyvaNoE94MIWoAZUVupTVaUYUlY7maUY9NjZTr-yi9ZBF12hGosx754Rib2femNm_c_zbvGvHk3b-o2n5kbfBy22LKnEI8iHDLBOAChEpPBg75YlvMJ6w1Y-sGoil96HCPnqTvX6BgUzWeverEqFNXNNCPgTaJRQm6H8wC9I",
  },
  {
    title: "The Last Shrine",
    year: "2024",
    label: "4K",
    rating: "8.2",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD6_Fs77fGMAhhNm1kJXxCbvB633ws-8tl2PLI2Pwe7iHrPGscBYVbkBe47Sl8SlKlE0Tzkli4botjTZ2c_fFscUCSQZ8k-AJbr3rQrFMJXF9A1CumPVzLDvZJVrtKS16XYL8gWNdH0CFursHzZ_1Qd2aY2V4MBfEr4_lu7LSvJOE8BN4YyXvcwiVycW567AD3HCS_tNF0R5L_wfdAKzk2NRgm9cxSnix1HmCm46vpB396PlDYuBrFegNKdUxaXpI3Z1wx-EiDjODk",
  },
  {
    title: "Downward Spiral",
    year: "2023",
    label: "HDR",
    rating: "7.5",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAyPsxjFYWgPN3qdnzCFGBTdJ_4U2uTXMSkJ5eCd6x-SUqXL1mbw_1TP7ts5EM1138pLR2Po1lo0SBwMPNRvFyaLrsc8V8_tYqUq7HkoKhLLQ2KLRpYtl3PpHLxxfNBhftE7dO46ATps0HpTdYua5Np0ljCmqYuDFnhKa_MK33zrUoTLM8fXX52XWOFS49j-eEbGNvv6l_rknCAu5MwaROcKWsN9YUOEFMsdVDVq51mJY_2zQNESLK37lAPQ8bWluEMrBcOM34yB-s",
  },
];

export default function Home() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-[#131313] text-[#e5e2e1] selection:bg-[#7c3aed] selection:text-white">
      <nav className="fixed top-0 z-50 flex h-20 w-full items-center justify-between bg-[#131313]/60 px-8 shadow-[0_40px_60px_-10px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
        <div className="flex items-center gap-12">
          <Link href="/" className="text-2xl font-black tracking-tighter text-[#d2bbff]">
            HYPERTUBE
          </Link>
          <div className="hidden items-center gap-8 text-sm font-medium tracking-tight md:flex">
            <Link
              className="border-b-2 border-[#7c3aed] pb-1 text-[#d2bbff]"
              href={isAuthenticated ? "/library" : "/register"}
            >
              Movies
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden items-center gap-3 rounded-lg bg-[#0e0e0e] px-4 py-2 lg:flex">
            <span className="material-symbols-outlined text-sm text-[#ccc3d8]">search</span>
            <input
              className="w-48 border-none bg-transparent text-xs text-[#e5e2e1] outline-none ring-0 placeholder:text-[#6b7280]"
              placeholder="Search the void…"
              type="search"
              readOnly
              title="Search coming soon"
            />
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated && user ? (
              <>
                <Link
                  href={`/profile/${user.username}`}
                  className="text-sm font-medium text-gray-400 transition-colors hover:text-white"
                >
                  Profile
                </Link>
                <Link
                  href="/settings/profile"
                  className="text-sm font-medium text-gray-400 transition-colors hover:text-white"
                >
                  Settings
                </Link>
                <Link
                  className="rounded-lg bg-gradient-to-br from-[#7c3aed] to-[#5a00c6] px-5 py-2.5 text-sm font-bold text-[#ede0ff] transition-transform active:scale-95"
                  href="/logout"
                >
                  Logout
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-400 transition-colors hover:text-white"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-gradient-to-br from-[#7c3aed] to-[#5a00c6] px-6 py-2.5 text-sm font-bold text-[#ede0ff] transition-transform active:scale-95"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-20">
        <section className="relative flex h-[min(870px,100svh)] w-full items-end overflow-hidden px-8 pb-24 md:px-20 md:pb-32">
          <div className="absolute inset-0 z-0">
            <Image
              alt=""
              className="object-cover"
              fill
              priority
              sizes="100vw"
              src={HERO_SRC}
            />
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(180deg, rgba(19,19,19,0) 0%, rgba(19,19,19,1) 100%)",
              }}
            />
          </div>
          <div className="relative z-10 grid w-full max-w-4xl grid-cols-1 items-end gap-8 md:grid-cols-12">
            <div className="md:col-span-8">
              <div className="mb-4 flex flex-wrap gap-4">
                <span className="rounded bg-[#d2bbff]/20 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-[#d2bbff]">
                  Trending Now
                </span>
                <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-[#ccc3d8]">
                  2024 • Sci-Fi Thriller
                </span>
              </div>
              <h1 className="mb-6 text-5xl font-black leading-none tracking-tighter text-[#e5e2e1] sm:text-6xl md:text-7xl lg:text-8xl">
                NEON
                <br />
                ECHOES
              </h1>
              <p className="mb-8 max-w-xl text-lg leading-relaxed text-[#ccc3d8]">
                In a city that never sleeps, silence is the only currency left. A high-stakes heist through the
                digital veins of the future.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-[#7c3aed] to-[#5a00c6] px-6 py-4 text-sm font-bold text-white transition-opacity hover:opacity-90 sm:px-8"
                  href={isAuthenticated ? "#" : "/register"}
                >
                  <span className="material-symbols-outlined !text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    play_arrow
                  </span>
                  Watch Now
                </Link>
                <button
                  className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-6 py-4 text-sm font-bold text-white backdrop-blur-md transition-colors hover:bg-white/20 sm:px-8"
                  type="button"
                >
                  <span className="material-symbols-outlined !text-2xl">add</span>
                  My List
                </button>
              </div>
            </div>
            <div className="hidden text-right md:col-span-4 md:block">
              <div className="inline-flex flex-col items-end">
                <span className="mb-2 text-xs uppercase tracking-[0.2em] text-[#ccc3d8]">Rotten Score</span>
                <span className="text-5xl font-black text-[#d2bbff]">98%</span>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#131313] px-8 py-24 md:px-20">
          <div className="mb-16 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <h2 className="mb-2 text-2xl font-black tracking-tight text-[#e5e2e1] sm:text-3xl">POPULAR RELEASES</h2>
              <div className="h-1 w-24 bg-[#7c3aed]" />
            </div>
            <div className="flex gap-4 self-end sm:self-auto">
              <button
                className="rounded-full border border-[#4a4455]/30 p-2 transition-colors hover:bg-[#2a2a2a]"
                type="button"
                aria-label="Scroll left"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button
                className="rounded-full border border-[#4a4455]/30 p-2 transition-colors hover:bg-[#2a2a2a]"
                type="button"
                aria-label="Scroll right"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
            {POPULAR.map((m) => (
              <div key={m.title} className="group cursor-pointer">
                <div className="relative mb-4 aspect-[2/3] overflow-hidden rounded-xl bg-[#2a2a2a] transition-transform duration-500 group-hover:scale-[1.02]">
                  <Image alt="" className="object-cover" fill sizes="(min-width: 1024px) 20vw, 50vw" src={m.image} unoptimized />
                  <div className="absolute right-3 top-3 flex items-center gap-1 rounded bg-black/60 px-2 py-1 text-[10px] font-bold text-[#d2bbff] backdrop-blur-md">
                    <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
                      star
                    </span>
                    {m.rating}
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#e5e2e1] transition-colors group-hover:text-[#d2bbff]">
                    {m.title}
                  </h3>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs text-[#ccc3d8]">{m.year}</span>
                    <span className="rounded border border-[#4a4455]/40 px-1 text-[10px] font-black">{m.label}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>

      <footer className="mt-12 w-full border-t border-white/5 bg-[#0e0e0e] py-12">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-8 px-8 md:flex-row">
          <div className="flex max-w-md flex-col gap-4 text-center md:text-left">
            <span className="text-xl font-black tracking-tighter text-[#d2bbff]">HYPERTUBE</span>
            <p className="text-xs text-gray-500">The Cinematic Void. Peer-to-peer streaming evolved for the modern enthusiast.</p>
          </div>
          <div className="flex flex-col items-center gap-8 md:flex-row">
            <div className="flex flex-wrap justify-center gap-6 md:gap-8">
              <a className="text-xs font-medium text-gray-600 transition-colors hover:text-white" href="#">
                Privacy Policy
              </a>
              <a className="text-xs font-medium text-gray-600 transition-colors hover:text-white" href="#">
                Terms of Service
              </a>
              <a className="text-xs font-medium text-gray-600 transition-colors hover:text-white" href="#">
                API
              </a>
              <a className="text-xs font-medium text-gray-600 transition-colors hover:text-white" href="#">
                Contact
              </a>
            </div>
            <p className="text-xs font-medium text-gray-500">© 2026 Hypertube. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
