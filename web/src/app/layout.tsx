import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "@/theme";
import { AuthProvider } from "@/context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BurpeePacer | The Elite Burpee Tracker",
  description:
    "The official BurpeePacer app. Track your landmarks, set your pace, and master the Busy People Program.",
  openGraph: {
    title: "BurpeePacer | The Elite Burpee Tracker",
    description:
      "The official BurpeePacer app. Track your landmarks, set your pace, and master the Busy People Program.",
    url: "https://burpeepacers.com",
    siteName: "BurpeePacer",
    images: [{ url: "/opengraph-image.png", width: 1024, height: 1024 }],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "BurpeePacer | The Elite Burpee Tracker",
    description:
      "The official BurpeePacer app. Track your landmarks, set your pace, and master the Busy People Program.",
    images: ["/opengraph-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider>{children}</AuthProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
