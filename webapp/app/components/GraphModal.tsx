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

import { Heart } from "lucide-react";
import { XMLParser } from "fast-xml-parser";
import { useEffect } from "react";
import { useState } from "react";
import { GraphDetails } from "./GraphDetails";
import GraphViz from "./GraphViz";

interface XMLNodeData {
    "@_id": string;
    "@_key"?: string;
    data:
        | Array<{
              "@_key": string;
              "#text": string;
          }>
        | {
              "@_key": string;
              "#text": string;
          };
}

interface XMLEdgeData {
    "@_source": string;
    "@_target": string;
    data:
        | Array<{
              "@_key": string;
              "#text": string;
          }>
        | {
              "@_key": string;
              "#text": string;
          };
}

interface ParsedXML {
    graphml: {
        graph: {
            node: XMLNodeData[] | XMLNodeData;
            edge: XMLEdgeData[] | XMLEdgeData;
        };
    };
}

export function GraphModal() {
    const [graphData, setGraphData] = useState<GraphData>({
        nodes: [],
        links: [],
    });
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAndParseXML = async (): Promise<void> => {
            try {
                setLoading(true);
                const response = await fetch(
                    "/graph_chunk_entity_relation.graphml"
                );
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const xmlText = await response.text();

                const parser = new XMLParser({
                    ignoreAttributes: false,
                    attributeNamePrefix: "@_",
                    allowBooleanAttributes: true,
                });

                const jsonObj = parser.parse(xmlText) as ParsedXML;
                const graphml = jsonObj.graphml;
                const graph = graphml.graph;

                // Parse nodes
                const nodesArray = Array.isArray(graph.node)
                    ? graph.node
                    : [graph.node];
                const parsedNodes: NodeData[] = nodesArray.map(
                    (node: XMLNodeData) => {
                        const dataArray = Array.isArray(node.data)
                            ? node.data
                            : [node.data];
                        const nodeData: NodeData = {
                            id: node["@_id"].replace(/"/g, ""),
                            type: "",
                            description: "",
                            sourceId: "",
                        };

                        dataArray.forEach((d) => {
                            switch (d["@_key"]) {
                                case "d0":
                                    nodeData.type = d["#text"].replace(
                                        /"/g,
                                        ""
                                    );
                                    break;
                                case "d1":
                                    nodeData.description = d["#text"].replace(
                                        /"/g,
                                        ""
                                    );
                                    break;
                                case "d2":
                                    nodeData.sourceId = d["#text"];
                                    break;
                            }
                        });

                        return nodeData;
                    }
                );

                // Parse edges
                const edgesArray = Array.isArray(graph.edge)
                    ? graph.edge
                    : [graph.edge];
                const parsedEdges: EdgeData[] = edgesArray.map(
                    (edge: XMLEdgeData) => {
                        const dataArray = Array.isArray(edge.data)
                            ? edge.data
                            : [edge.data];
                        const edgeData: EdgeData = {
                            source: edge["@_source"].replace(/"/g, ""),
                            target: edge["@_target"].replace(/"/g, ""),
                            weight: 1,
                            description: "",
                            keywords: [],
                        };

                        dataArray.forEach((d) => {
                            switch (d["@_key"]) {
                                case "d3":
                                    edgeData.weight = parseFloat(d["#text"]);
                                    break;
                                case "d4":
                                    edgeData.description = d["#text"].replace(
                                        /"/g,
                                        ""
                                    );
                                    break;
                                case "d5":
                                    edgeData.keywords = d["#text"]
                                        .replace(/"/g, "")
                                        .split(",")
                                        .map((k) => k.trim());
                                    break;
                            }
                        });

                        return edgeData;
                    }
                );

                setGraphData({
                    nodes: parsedNodes,
                    links: parsedEdges,
                });
            } catch (err) {
                const errorMessage =
                    err instanceof Error
                        ? err.message
                        : "An unknown error occurred";
                setError(errorMessage);
                console.error("Error parsing XML:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAndParseXML();
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
                <DialogTitle className="text-2xl font-bold">
                    Health explorer
                </DialogTitle>
                <div className="w-full h-full">
                    <div className="flex flex-row w-full h-full">
                        <div className="w-3/5 h-full">
                            <GraphViz data={graphData} />
                        </div>
                        <div className="w-2/5 h-full">
                            <GraphDetails graphData={graphData} />
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
