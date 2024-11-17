import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

type NodeType =
    | "POTENTIAL_TREATMENT"
    | "CURRENT_SYMPTOM"
    | "FAMILY_HISTORY"
    | "LIFESTYLE_FACTOR";

interface Node {
    id: string;
    type: NodeType;
    title: string;
    description: string;
    connections: string[];
}

const mockGraph: Record<string, Node> = {
    ADHD_TREATMENT: {
        id: "ADHD_TREATMENT",
        type: "POTENTIAL_TREATMENT",
        title: "ADHD Treatment Options",
        description:
            "Potential treatments for Attention Deficit Hyperactivity Disorder",
        connections: [
            "INATTENTION",
            "HYPERACTIVITY",
            "FAMILY_HISTORY_ADHD",
            "SLEEP_HABITS",
        ],
    },
    INATTENTION: {
        id: "INATTENTION",
        type: "CURRENT_SYMPTOM",
        title: "Inattention",
        description: "Difficulty focusing on tasks or activities",
        connections: ["ADHD_TREATMENT"],
    },
    HYPERACTIVITY: {
        id: "HYPERACTIVITY",
        type: "CURRENT_SYMPTOM",
        title: "Hyperactivity",
        description: "Excessive movement and restlessness",
        connections: ["ADHD_TREATMENT"],
    },
    FAMILY_HISTORY_ADHD: {
        id: "FAMILY_HISTORY_ADHD",
        type: "FAMILY_HISTORY",
        title: "Family History of ADHD",
        description: "Presence of ADHD in immediate family members",
        connections: ["ADHD_TREATMENT"],
    },
    SLEEP_HABITS: {
        id: "SLEEP_HABITS",
        type: "LIFESTYLE_FACTOR",
        title: "Sleep Habits",
        description: "Quality and duration of sleep",
        connections: ["ADHD_TREATMENT"],
    },
};

const nodeDetails: Record<
    NodeType,
    {
        color: string;
        icon: React.ReactNode;
        title: string;
        neighborTitle: string;
    }
> = {
    POTENTIAL_TREATMENT: {
        color: "border-blue-200 hover:border-blue-300",
        icon: <span className="text-blue-500">💊</span>,
        title: "Potential Treatment",
        neighborTitle: "Related treatments",
    },
    CURRENT_SYMPTOM: {
        color: "border-red-200 hover:border-red-300",
        icon: <span className="text-red-500">🔔</span>,
        title: "Current Symptom",
        neighborTitle: "Related symptoms",
    },
    FAMILY_HISTORY: {
        color: "border-green-200 hover:border-green-300",
        icon: <span className="text-green-500">👪</span>,
        title: "Family History",
        neighborTitle: "Related family history",
    },
    LIFESTYLE_FACTOR: {
        color: "border-yellow-200 hover:border-yellow-300",
        icon: <span className="text-yellow-500">🌿</span>,
        title: "Lifestyle Factor",
        neighborTitle: "Related lifestyle factors",
    },
};

interface GraphDetailsProps {
    graphData: GraphData;
    selectedNode: NodeData | null;
    selectedNeighbors: Set<string>;
    handleClearSelection: () => void;
}

export const GraphDetails: React.FC<GraphDetailsProps> = ({
    graphData,
    selectedNode,
    selectedNeighbors,
    handleClearSelection,
}) => {
    const [currentNode, setCurrentNode] = useState<string>("ADHD_TREATMENT");
    const [history, setHistory] = useState<string[]>(["ADHD_TREATMENT"]);
    const [historyIndex, setHistoryIndex] = useState(0);

    const handleNodeClick = (nodeId: string) => {
        setCurrentNode(nodeId);
        setHistory((prev) => [...prev.slice(0, historyIndex + 1), nodeId]);
        setHistoryIndex((prev) => prev + 1);
    };

    const handleBack = () => {
        if (historyIndex > 0) {
            setHistoryIndex((prev) => prev - 1);
            setCurrentNode(history[historyIndex - 1]);
        }
    };

    const handleForward = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex((prev) => prev + 1);
            setCurrentNode(history[historyIndex + 1]);
        }
    };

    const renderNode = (node: Node) => {
        return (
            <Card
                key={node.id}
                className={`${nodeDetails[node.type].color} border-2 cursor-pointer transition-all duration-200 ease-in-out transform hover:scale-105 mb-4`}
                onClick={() => handleNodeClick(node.id)}
            >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        {nodeDetails[node.type].icon} {node.title}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">
                        {node.description}
                    </p>
                </CardContent>
            </Card>
        );
    };

    const currentNodeData = mockGraph[currentNode];

    return (
        <div
            className="rounded-xl bg-gray-100 h-full"
            // style={{ maxWidth: "40vw" }}
        >
            <div className="flex flex-row items-center gap-4">
                <div className="flex flex-row items-center mt-2">
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        disabled={historyIndex === 0}
                        size="icon"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={handleForward}
                        disabled={historyIndex === history.length - 1}
                        size="icon"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            <div className="container mx-auto p-4 max-w-4xl">
                {selectedNode && (
                    <div className="bg-white p-4 rounded-lg shadow-lg border max-w-xs">
                        <div className="font-bold text-lg">
                            {selectedNode.id}
                        </div>
                        <div className="text-sm text-gray-600">
                            {selectedNode.type}
                        </div>
                        <div className="mt-2 text-sm">
                            {selectedNode.description}
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                            Connected to {selectedNeighbors.size} node(s)
                        </div>
                        <button
                            onClick={handleClearSelection}
                            className="mt-3 text-sm text-blue-600 hover:text-blue-800"
                        >
                            Clear Selection
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
