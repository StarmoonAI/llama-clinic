import AddFamilyHistory from "@/app/components/AddFamilyHistory";
import { getOpenGraphMetadata } from "@/lib/utils";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Family history",
    ...getOpenGraphMetadata("Family history"),
};

export default async function Home() {
    return <AddFamilyHistory />;
}
