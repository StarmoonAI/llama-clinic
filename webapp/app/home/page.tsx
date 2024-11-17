import { doesUserExist, getUserById } from "@/db/users";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Playground from "../components/playground/PlaygroundComponent";
import { defaultPersonalityId, defaultToyId } from "@/lib/data";

export default async function Home() {
    const supabase = createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const dbUser = await getUserById(supabase, user!.id);

    return (
        <div>
            {dbUser && (
                <Playground
                    allPersonalities={[]}
                    selectedUser={dbUser}
                    allToys={[]}
                />
            )}
        </div>
    );
}
