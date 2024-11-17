import { createClient } from "@/utils/supabase/server";

export default async function Index() {
    const supabase = createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    return (
        <main className="flex flex-1 flex-col mx-auto w-full gap-6 my-8">
            {/* Illustration */}
            <div className="max-w-4xl text-center mx-8 md:mx-auto">
                <h1 className="text-4xl flex justify-center items-center flex-row gap-2 sm:hidden mb-5 font-semibold">
                    Llama Clinic
                </h1>
                <h1
                    className="font-inter-tight- text-3xl sm:text-4xl md:text-6xl font-semibold sm:mt-14 tracking-tight text-stone-900"
                    style={{ lineHeight: "1.25" }}
                >
                    Llama Clinic is an AI-powered clinic for your kids
                </h1>
            </div>
        </main>
    );
}
