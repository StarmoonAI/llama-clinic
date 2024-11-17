import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Phone, BetweenHorizontalEnd, Hand } from "lucide-react";
import { cn } from "@/lib/utils";
import Visualizer from "./Visualizer";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface ControlPanelProps {
    connectionStatus: string;
    isMuted: boolean;
    muteMicrophone: () => void;
    unmuteMicrophone: () => void;
    handleClickInterrupt: () => void;
    handleClickCloseConnection: () => void;
    microphoneStream: MediaStream | null | undefined;
    audioBuffer: AudioBuffer | null | undefined;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
    connectionStatus,
    isMuted,
    muteMicrophone,
    unmuteMicrophone,
    handleClickInterrupt,
    handleClickCloseConnection,
    microphoneStream,
    audioBuffer,
}) => {
    return (
        <div
            className={cn(
                "fixed bottom-8 left-0 w-full p-6 flex items-center justify-center",
                "from-card via-card/90 to-card/0"
            )}
        >
            <AnimatePresence>
                {connectionStatus === "Open" ? (
                    <motion.div
                        initial={{
                            y: "100%",
                            opacity: 0,
                        }}
                        animate={{
                            y: 0,
                            opacity: 1,
                        }}
                        exit={{
                            y: "100%",
                            opacity: 0,
                        }}
                        className={
                            "p-4 bg-card border border-border rounded-lg shadow-sm flex items-center gap-4"
                        }
                    >
                        <Toggle
                            pressed={!isMuted}
                            onPressedChange={() => {
                                if (isMuted) {
                                    unmuteMicrophone();
                                } else {
                                    muteMicrophone();
                                }
                            }}
                            className="rounded-full px-4"
                            size={"lg"}
                        >
                            {isMuted ? (
                                <MicOff className={"size-7"} />
                            ) : (
                                <Mic className={"size-7"} />
                            )}
                        </Toggle>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Button
                                        className={
                                            "bg-gray-100 hover:bg-gray-200 rounded-full px-4"
                                        }
                                        onClick={() => {
                                            handleClickInterrupt();
                                            // addSessionTime(
                                            //     callDurationTimestamp ?? "00:00:00",
                                            // );
                                        }}
                                        variant={"default"}
                                        size={"lg"}
                                    >
                                        <span>
                                            <Hand
                                                className={
                                                    "size-6 opacity-50 text-black"
                                                }
                                                strokeWidth={2}
                                                stroke={"currentColor"}
                                            />
                                        </span>
                                        {/* <span>Interrupt</span> */}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Interrupt</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <div className="flex justify-center items-center">
                            <Visualizer
                                stream={microphoneStream || undefined}
                                audioBuffer={audioBuffer || undefined}
                            />
                        </div>
                        <Button
                            className={
                                "flex items-center gap-1 rounded-full px-4"
                            }
                            onClick={() => {
                                handleClickCloseConnection();
                                // addSessionTime(
                                //     callDurationTimestamp ?? "00:00:00",
                                // );
                            }}
                            size="lg"
                            variant={"destructive"}
                        >
                            <Phone
                                className={"size-6"}
                                strokeWidth={2}
                                stroke={"currentColor"}
                            />
                        </Button>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    );
};

export default ControlPanel;
