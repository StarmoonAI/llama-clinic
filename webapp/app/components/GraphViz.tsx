import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

interface GraphVizProps {
    data: GraphData;
    handleNodeSelect: (node: NodeData, data: GraphData) => void;
    selectedNode: NodeData | null;
    selectedNeighbors: Set<string>;
    handleClearSelection: () => void;
}

const MedicalGraph: React.FC<GraphVizProps> = ({
    data,
    handleNodeSelect,
    selectedNode,
    selectedNeighbors,
    handleClearSelection,
}) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    // Get unique node types
    const uniqueTypes = [...new Set(data.nodes.map((node) => node.type))];

    // Generate colors for the unique types
    const colors = d3.schemeSet3.slice(0, uniqueTypes.length);

    // Create dynamic color scale
    const colorScale = d3.scaleOrdinal().domain(uniqueTypes).range(colors);

    useEffect(() => {
        if (!svgRef.current || !data.nodes.length) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        // Create force simulation
        const simulation = d3
            .forceSimulation(data.nodes as d3.SimulationNodeDatum[])
            .force(
                "link",
                d3
                    .forceLink(data.links)
                    .id((d: any) => d.id)
                    .distance(100)
            )
            .force("charge", d3.forceManyBody().strength(-200))
            .force(
                "center",
                d3.forceCenter(dimensions.width / 2, dimensions.height / 2)
            )
            .force("collision", d3.forceCollide().radius(50));

        // Create container group with zoom
        const g = svg.append("g");

        // Add zoom behavior
        const zoom = d3
            .zoom()
            .scaleExtent([0.1, 4])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            });

        svg.call(zoom as any);

        // Create links
        const links = g
            .append("g")
            .selectAll("line")
            .data(data.links)
            .join("line")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.6)
            .attr("stroke-width", (d) => Math.sqrt(d.weight));

        // Create nodes group
        const nodes = g
            .append("g")
            .selectAll("g")
            .data(data.nodes)
            .join("g")
            .call(
                d3
                    .drag<SVGGElement, NodeData>()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended) as any
            );

        // Add circles to nodes
        nodes
            .append("circle")
            .attr("r", 20)
            .attr("fill", (d) => colorScale(d.type) as string)
            .attr("stroke", "#fff")
            .attr("stroke-width", 2)
            .attr("class", "cursor-pointer transition-all duration-200")
            .on("click", (event, d) => handleNodeSelect(d, data));

        // Add labels to nodes
        nodes
            .append("text")
            .text((d) => d.id)
            .attr("text-anchor", "middle")
            .attr("dy", 30)
            .attr("class", "text-sm fill-gray-700 pointer-events-none");

        // Update visual states based on selection
        const updateSelection = () => {
            nodes
                .selectAll("circle")
                .attr("stroke", (d: any) => {
                    if (selectedNode?.id === d.id) return "#000";
                    if (selectedNeighbors.has(d.id)) return "#666";
                    return "#fff";
                })
                .attr("stroke-width", (d: any) => {
                    if (selectedNode?.id === d.id) return 4;
                    if (selectedNeighbors.has(d.id)) return 3;
                    return 2;
                })
                .attr("opacity", (d: any) => {
                    if (!selectedNode) return 1;
                    return selectedNode.id === d.id ||
                        selectedNeighbors.has(d.id)
                        ? 1
                        : 0.3;
                });

            links
                .attr("opacity", (d) => {
                    if (!selectedNode) return 0.6;
                    const sourceId =
                        typeof d.source === "string" ? d.source : d.source.id;
                    const targetId =
                        typeof d.target === "string" ? d.target : d.target.id;
                    return sourceId === selectedNode.id ||
                        targetId === selectedNode.id
                        ? 1
                        : 0.1;
                })
                .attr("stroke-width", (d) => {
                    if (!selectedNode) return Math.sqrt(d.weight);
                    const sourceId =
                        typeof d.source === "string" ? d.source : d.source.id;
                    const targetId =
                        typeof d.target === "string" ? d.target : d.target.id;
                    return sourceId === selectedNode.id ||
                        targetId === selectedNode.id
                        ? Math.sqrt(d.weight) * 2
                        : Math.sqrt(d.weight);
                });
        };

        // Create tooltip
        const tooltip = d3
            .select(tooltipRef.current)
            .attr(
                "class",
                "absolute hidden bg-white p-4 rounded-lg shadow-lg border text-sm max-w-xs"
            );

        // Add hover interactions
        nodes
            .on("mouseover", (event, d) => {
                tooltip
                    .html(
                        `
            <div class="font-bold">${d.id}</div>
            <div class="text-gray-600">${d.type}</div>
            <div class="mt-2">${d.description}</div>
            ${selectedNode ? '<div class="mt-2 text-xs">(Click to select/deselect)</div>' : ""}
          `
                    )
                    .style("left", event.pageX + 10 + "px")
                    .style("top", event.pageY - 10 + "px")
                    .classed("hidden", false);
            })
            .on("mouseout", () => {
                tooltip.classed("hidden", true);
            });

        // Update positions on simulation tick
        simulation.on("tick", () => {
            links
                .attr("x1", (d) => (d.source as NodeData).x!)
                .attr("y1", (d) => (d.source as NodeData).y!)
                .attr("x2", (d) => (d.target as NodeData).x!)
                .attr("y2", (d) => (d.target as NodeData).y!);

            nodes.attr("transform", (d) => `translate(${d.x},${d.y})`);
        });

        // Drag functions
        function dragstarted(event: any) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event: any) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event: any) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        // Initial selection state
        updateSelection();

        // Update selection when it changes
        return () => {
            simulation.stop();
        };
    }, [data, dimensions, selectedNode, selectedNeighbors, colorScale]);

    // Update dimensions on window resize
    useEffect(() => {
        const handleResize = () => {
            if (svgRef.current) {
                const container = svgRef.current.parentElement;
                if (container) {
                    setDimensions({
                        width: container.clientWidth,
                        height: Math.max(container.clientHeight, 600),
                    });
                }
            }
        };

        window.addEventListener("resize", handleResize);
        handleResize();

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <div className="w-full h-full relative">
            {/* Dynamic Legend */}
            <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg border">
                <div className="text-sm font-bold mb-2">Node Types</div>
                {uniqueTypes.map((type) => (
                    <div key={type} className="flex items-center gap-2 text-sm">
                        <div
                            className="w-4 h-4 rounded-full"
                            style={{
                                backgroundColor: colorScale(type) as string,
                            }}
                        />
                        {type}
                    </div>
                ))}
            </div>

            {/* Selected Node Info */}

            <svg
                ref={svgRef}
                width={dimensions.width}
                height={dimensions.height}
                className="bg-gray-50"
            />
            <div ref={tooltipRef} />
        </div>
    );
};

export default MedicalGraph;
