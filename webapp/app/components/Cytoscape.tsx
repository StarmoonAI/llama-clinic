import React, { useEffect } from "react";
import cytoscape from "cytoscape";

interface Node {
    id: string;
    label: string;
}

interface Edge {
    source: string;
    target: string;
}

interface GraphVisualizerProps {
    nodes: Node[];
    edges: Edge[];
}

function GraphVisualizer({ nodes, edges }: GraphVisualizerProps) {
    const cyRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!cyRef.current) return;

        // Initialize Cytoscape visualization
        const cy = cytoscape({
            container: cyRef.current, // ID of the container
            elements: [
                ...nodes.map((node) => ({
                    data: { id: node.id, label: node.label },
                })),
                ...edges.map((edge) => ({
                    data: { source: edge.source, target: edge.target },
                })),
            ],
            style: [
                {
                    selector: "node",
                    style: {
                        label: "data(label)",
                        "background-color": "#0074D9",
                    },
                },
                {
                    selector: "edge",
                    style: {
                        width: 2,
                        "line-color": "#A3A3A3",
                    },
                },
            ],
            layout: {
                name: "cose", // Choose a suitable layout
            },
        });
        // Clean up function to destroy the graph when component unmounts
        return () => {
            cy.destroy();
        };
    }, [nodes, edges]); // Re-run when nodes or edges change

    return (
        <div
            ref={cyRef}
            style={{
                width: "100%", // Explicit width
                height: "100%", // Explicit height
                // border: "1px solid #ccc", // Visual boundary
            }}
        />
    );
}

export default GraphVisualizer;
