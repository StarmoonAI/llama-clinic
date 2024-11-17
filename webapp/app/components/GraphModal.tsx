"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart } from "lucide-react";
import { XMLParser } from "fast-xml-parser";
import Cytoscape from "./Cytoscape"; // Assuming GraphVisualizer is your visualization component
import { useEffect } from "react";
import { useState } from "react";

interface GraphNode {
    id: string;
    label: string;
}

interface GraphEdge {
    source: string;
    target: string;
}

interface GraphMLNode {
    "@_id": string;
    data?: {
        "#text": string;
    };
}

interface GraphMLEdge {
    "@_source": string;
    "@_target": string;
}

interface ParsedGraphML {
    graphml: {
        graph: {
            node: GraphMLNode[];
            edge: GraphMLEdge[];
        };
    };
}

export function GraphModal() {
    const [graphData, setGraphData] = useState<{
        nodes: GraphNode[];
        edges: GraphEdge[];
    } | null>(null);

    console.log(graphData);

    useEffect(() => {
        // Update the path to start with the public URL
        fetch("/graph_chunk_entity_relation.graphml", {
            headers: {
                "Content-Type": "application/xml", // Specify content type
            },
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then((data) => {
                const parser = new XMLParser({
                    ignoreAttributes: false, // Important for GraphML attributes
                    attributeNamePrefix: "@_", // Matches your interface structure
                });
                const parsedData = parser.parse(data) as ParsedGraphML;

                // Add safety checks for the data structure
                if (
                    !parsedData.graphml?.graph?.node ||
                    !parsedData.graphml?.graph?.edge
                ) {
                    throw new Error("Invalid GraphML structure");
                }

                // Transform to array if single node/edge
                const nodes = Array.isArray(parsedData.graphml.graph.node)
                    ? parsedData.graphml.graph.node
                    : [parsedData.graphml.graph.node];
                const edges = Array.isArray(parsedData.graphml.graph.edge)
                    ? parsedData.graphml.graph.edge
                    : [parsedData.graphml.graph.edge];

                setGraphData({
                    nodes: nodes.map((node) => ({
                        id: node["@_id"],
                        label: node.data?.["#text"] || node["@_id"],
                    })),
                    edges: edges.map((edge) => ({
                        source: edge["@_source"],
                        target: edge["@_target"],
                    })),
                });
            })
            .catch((error) => {
                console.error("Error loading GraphML:", error);
                // Optionally set an error state here
            });
    }, []);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="primary"
                    size="lg"
                    className="rounded-full text-lg font-semibold flex flex-row items-center gap-2"
                >
                    <Heart size={20} strokeWidth={3} />
                    <span>Health explorer</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] h-[90vh]">
                <DialogTitle>Health explorer</DialogTitle>
                <div>
                    {graphData ? (
                        <Cytoscape
                            nodes={graphData.nodes}
                            edges={graphData.edges}
                        />
                    ) : (
                        <p>Loading graph...</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
