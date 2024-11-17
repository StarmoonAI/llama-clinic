import { getUserById } from "@/db/users";
import { createClient } from "@/utils/supabase/server";
import { Metadata } from "next";
import { getOpenGraphMetadata } from "@/lib/utils";
import { MedicalRecordsOptions } from "@/app/components/MedicalRecordsOptions";

export const metadata: Metadata = {
    title: "Medical records",
    ...getOpenGraphMetadata("Medical records"),
};

const MedicalOptions = [
    {
        display: "Files",
        href: "/home/track",
    },
    {
        display: "Family history",
        href: "/home/track/family",
    },
    {
        display: "Lifestyle factors",
        href: "/home/track/lifestyle",
    },
];

export default async function Home({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const dbUser = user ? await getUserById(supabase, user.id) : undefined;

    return (
        <div className="pb-12 flex flex-col gap-2 font-quicksand">
            <div className="flex flex-row items-start sm:items-center gap-4 sm:justify-normal justify-between">
                <h1 className="text-3xl font-bold">Medical records</h1>
            </div>
            {/* {dbUser && <HomePageSubtitles user={dbUser} page="track" />} */}

            <MedicalRecordsOptions items={MedicalOptions} />
            {children}
        </div>
    );
}
