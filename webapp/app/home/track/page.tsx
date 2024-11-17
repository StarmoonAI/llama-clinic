import CurrentSymptoms from "@/app/components/CurrentSymptoms";
import { getOpenGraphMetadata } from "@/lib/utils";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Medical records",
    ...getOpenGraphMetadata("Medical records"),
};

export default async function Home() {
    return (
        <div>
            <CurrentSymptoms />
        </div>
    );
}
