"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Dot } from "lucide-react";

interface MedicalRecordsOptionsProps extends React.HTMLAttributes<HTMLElement> {
    items: {
        href: string;
        display: string;
    }[];
}

export function MedicalRecordsOptions({
    className,
    items,
    ...props
}: MedicalRecordsOptionsProps) {
    const pathname = usePathname();

    return (
        <div
            className={cn("flex flex-row gap-4 items-center", className)}
            {...props}
        >
            {items.map((item) => {
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            buttonVariants({ variant: "ghost" }),
                            "font-quicksand justify-start rounded-full text-sm sm:text-md font-semibold text-stone-700",
                            pathname === item.href ? "bg-transparent/5" : ""
                        )}
                    >
                        {item.display}
                    </Link>
                );
            })}
        </div>
    );
}
