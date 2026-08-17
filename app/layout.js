import "./globals.css";

export const metadata = {
  title: "Scientific Abstract Builder",
  description: "Turn structured research information into a conference-ready scientific abstract.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
