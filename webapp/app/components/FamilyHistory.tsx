"use client";

import { useState } from "react";
import AddFamilyHistory from "./AddFamilyHistory";

export const FamilyHistory = () => {
    const [open, setOpen] = useState(false);

    return (
        <div className="flex flex-col gap-4">
            <AddFamilyHistory />
        </div>
    );
};
