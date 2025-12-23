import type { Metadata } from "next";
import { Schibsted_Grotesk, Martian_Mono } from "next/font/google";
import  LightRays  from "@/components/LightRays";
import "./globals.css";
import Navbar from "@/components/Navbar";

const schibstedGrotesk = Schibsted_Grotesk({
  variable: "--font-schibsted-grotesk",
  subsets: ["latin"],
});

const martianMono = Martian_Mono({
  variable: "--font-martian-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DevEventSync App",
  description: "syncing events made easy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${schibstedGrotesk.variable} ${martianMono.variable} antialiased min-h-screen `}
      >
        <Navbar />
        <div className="absolute inset-0 top-0 z-[-1] min-h-screen">
   <LightRays
    raysOrigin="top-center-offset"
    raysColor="#5dfeca"
    raysSpeed={0.5}
    lightSpread={0.9}
    rayLength={1.4}
    followMouse={true}
    mouseInfluence={0.02}
    noiseAmount={0.0}
    distortion={0.01}
    className="custom-rays"
  />
 </div>
        <main>{children}</main>
      </body>
    </html>
  );
}
