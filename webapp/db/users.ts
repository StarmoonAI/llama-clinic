import { type SupabaseClient, type User } from "@supabase/supabase-js";

export const getUserById = async (supabase: SupabaseClient, id: string) => {
    const { data, error } = await supabase
        .from("users")
        .select("*, toy:toy_id(*), personality:personality_id(*)")
        .eq("user_id", id)
        .single();

    if (error) {
        // console.log("error", error);
    }

    return data as IUser | undefined;
};

export const updateUser = async (
    supabase: SupabaseClient,
    user: Partial<IUser>,
    userId: string
) => {
    const { error } = await supabase
        .from("users")
        .update(user)
        .eq("user_id", userId);

    if (error) {
        // console.log("error", error);
    }
};

export const doesUserExist = async (
    supabase: SupabaseClient,
    authUser: User
) => {
    const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", authUser.email)
        .single();

    if (error) {
        // console.log("error", error);
    }

    return !!user;
};
