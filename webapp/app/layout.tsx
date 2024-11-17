import { GeistSans } from "geist/font/sans";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import { Product, WithContext } from "schema-dts";
import {
    Inter,
    Baloo_2,
    Comic_Neue,
    Quicksand,
    Chewy,
    Fredoka,
    Lora,
    Inter_Tight,
} from "next/font/google";
import "./globals.css";
import { createClient } from "@/utils/supabase/server";
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/react";
import NavbarButtons from "./components/NavbarButtons";
import LlamaLogo from "@/public/LlamaLogo.png";
import { Metadata, Viewport } from "next";
import Script from "next/script";
import Image from "next/image";
const inter = Inter({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-inter",
});

const inter_tight = Inter_Tight({
    weight: ["500", "600", "700"],
    style: ["normal", "italic"],
    subsets: ["latin"],
    variable: "--font-inter-tight",
    display: "swap",
});

const baloo2 = Baloo_2({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-baloo2",
});

const comicNeue = Comic_Neue({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-comic-neue",
    weight: ["300", "400", "700"],
});

const quicksand = Quicksand({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-quicksand",
});

const fredoka = Fredoka({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-fredoka",
});

const lora = Lora({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-lora",
});

const fonts = `${inter.variable} ${inter_tight.variable} ${baloo2.variable} ${comicNeue.variable} ${quicksand.variable} ${fredoka.variable} ${lora.variable}`;

const defaultUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

export const metadata: Metadata = {
    metadataBase: new URL(defaultUrl),
    title: "Llama Clinic",
    description: "Llama Clinic is an AI-powered clinic for your kids",
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
};

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    return (
        <html
            lang="en"
            className={`${GeistSans.className} h-full ${fonts}`}
            suppressHydrationWarning
        >
            <body className="bg-background text-foreground flex flex-col min-h-screen bg-gray-50">
                {/* <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                > */}
                <div className="fixed bottom-0 w-full flex justify-start pointer-events-none z-40">
                    <Image
                        src="/pad_cropped.png" // Make sure to add your image to the public folder
                        alt="Paddington Bear"
                        width={300}
                        height={300}
                        className="object-contain h-auto max-w-[300px]"
                    />
                </div>
                <main className="flex-grow mx-auto w-full flex flex-col">
                    <div className="backdrop-blur-[3px] h-[4rem]- h-[80px] flex-none flex items-center sticky top-0 z-50">
                        <nav className="mx-auto w-full max-w-screen-xl px-4 flex items-center justify-between">
                            <a href="/" className="flex flex-row gap-3">
                                <Image
                                    src={LlamaLogo}
                                    alt="Llama Logo"
                                    width={80}
                                    height={80}
                                    className="rounded-full w-24 h-16"
                                />
                                <p className="sm:flex hidden items-center font-quicksand font-bold text-3xl text-stone-800 dark:text-stone-100">
                                    Llama Clinic
                                </p>
                                {/* <p className="text-xs text-gray-500">beta</p> */}
                            </a>

                            <NavbarButtons user={user} />
                        </nav>
                    </div>
                    {children}
                    {/* <Footer /> */}
                </main>

                <Analytics />
                <Toaster />
                {/* </ThemeProvider> */}
            </body>
        </html>
    );
}
