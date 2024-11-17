import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { SidebarNav } from "../components/SidebarNavItems";
import {
    ClipboardPlus,
    Flame,
    Gamepad2,
    MicVocal,
    Settings,
} from "lucide-react";
import { Metadata } from "next";
import { getOpenGraphMetadata } from "@/lib/utils";

const ICON_SIZE = 20;

export const metadata: Metadata = {
    title: "Home",
    ...getOpenGraphMetadata("Home"),
};

const sidebarNavItems = [
    {
        title: "Playground",
        href: "/home",
        icon: <MicVocal size={ICON_SIZE} />,
    },
    {
        title: "Medical records",
        href: "/home/track",
        icon: <ClipboardPlus size={ICON_SIZE} />,
    },
    {
        title: "Settings",
        href: "/home/settings",
        icon: <Settings size={ICON_SIZE} />,
    },
];

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    return (
        <div className="flex flex-1 flex-col mx-auto w-full max-w-[1400px] gap-6 py-2 sm:py-4 md:flex-row">
            <aside className="w-full md:w-[270px] sm:py-6 pt-2 md:overflow-y-auto md:fixed md:h-screen">
                <SidebarNav items={sidebarNavItems} />
            </aside>
            <main className="flex-1 sm:py-6 px-4 flex justify-center md:ml-[250px]">
                <div className="max-w-4xl w-full">{children}</div>
            </main>
        </div>
    );
}
