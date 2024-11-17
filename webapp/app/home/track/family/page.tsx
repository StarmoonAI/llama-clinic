import { FamilyHistory } from "@/app/components/FamilyHistory";
import { getOpenGraphMetadata } from "@/lib/utils";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Family history",
    ...getOpenGraphMetadata("Family history"),
};

export default async function Home() {
    return <FamilyHistory />;
}
