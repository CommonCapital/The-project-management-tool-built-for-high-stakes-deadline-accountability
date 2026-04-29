import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { TRPCProvider } from "@/components/providers/TRPCProvider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const mono = IBM_Plex_Mono({ 
  subsets: ["latin"], 
  weight: ["400", "500", "600"],
  variable: "--font-mono" 
});

export const metadata: Metadata = {
  title: "APEX | Project Management",
  description: "Institutional project management platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.variable} ${mono.variable} font-sans antialiased h-full bg-white text-black`}>
        <TRPCProvider>
          {children}
          <Toaster position="top-right" />
        </TRPCProvider>
      </body>
    </html>
  );
}
