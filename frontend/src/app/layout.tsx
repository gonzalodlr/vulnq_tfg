/** @format */

import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
const icon = "/icon.svg";

export const metadata: Metadata = {
  title: "VulnQ Vulnerability Management",
  description:
    "A web application for managing vulnerabilities in technology assets of organizations.",
  icons: {
    icon: icon,
    shortcut: icon,
    apple: icon,
  },
  keywords: [
    "vulnerability management",
    "cybersecurity",
    "vulnerability assessment",
    "risk management",
    "security",
    "information security",
    "technology assets",
    "web application",
    "organization security",
  ],
  authors: [
    {
      name: "Gonzalo De Los Reyes Sanchez",
      url: "gonzalodlr.github.io",
    },
  ],
  creator: "VulnQ Team",
  publisher: "VulnQ Team",
  // openGraph: {
  //   title: "VulnQ Vulnerability Management",
  //   description:
  //     "A web application for managing vulnerabilities in technology assets of organizations.",
  //   url: "https://vulnq.com",
  //   siteName: "VulnQ",
  //   images: [
  //     {
  //       url: icon.src,
  //       width: 800,
  //       height: 600,
  //       alt: "VulnQ Logo",
  //     },
  //   ],
  //   locale: "en_US",
  //   type: "website",
  // },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          {/* <div className="mx-auto max-w-5xl text-2xl gap-2 mb-10">
            
          </div> */}
        </ThemeProvider>
      </body>
    </html>
  );
}
