import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "../Components/Footer/footer";
import Navbar from "../Components/Navbar/navbar";
import  Auth0Provider  from "@/Components/AuhtProvider";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TuComicViewer",
  description: "Tu visor de cómics y mangas favorito",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Auth0Provider>
        <Navbar />
        <html lang="en">
          <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
            {children}
          </body>
        </html>
        <Footer />
      </Auth0Provider>
    </>
  );
}
