export type LibrarySource = "archive" | "legit";

export type LibraryMovie = {
  id: string;
  title: string;
  year: number;
  genre: string;
  imdbRating: number;
  image: string;
  imageAlt: string;
  quality: "4K HDR" | "1080p";
  source: LibrarySource;
  watched: boolean;
  isNew?: boolean;
  seeders: number;
  peers: number;
  downloads: number;
  highlightPlay?: boolean;
};

export const LIBRARY_SOURCE_LABELS: Record<LibrarySource, string> = {
  archive: "archive.org",
  legit: "legittorrents.info",
};

export const LIBRARY_MOVIES: LibraryMovie[] = [
  {
    id: "nebula-drift",
    title: "Nebula Drift",
    genre: "Sci-Fi",
    year: 2024,
    imdbRating: 8.9,
    quality: "4K HDR",
    source: "archive",
    watched: false,
    seeders: 221,
    peers: 308,
    downloads: 9121,
    highlightPlay: true,
    imageAlt: "Nebula Drift poster",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD9jpp_9P9TltW7BBnIXp5qIcaZmRQwtPQ-Ys6LYAzObrZHWbdN05vxjABkCnY_XSSuwo7tmPvpuGWc5_YVSDe7OD4DIybtwgB9p1zgwuCUwUIKILYyh_HNFgZrVqOvdsxb5aYSvLgIy5gqi-jOszN_tJGPlsdyrrtB3_GnBkflJEYFZFm8Lhei3eAGxU9FByIIVbzG1RyeJ5obinPf8bh2tmUTPD79KbFuLp8BqJ73ijB3wTl0vMJ4ehIzS9W3VGd5eYD6lmJnRzo",
  },
  {
    id: "neon-rain-2049",
    title: "Neon Rain: 2049",
    genre: "Cyberpunk",
    year: 2023,
    imdbRating: 7.4,
    quality: "1080p",
    source: "legit",
    watched: true,
    seeders: 111,
    peers: 184,
    downloads: 5021,
    imageAlt: "Neon Rain poster",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAGFSC0UEEgP5kHJCEu3P5gZzrAjGoQaRvUiK4sUBvpLuJ08HEeICh8mbj6OH7f8CFdiGahduhhfWA6GY-nr7eCTAGVhlHiXgvvvsFb-VlxsBHO7uS2ZSaRKscRE5KO6uipL_GNwPGxWHfuov2r27p2ZyzZlCK2X_0mbZ8AWqrNYKw0BFBgQJSdGGaHiDUx6TASB0y6DMTXkK7hubME4fxjpEC_Z_4tpJDM28VseZ-QcIp4cuSU5q9vW56rBimC6BrM8UwngPGAB5g",
  },
  {
    id: "the-glitch",
    title: "The Glitch",
    genre: "Thriller",
    year: 2022,
    imdbRating: 8.1,
    quality: "1080p",
    source: "archive",
    watched: false,
    seeders: 172,
    peers: 221,
    downloads: 6840,
    imageAlt: "The Glitch poster",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDS2YR3qtZ_7FD4BNBp1POlUcIATuyjYH4pZTPMGu32dUlqwJAUcaRlX1gw96tgWqdGD77zjP_3MUPEB_XOCvn2XiwXM_7feUhv8mnlX6jmaCeX-ardDRDt-GiFw5OiqRpc09WQRZAM3YTzBSt6adU8yRETjlpSb_KC47P2Hpl0Lp-fkWSMwilIE_TEDvBGVUJcNuEFqH3ESOijYlcmI2zP-F5JzkDbN160N-QMCZNhUWvoyEKX8wSampdBD1rPV8ZubLa3nOai-I0",
  },
  {
    id: "last-reel",
    title: "Last Reel",
    genre: "Documentary",
    year: 2021,
    imdbRating: 9,
    quality: "1080p",
    source: "archive",
    watched: true,
    seeders: 87,
    peers: 132,
    downloads: 4204,
    imageAlt: "Last Reel poster",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDA3Q08c_Ov3JP8vZHZ1xIrNenk7d5ZM0AjGrEgm6Laln3Uh-vdA71v43ZdO27lSllrYetHz68TWeL0FttHC8hDnnexqNy3Ng2QWDjMNLzIZel4K3GEPpqMQc7H_9phRpT1pkZdRMNOBzNPsb7B1IkQJ-2vKNwbtLJx2ojwnjWFV5i6HK61WI6hKw30mpguP8ajLacdBuE0hMYkJnYCmH372A9luDyk5RpltoeiecLk0O3my3o0rLyickMUSOmcRiG6GE4wz5AzQcU",
  },
  {
    id: "titan-one",
    title: "Titan One",
    genre: "Sci-Fi",
    year: 2024,
    imdbRating: 7.2,
    quality: "4K HDR",
    source: "legit",
    watched: false,
    seeders: 197,
    peers: 271,
    downloads: 7313,
    imageAlt: "Titan One poster",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAFKgEuC5RAuYFAjy3jDDgefJGy19k9saO1i4dqrB5ilZsmEpE1xNyAMSvH_UwjqLe7qlYGz2E0f9adw777_gtoegMk9gv4oiTL6pJJLSccWz9AF5dVYCDd1qbEw5cdIiU5p3bp2IhbkaeyDb5yDyr0tWlLQcKTamwfr62L0gS22Pl3XpwT5N7jI94ZbFILShXJbNYWhujHfWQiJAfC9OUvmI3WsPZQNCzytDBfMrv2OMTixPaJ4reIZuk48RjwhYr3o2lFfPsh0xQ",
  },
  {
    id: "eldritch-blade",
    title: "Eldritch Blade",
    genre: "Fantasy",
    year: 2024,
    imdbRating: 8.5,
    quality: "4K HDR",
    source: "archive",
    watched: false,
    isNew: true,
    seeders: 166,
    peers: 240,
    downloads: 6930,
    imageAlt: "Eldritch Blade poster",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDFz0Rwcd9wI7cw1YSbeMVaJ5Yi_-K1fQ4RWgSW8-Q4q_iyoRQ_vNBJehqN4GPqOcGaXt1EBdg5eDQVByQqOnY5wrBguLjWqOMvXmQO8TaY5MEP0AyNHOqoaC7fy7YOp7RwrMzVEvSI40qKh868a6iR8TFHrzNSG8nV0AGidhwxMRA3IDZoMYA823-iidGkqaHiPU1pBU1YBaW8GlzX8s-dZ0mCsIjLzIrxTZDP2TbwvvibgJTaF_Fi_cFkeYiBBiB-Pk3tEnjEE-s",
  },
  {
    id: "deep-mist",
    title: "Deep Mist",
    genre: "Thriller",
    year: 2023,
    imdbRating: 6.8,
    quality: "1080p",
    source: "legit",
    watched: false,
    seeders: 62,
    peers: 114,
    downloads: 3002,
    imageAlt: "Deep Mist poster",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC3R0QZCcz24udoiD3he54Y4tdXGxBgy8EuDdBbTwiHRnnEM_WOYeALq5VS0PLb3BCALYpDU03rxCJ4wAIuasRU11iQml6JkgxayZZrmquJwrUY1WTYfvKZrb0jnzVlBqK9uyGZEGcF2Y6IniB6e8nfOi3JPcoTqutfHXK9XjWpuhYxNrHe4DiGn7BW4Kmqv5pby4zlnxhKOZcXN8otFdPDGl8W1ORZ6FJG2WCkiLniXDQy1EyMTryQWcYU8Gkaek5xWHcjUa4vqhs",
  },
  {
    id: "the-shadows",
    title: "The Shadows",
    genre: "Noir",
    year: 2019,
    imdbRating: 8.3,
    quality: "1080p",
    source: "archive",
    watched: true,
    seeders: 74,
    peers: 103,
    downloads: 4100,
    imageAlt: "The Shadows poster",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAzWOuWZRkyZxjh1OiRxPvRJawo_8j3I2q7QUWNE4NMJ0Vjwq35MiQngZdfLOMFehEei29hg4bmZp75wROY_Poy-nLlCyaIagcqj_U5qa6Dzi2cdD0qjR14ml9ejOhLAcHPY-GqitnsmRAb6QW6t_FS6Cawz5OLv1iDvNfW15a51811mO6sGtU4tDlg01uz18XItR-mXdolMdLu3LWySrEwZD41c9hEBHvoLeYqR9oUSHpvwHx5PXzqaTCigb9lLPONpWkwO5FVbrU",
  },
  {
    id: "asylum-echo",
    title: "Asylum Echo",
    genre: "Horror",
    year: 2024,
    imdbRating: 5.9,
    quality: "1080p",
    source: "legit",
    watched: false,
    seeders: 53,
    peers: 91,
    downloads: 2282,
    imageAlt: "Asylum Echo poster",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBDTO31a4YclJFeIaFpYM2jluY6r8QufbYoz6Fp1WDT3yAh6lb0vJYCWOETw3DWcw_amzT1_cMrrDCYnZKSYMUqJa37OkJNrcOwMHvWwafWRJhd4VnQrY6w284X_37lylVuKorxb003wNFutGReqo4wW_6IoPH1wsYjpIWoEodvf261EeoaW8n-DOTfGwhaK2RFNyJGmY71AQddVqg7fGn5K6frWo0nKSf1lWSuYTEId1Xhkw-iH8lh7pSRRzRGBIG6JXBqcMU5VpI",
  },
  {
    id: "summer-end",
    title: "Summer End",
    genre: "Indie",
    year: 2023,
    imdbRating: 9.2,
    quality: "4K HDR",
    source: "archive",
    watched: false,
    seeders: 143,
    peers: 201,
    downloads: 8003,
    imageAlt: "Summer End poster",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA3B596CCOa4VgxdSQKhT94HxSDzJAPwuV3ihMHYRqRo-kdVt_WCC51i-eCEdZx5LPFmkIiriszHE43c5oxcpTgS56g9dt5wB3CSrHblWrz7PX8qlbatinssweawFQMCX9mcDIMwhZrA4fxfebRKueyqmu38nUVtdNmgahiYu-kti_MV5MOz98JK8Ba2tG8C5Tqia5BYzNwQn3ifpJemVKT356ZlxFJvQPW9fK5hGWeQrmH0cpZeo4qO5KIr-lO9pgfnBckmzLL8Hc",
  },
  {
    id: "velvet-reign",
    title: "Velvet Reign",
    genre: "Drama",
    year: 2022,
    imdbRating: 7.7,
    quality: "1080p",
    source: "legit",
    watched: false,
    seeders: 97,
    peers: 149,
    downloads: 4986,
    imageAlt: "Velvet Reign poster",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB96aWUankKVY8zWziVVkOfECxbv8K9T9nhe2p5hcRg0dP2VnGAHDs9XoCfdNLzmuKEtKiaTKh6aejyCRYXr3NErYN3dBrsvNtT32mh0omJg18Y4iXtNhcHo5s5k6J54Gf-LzRyH-FDl7BWtvBbcseCXJDVPYSBpDx4-cqsHCgwZM8yJWO8W8yeNaEBry9kdA-BOdlxYeXtEecIJ1N4DmLT_Yonq966GGdoEERJLRLS5SCu3eqbrtzvwKixyUbKlZJaSXxVNXvuObM",
  },
  {
    id: "ignition",
    title: "Ignition",
    genre: "Action",
    year: 2024,
    imdbRating: 6.4,
    quality: "4K HDR",
    source: "archive",
    watched: false,
    seeders: 120,
    peers: 167,
    downloads: 5510,
    imageAlt: "Ignition poster",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDtAOOpZwnmJfVBCVYwRYPC_hi7GjlWKifOcNAJJdsXLaVyRPAfUb8_FREDWDkZpIEXFI9hLHE7C31MdB3OURKhfVKH0CNjx9xKKVmuFI8sFTT5EhrJtgBsmKi3Jg0rIBi1AJNvplKPgcFc3eP-947uSfW1cRzawxYHx9fnJK7PFmyKwUfruweYFsXfYrrFiyLSSP4kBzUTG0hzhLyFLRSHVTBsqMJ9gpD51vLp4D-YjdLIr9UUX_078dRPCzRFFzJeEQmvEMkNiyA",
  },
  {
    id: "crystal-protocol",
    title: "Crystal Protocol",
    genre: "Sci-Fi",
    year: 2020,
    imdbRating: 8.4,
    quality: "1080p",
    source: "legit",
    watched: true,
    seeders: 65,
    peers: 90,
    downloads: 3265,
    imageAlt: "Crystal Protocol poster",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD9jpp_9P9TltW7BBnIXp5qIcaZmRQwtPQ-Ys6LYAzObrZHWbdN05vxjABkCnY_XSSuwo7tmPvpuGWc5_YVSDe7OD4DIybtwgB9p1zgwuCUwUIKILYyh_HNFgZrVqOvdsxb5aYSvLgIy5gqi-jOszN_tJGPlsdyrrtB3_GnBkflJEYFZFm8Lhei3eAGxU9FByIIVbzG1RyeJ5obinPf8bh2tmUTPD79KbFuLp8BqJ73ijB3wTl0vMJ4ehIzS9W3VGd5eYD6lmJnRzo",
  },
  {
    id: "signal-noise",
    title: "Signal Noise",
    genre: "Thriller",
    year: 2018,
    imdbRating: 7.6,
    quality: "1080p",
    source: "archive",
    watched: false,
    seeders: 48,
    peers: 79,
    downloads: 2192,
    imageAlt: "Signal Noise poster",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC3R0QZCcz24udoiD3he54Y4tdXGxBgy8EuDdBbTwiHRnnEM_WOYeALq5VS0PLb3BCALYpDU03rxCJ4wAIuasRU11iQml6JkgxayZZrmquJwrUY1WTYfvKZrb0jnzVlBqK9uyGZEGcF2Y6IniB6e8nfOi3JPcoTqutfHXK9XjWpuhYxNrHe4DiGn7BW4Kmqv5pby4zlnxhKOZcXN8otFdPDGl8W1ORZ6FJG2WCkiLniXDQy1EyMTryQWcYU8Gkaek5xWHcjUa4vqhs",
  },
  {
    id: "moonlit-archive",
    title: "Moonlit Archive",
    genre: "Documentary",
    year: 2024,
    imdbRating: 8.8,
    quality: "4K HDR",
    source: "archive",
    watched: false,
    isNew: true,
    seeders: 211,
    peers: 280,
    downloads: 9033,
    imageAlt: "Moonlit Archive poster",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDA3Q08c_Ov3JP8vZHZ1xIrNenk7d5ZM0AjGrEgm6Laln3Uh-vdA71v43ZdO27lSllrYetHz68TWeL0FttHC8hDnnexqNy3Ng2QWDjMNLzIZel4K3GEPpqMQc7H_9phRpT1pkZdRMNOBzNPsb7B1IkQJ-2vKNwbtLJx2ojwnjWFV5i6HK61WI6hKw30mpguP8ajLacdBuE0hMYkJnYCmH372A9luDyk5RpltoeiecLk0O3my3o0rLyickMUSOmcRiG6GE4wz5AzQcU",
  },
  {
    id: "silent-helios",
    title: "Silent Helios",
    genre: "Drama",
    year: 2021,
    imdbRating: 7.9,
    quality: "1080p",
    source: "legit",
    watched: true,
    seeders: 59,
    peers: 88,
    downloads: 3450,
    imageAlt: "Silent Helios poster",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB96aWUankKVY8zWziVVkOfECxbv8K9T9nhe2p5hcRg0dP2VnGAHDs9XoCfdNLzmuKEtKiaTKh6aejyCRYXr3NErYN3dBrsvNtT32mh0omJg18Y4iXtNhcHo5s5k6J54Gf-LzRyH-FDl7BWtvBbcseCXJDVPYSBpDx4-cqsHCgwZM8yJWO8W8yeNaEBry9kdA-BOdlxYeXtEecIJ1N4DmLT_Yonq966GGdoEERJLRLS5SCu3eqbrtzvwKixyUbKlZJaSXxVNXvuObM",
  },
];
