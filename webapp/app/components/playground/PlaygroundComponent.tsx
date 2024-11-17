"use client";

import React, { useEffect, useRef, useState } from "react";
import { useWebSocketHandler } from "@/hooks/useWebSocketHandler";
import { createClient } from "@/utils/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn, getCreditsRemaining } from "@/lib/utils";
import ControlPanel from "./ControlPanel";
import { Messages } from "./Messages";
import { MoonStar } from "lucide-react";
import Image from "next/image";
import { updateUser } from "@/db/users";
import _ from "lodash";
import { GraphViz } from "../GraphViz";

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

interface PlaygroundProps {
    selectedUser: IUser;
    allToys: IToy[];
    allPersonalities: IPersonality[];
}

interface ITestCharacter {
    name: string;
    title: string;
    voiceId: string;
}

const characters: ITestCharacter[] = [
    {
        name: "paddington",
        title: "A polite bear from Peru",
        voiceId: "6c3eb71a-8d68-4fc6-85c5-27d283ecabc8",
    },
    {
        name: "peppa",
        title: "A lovable little pig",
        voiceId: "14d91296-eb6b-41d7-964c-856a8614d80e",
    },
];

const Playground: React.FC<PlaygroundProps> = ({ selectedUser }) => {
    const supabase = createClient();

    const {
        messageHistory,
        emotionDictionary,
        connectionStatus,
        microphoneStream,
        audioBuffer,
        handleClickOpenConnection,
        handleClickInterrupt,
        handleClickCloseConnection,
        muteMicrophone,
        unmuteMicrophone,
        isMuted,
    } = useWebSocketHandler(selectedUser);

    const selectedToy = selectedUser.toy!;
    const selectedPersonality = selectedUser.personality!;

    const [selectedCharacter, setSelectedCharacter] = useState<ITestCharacter>(
        characters[0]
    );

    // Debounced function to update the user on the server
    const debouncedUpdateUser = _.debounce(
        async ({
            personality_id,
            toy_id,
        }: {
            personality_id: string;
            toy_id: string;
        }) => {
            await updateUser(
                supabase,
                { personality_id, toy_id },
                selectedUser.user_id
            );
        },
        1000
    ); // Adjust the debounce delay as needed

    const [userState, setUserState] = useState<IUser>(selectedUser);
    const creditsRemaining = getCreditsRemaining(userState);
    // const ref: any = useRef<ComponentRef<typeof Messages> | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const isSelectDisabled = connectionStatus === "Open";

    const handleScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } =
                scrollContainerRef.current;
            const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px threshold
            setIsScrolledToBottom(isAtBottom);
        }
    };

    useEffect(() => {
        if (isScrolledToBottom) {
            scrollToBottom();
        }
    }, [messageHistory, emotionDictionary, isScrolledToBottom]);

    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;
        if (scrollContainer) {
            scrollContainer.addEventListener("scroll", handleScroll);
            return () =>
                scrollContainer.removeEventListener("scroll", handleScroll);
        }
    }, []);

    const [personalityState, setPersonalityState] =
        useState<IPersonality>(selectedPersonality);

    const onVoicePicked = (character: ITestCharacter) => {
        // Instantaneously update the state variable
        setSelectedCharacter(character);

        // Debounce the server update
        debouncedUpdateUser({
            personality_id: personalityState.personality_id,
            toy_id: character.voiceId,
        });
    };

    // console.log("credits remaining", creditsRemaining);

    return (
        <div className="flex flex-col font-quicksand">
            <div className="flex flex-col w-full gap-2">
                <div className="flex flex-row sm:items-center gap-4 justify-between sm:justify-normal items-start">
                    <h1 className="text-3xl font-extrabold">Playground</h1>
                </div>

                {messageHistory.length === 0 ? (
                    <div className="flex flex-col w-full justify-center gap-2">
                        <div className="flex flex-col max-h-[300px] items-start gap-8 my-4 transition-colors duration-200 ease-in-out">
                            <div className="flex flex-row items-start gap-8">
                                <div className="flex flex-row gap-6 w-full justify-center">
                                    {characters.map((character) => (
                                        <Card
                                            key={character.name}
                                            className={cn(
                                                "w-[220px] p-0 rounded-3xl cursor-pointer shadow-lg transition-all hover:scale-105",
                                                selectedCharacter === character
                                                    ? "border-primary border-2"
                                                    : "hover:border-primary/50"
                                            )}
                                            onClick={() =>
                                                onVoicePicked(character)
                                            }
                                        >
                                            <CardContent className="flex justify-center p-0">
                                                <Image
                                                    src={`/${character.name}.jpeg`}
                                                    alt={character.name}
                                                    width={220}
                                                    height={200}
                                                    className="rounded-3xl rounded-br-none rounded-bl-none"
                                                />
                                            </CardContent>
                                            <CardHeader>
                                                <CardTitle>
                                                    {character.name[0].toUpperCase() +
                                                        character.name.slice(1)}
                                                </CardTitle>
                                                <CardDescription>
                                                    {character.title}
                                                </CardDescription>
                                            </CardHeader>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                            <div className="w-full flex flex-col gap-8 items-center justify-center">
                                <AnimatePresence>
                                    <motion.div
                                        initial="initial"
                                        animate="enter"
                                        exit="exit"
                                        variants={{
                                            initial: { opacity: 0 },
                                            enter: { opacity: 1 },
                                            exit: { opacity: 0 },
                                        }}
                                    >
                                        <GraphViz>
                                            <Button
                                                disabled={
                                                    !selectedUser ||
                                                    isSelectDisabled
                                                }
                                                className={
                                                    "z-50 flex items-center gap-1.5 rounded-full shadow-xl"
                                                }
                                                onClick={
                                                    () => {}
                                                    // handleClickOpenConnection
                                                }
                                                size="lg"
                                            >
                                                <MoonStar
                                                    size={16}
                                                    strokeWidth={3}
                                                    stroke={"currentColor"}
                                                />
                                                <span className="text-xl font-semibold">
                                                    Talk
                                                </span>
                                            </Button>
                                        </GraphViz>
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>

            <Messages
                messageHistory={messageHistory}
                selectedUser={selectedUser}
                selectedCharacter={selectedCharacter}
                emotionDictionary={emotionDictionary}
                handleScroll={handleScroll}
                isScrolledToBottom={isScrolledToBottom}
            />
            <ControlPanel
                connectionStatus={connectionStatus}
                isMuted={isMuted}
                muteMicrophone={muteMicrophone}
                unmuteMicrophone={unmuteMicrophone}
                handleClickInterrupt={handleClickInterrupt}
                handleClickCloseConnection={handleClickCloseConnection}
                microphoneStream={microphoneStream}
                audioBuffer={audioBuffer}
            />
        </div>
    );
};

export default Playground;
