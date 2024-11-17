"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const relations = [
    "Father",
    "Mother",
    "Brother",
    "Sister",
    "Grandfather (Paternal)",
    "Grandmother (Paternal)",
    "Grandfather (Maternal)",
    "Grandmother (Maternal)",
];

const formSchema = z.object({
    relation: z.string({
        required_error: "Please select a relation.",
    }),
    condition: z.string().min(10, {
        message: "Condition must be at least 10 characters.",
    }),
});

// Add type for family history entry
type FamilyHistoryEntry = {
    relation: string;
    condition: string;
    timestamp: string;
};

const submitToAPI = async (data: z.infer<typeof formSchema>) => {
    try {
        const response = await fetch("http://localhost:8000/api/rag_text", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error("API call failed");

        // Store in localStorage
        const historyEntry: FamilyHistoryEntry = {
            ...data,
            timestamp: new Date().toISOString(),
        };

        const existingHistory = JSON.parse(
            localStorage.getItem("familyHistory") || "[]"
        );
        localStorage.setItem(
            "familyHistory",
            JSON.stringify([...existingHistory, historyEntry])
        );

        return { success: true, message: "Data submitted successfully" };
    } catch (error) {
        console.error("API Error:", error);
        throw error;
    }
};

export default function AddFamilyHistory() {
    const [history, setHistory] = useState<FamilyHistoryEntry[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load history from localStorage on component mount
    useEffect(() => {
        const savedHistory = JSON.parse(
            localStorage.getItem("familyHistory") || "[]"
        );
        setHistory(savedHistory);
    }, []);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            relation: "",
            condition: "",
        },
    });

    // Update history state after successful submission
    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        try {
            const result = await submitToAPI(values);
            if (result.success) {
                const savedHistory = JSON.parse(
                    localStorage.getItem("familyHistory") || "[]"
                );
                setHistory(savedHistory);
                toast({
                    title: "Form submitted",
                    description:
                        "Your family health information has been recorded.",
                });
                form.reset();
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "There was a problem submitting your form.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="w-full flex flex-row gap-4 mt-4">
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4 w-2/5 p-4 bg-white rounded-lg"
                >
                    <FormField
                        control={form.control}
                        name="relation"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Relation</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select relation" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {relations.map((relation) => (
                                            <SelectItem
                                                key={relation}
                                                value={relation}
                                            >
                                                {relation}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="condition"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Condition</FormLabel>
                                <Textarea
                                    rows={3}
                                    placeholder="Enter condition"
                                    {...field}
                                />
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isSubmitting}
                    >
                        {isSubmitting
                            ? "Submitting..."
                            : "Add to family history"}
                    </Button>
                </form>
            </Form>
            <div className="w-3/5 space-y-4">
                <h2 className="text-xl font-semibold mb-4">Family History</h2>
                {history.length === 0 ? (
                    <p className="text-muted-foreground">
                        No family history recorded yet.
                    </p>
                ) : (
                    history.map((entry, index) => (
                        <Card key={index} className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    {entry.relation}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    {new Date(
                                        entry.timestamp
                                    ).toLocaleDateString()}
                                </p>
                            </CardHeader>
                            <CardContent>
                                <p>{entry.condition}</p>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
