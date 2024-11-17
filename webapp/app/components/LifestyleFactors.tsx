"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Plus } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import dayjs from "dayjs";

const formSchema = z.object({
  lifestyleFactor: z.string().min(5, {
    message: "Lifestyle factor must be at least 5 characters.",
  }),
});

// Add type for family history entry
type LifestyleFactorsEntry = {
  lifestyleFactor: string;
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

    console.log("JSON.stringify(data)", JSON.stringify(data));

    if (!response.ok) throw new Error("API call failed");

    // Store in localStorage
    const lifestyleFactorsEntry: LifestyleFactorsEntry = {
      ...data,
      timestamp: new Date().toISOString(),
    };

    const existingHistory = JSON.parse(
      localStorage.getItem("lifestyleFactors") || "[]"
    );
    localStorage.setItem(
      "lifestyleFactors",
      JSON.stringify([...existingHistory, lifestyleFactorsEntry])
    );

    return { success: true, message: "Data submitted successfully" };
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

export default function LifestyleFactors() {
  const [history, setHistory] = useState<LifestyleFactorsEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load history from localStorage on component mount
  useEffect(() => {
    const savedHistory = JSON.parse(
      localStorage.getItem("lifestyleFactors") || "[]"
    );
    setHistory(savedHistory);
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lifestyleFactor: "",
    },
  });

  // Update history state after successful submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const result = await submitToAPI(values);
      if (result.success) {
        const savedHistory = JSON.parse(
          localStorage.getItem("lifestyleFactors") || "[]"
        );
        setHistory(savedHistory);
        toast({
          title: "Form submitted",
          description: "Your child's lifestyle factors have been recorded.",
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
          className="h-fit space-y-4 w-2/5 p-4 bg-white rounded-lg"
        >
          <FormField
            control={form.control}
            name="lifestyleFactor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lifestyle factor</FormLabel>
                <Textarea
                  rows={3}
                  placeholder="Enter lifestyle factor"
                  {...field}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="w-fit"
            disabled={isSubmitting}
            size="sm"
          >
            <Plus size={16} />
            {isSubmitting ? "Submitting..." : "Add to lifestyle factors"}
          </Button>
        </form>
      </Form>
      <div className="w-3/5 space-y-4">
        <h2 className="text-xl font-semibold mb-4">Lifestyle Factors</h2>
        {history.length === 0 ? (
          <p className="text-muted-foreground">
            No lifestyle factors recorded yet.
          </p>
        ) : (
          history.map((entry, index) => (
            <Card key={index} className="shadow-sm">
              <CardHeader>
                <p className="text-sm text-muted-foreground">
                  {new Date(entry.timestamp).toLocaleDateString()}
                </p>
              </CardHeader>
              <CardContent>
                <p>{entry.lifestyleFactor}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
