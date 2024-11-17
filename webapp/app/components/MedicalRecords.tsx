"use client";

import React, { useState, ChangeEvent, useEffect } from "react";
import { Download, FileText, Upload } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
    onProcessingComplete?: (documents: ProcessedDocument[]) => void;
    onError?: (error: FileProcessingError) => void;
    maxFileSize?: number; // in bytes
}

interface MedicalRecord {
    name: string;
    id: string;
    created_at: string;
    metadata: Record<string, any>;
}

const FileUpload: React.FC<FileUploadProps> = ({
    onProcessingComplete,
    onError,
    maxFileSize = 10 * 1024 * 1024, // 10MB default
}) => {
    const supabase = createClient();
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const [progress, setProgress] = useState<number>(0);
    const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);

    const fetchMedicalRecords = async () => {
        try {
            const { data, error } = await supabase.storage.from("rag").list();
            console.log(data);
            if (error) throw error;

            const transformedData = (data || []).map((file) => ({
                ...file,
                metadata: {
                    size: file.metadata.size || 0,
                    mimetype: file.metadata.mimetype || "",
                },
            }));

            setMedicalRecords(transformedData);
        } catch (err) {
            console.error("Error fetching medical records:", err);
            toast({
                title: "Failed to fetch medical records",
                description: "Please try again later",
                variant: "destructive",
            });
        }
    };

    useEffect(() => {
        fetchMedicalRecords();
    }, []);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
        const selectedFiles = Array.from(event.target.files || []);
        const validFiles = selectedFiles.every(
            (file) =>
                file.type === "application/pdf" && file.size <= maxFileSize
        );

        if (!validFiles) {
            setError(
                `Please upload PDF files under ${maxFileSize / 1024 / 1024}MB`
            );
            return;
        }

        setFiles(selectedFiles);
        setError("");
    };

    const processFiles = async (): Promise<void> => {
        setUploading(true);
        setProgress(0);

        try {
            const formData = new FormData();
            files.forEach((file) => formData.append("files", file));

            const response = await fetch("http://localhost:8000/api/rag", {
                method: "POST",
                body: formData,
            });

            toast({
                title: response.ok
                    ? "Files processed successfully"
                    : "Failed to process files",
                description: !response.ok && "Please try again",
            });

            if (response.ok) {
                setProgress(100);
                setFiles([]);
                fetchMedicalRecords();
            }
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : "Unknown error occurred";
            setError(errorMessage);
            onError?.({ message: errorMessage });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="w-full max-w-md mt-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                    type="file"
                    multiple
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                />

                <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center"
                >
                    <Upload className="w-12 h-12 text-gray-400 mb-4" />
                    <span className="text-sm text-gray-600">
                        Drop PDFs here or click to upload
                    </span>
                </label>

                {files.length > 0 && (
                    <div className="mt-4">
                        <p className="text-sm text-gray-600">
                            {files.length} file(s) selected
                        </p>
                        <button
                            onClick={processFiles}
                            disabled={uploading}
                            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
                        >
                            {uploading ? "Processing..." : "Process Files"}
                        </button>
                    </div>
                )}

                {uploading && (
                    <div className="mt-4">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                                className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                            {progress}% complete
                        </p>
                    </div>
                )}

                {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
            </div>
            <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Uploaded Records</h2>
                {medicalRecords.length === 1 ? (
                    <p className="text-gray-500">No records found</p>
                ) : (
                    <div className="space-y-4">
                        {medicalRecords.slice(1).map((record) => (
                            <div
                                key={record.id}
                                className="p-4 border rounded-lg hover:bg-gray-50"
                            >
                                <div className="flex justify-between items-center">
                                    <p className="font-medium">{record.name}</p>
                                    <FileText className="w-9 h-9" />
                                </div>
                                <p className="text-sm text-gray-500">
                                    Uploaded:{" "}
                                    {new Date(
                                        record.created_at
                                    ).toLocaleDateString()}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileUpload;
