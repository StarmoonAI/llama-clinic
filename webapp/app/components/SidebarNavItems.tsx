"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dot, Heart } from "lucide-react";
import { GraphModal } from "./GraphModal";

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
    items: {
        href: string;
        title: string;
        icon: React.ReactNode;
    }[];
}

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
    const pathname = usePathname();

    return (
        <nav
            className={cn(
                "flex space-x-2 font-quicksand justify-between px-4 sm:justify-evenly md:justify-start md:flex-col md:space-x-0 md:space-y-6 rounded-xl",
                className
            )}
            {...props}
        >
            <GraphModal />
            {items.map((item) => {
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            buttonVariants({ variant: "ghost" }),
                            pathname === item.href ? "bg-muted" : "",
                            "font-quicksand justify-start rounded-full text-sm sm:text-xl font-semibold text-stone-700"
                        )}
                    >
                        <span className="mr-2">{item.icon}</span>
                        {item.title}
                        {pathname === item.href && (
                            <Dot
                                className="hidden sm:block flex-shrink-0"
                                size={48}
                            />
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}
