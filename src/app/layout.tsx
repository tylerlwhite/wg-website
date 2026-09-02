import type { Metadata } from "next";
import Script from "next/script";
import { Anton } from "next/font/google";
import "./globals.css";

// Fat condensed grotesque for the Shop link's Enter the Void title-card treatment.
// Loaded here rather than in Footer so the file is fetched once at build time.
const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
});

export const metadata: Metadata = {
  title: "WG",
  description: "Film Distribution",
  metadataBase: new URL("https://rommelnunez.github.io/wg-website/"),
  openGraph: {
    title: "WG",
    description: "Film Distribution",
    url: "https://rommelnunez.github.io/wg-website/",
    siteName: "WG Film Distribution",
    images: [
      {
        url: "/opengraph-image.jpg",
        width: 1200,
        height: 600,
        alt: "WG Film Distribution",
      },
    ],
    type: "website",
  },
};



// ... (imports)

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={anton.variable}>
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-LM61JDD1X6"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('consent', 'default', {
              analytics_storage: 'granted'
            });
            gtag('config', 'G-LM61JDD1X6');
          `}
        </Script>
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
