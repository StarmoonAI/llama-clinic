import MedicalRecords from "@/app/components/MedicalRecords";
import { getOpenGraphMetadata } from "@/lib/utils";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "File upload",
    ...getOpenGraphMetadata("File upload"),
};

export default async function Home() {
    return (
        <div>
            <MedicalRecords />
        </div>
    );
}
