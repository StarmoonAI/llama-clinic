import { LifestyleFactors } from "@/app/components/LifestyleFactors";
import { getOpenGraphMetadata } from "@/lib/utils";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Medical records",
    ...getOpenGraphMetadata("Medical records"),
};

export default async function Home() {
    return (
        <div>
            <LifestyleFactors />
        </div>
    );
}
