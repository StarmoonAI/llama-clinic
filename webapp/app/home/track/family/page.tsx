import { FamilyHistory } from "@/app/components/FamilyHistory";
import { getOpenGraphMetadata } from "@/lib/utils";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Medical records",
    ...getOpenGraphMetadata("Medical records"),
};

export default async function Home() {
    return (
        <div>
            <FamilyHistory />
        </div>
    );
}
