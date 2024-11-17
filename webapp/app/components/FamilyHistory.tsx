"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";

export const FamilyHistory = () => {
    const [open, setOpen] = useState(false);

    return (
        <div className="flex flex-col gap-4">
            <Button className="flex flex-row gap-2 w-fit" size="sm">
                <Plus size={16} />
                Add family history
            </Button>
        </div>
    );
};
