import MedicalRecords from "@/app/components/MedicalRecords";
import { getOpenGraphMetadata } from "@/lib/utils";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Medical records",
    ...getOpenGraphMetadata("Medical records"),
};

export default async function Home() {
    return (
        <div>
            <MedicalRecords />
        </div>
    );
}
