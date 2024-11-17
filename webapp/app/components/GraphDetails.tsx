import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { baseColors } from "@/lib/data";
import d3 from "d3";

interface GraphDetailsProps {
    graphData: GraphData;
    selectedNode: NodeData | null;
    selectedNeighbors: Set<string>;
    handleClearSelection: () => void;
    uniqueTypes: string[];
    onNodeSelect: (node: NodeData, data: GraphData) => void; // Add this new prop
}

export const GraphDetails: React.FC<GraphDetailsProps> = ({
    graphData,
    selectedNode,
    selectedNeighbors,
    handleClearSelection,
    uniqueTypes,
    onNodeSelect,
}) => {
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1); // Start at -1 since no history initially

    const handleNodeClick = (nodeId: string) => {
        // Remove any forward history when making a new selection
        const newHistory = [...history.slice(0, historyIndex + 1), nodeId];
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const handleBack = () => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            const nodeId = history[historyIndex - 1];
            const node = graphData.nodes.find((n) => n.id === nodeId);
            if (node) {
                onNodeSelect(node, graphData);
            }
        }
    };

    const handleForward = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
            const nodeId = history[historyIndex + 1];
            const node = graphData.nodes.find((n) => n.id === nodeId);
            if (node) {
                onNodeSelect(node, graphData);
            }
        }
    };

    // Ensure we have enough colors by repeating the array if necessary
    const colors = Array.from(
        { length: uniqueTypes.length },
        (_, i) => baseColors[i % baseColors.length]
    );
    // Create dynamic color scale
    const getColor = (type: string): string => {
        const index = uniqueTypes.indexOf(type);
        return colors[index] || colors[0]; // fallback to first color if type not found
    };

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
                        disabled={historyIndex <= 0}
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
            <div className="container mx-auto p-4">
                {selectedNode && (
                    <div className="bg-white p-4 rounded-lg shadow-lg border w-full">
                        <div className="flex items-center gap-3 mb-2">
                            {/* Node Name */}
                            <h2 className="font-semibold text-xl">
                                {selectedNode.id}
                            </h2>

                            {/* Node Type Badge */}
                            <div className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100">
                                <div
                                    className="w-2 h-2 rounded-full mr-2"
                                    style={{
                                        backgroundColor: getColor(
                                            selectedNode.type
                                        ),
                                    }}
                                />
                                <span className="text-sm text-gray-600">
                                    {selectedNode.type}
                                </span>
                            </div>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-600 leading-relaxed mb-2">
                            {selectedNode.description}
                        </p>

                        {/* Connection Count */}
                        <div className="text-sm text-gray-500">
                            Connected to {selectedNeighbors.size}{" "}
                            {selectedNeighbors.size === 1 ? "node" : "nodes"}
                        </div>
                        <button
                            onClick={handleClearSelection}
                            className="mt-3 text-sm text-blue-600 hover:text-blue-800"
                        >
                            Clear Selection
                        </button>

                        {/* Add neighbor nodes section */}
                        <div className="mt-8">
                            <div className="font-medium mb-2">
                                Connected Nodes:
                            </div>
                            <div className="space-y-4 overflow-y-auto max-h-[300px]">
                                {Array.from(selectedNeighbors).map(
                                    (neighborId) => {
                                        const neighbor = graphData.nodes.find(
                                            (n) => n.id === neighborId
                                        );
                                        if (!neighbor) return null;

                                        return (
                                            <div
                                                key={neighborId}
                                                onClick={() => {
                                                    handleNodeClick(neighborId);
                                                    onNodeSelect(
                                                        neighbor,
                                                        graphData
                                                    );
                                                }}
                                                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                {/* Header Section */}
                                                <div className="flex items-center gap-3 mb-2">
                                                    {/* Node Name */}
                                                    <h3 className="font-semibold text-lg">
                                                        {neighbor.id}
                                                    </h3>

                                                    {/* Node Type Badge */}
                                                    <div className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100">
                                                        <div
                                                            className="w-2 h-2 rounded-full mr-2"
                                                            style={{
                                                                backgroundColor:
                                                                    getColor(
                                                                        neighbor.type
                                                                    ),
                                                            }}
                                                        />
                                                        <span className="text-sm text-gray-600">
                                                            {neighbor.type}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Description Section */}
                                                {neighbor.description && (
                                                    <p className="text-sm text-gray-600 leading-relaxed">
                                                        {neighbor.description
                                                            .length > 100
                                                            ? `${neighbor.description.slice(0, 100)}...`
                                                            : neighbor.description}
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    }
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
