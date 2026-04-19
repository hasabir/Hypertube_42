import "./globals.css";

export const metadata = {
  title: "Hypertube Frontend",
  description: "Next.js frontend for Hypertube",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
