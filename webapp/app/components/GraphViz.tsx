import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

interface d3NodeData extends d3.SimulationNodeDatum {
    id: string;
    type: string;
    description: string;
    sourceId: string;
}

interface d3EdgeData extends d3.SimulationLinkDatum<d3NodeData> {
    source: string | d3NodeData;
    target: string | d3NodeData;
    weight: number;
    description: string;
    keywords: string[];
}

interface GraphData {
    nodes: d3NodeData[];
    links: d3EdgeData[];
}

const GraphViz: React.FC<{ data: GraphData }> = ({ data }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    console.log(data);
    useEffect(() => {
        if (!svgRef.current || !data.nodes.length) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); // Clear previous render

        // Color scale for different node types
        const colorScale = d3
            .scaleOrdinal()
            .domain(["SYMPTOM", "DISEASE", "TREATMENT", "MEDICATION"])
            .range(["#ff9999", "#99ff99", "#9999ff", "#ffff99"]);

        // Create force simulation
        const simulation = d3
            .forceSimulation(data.nodes as d3NodeData[])
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

        // Create nodes
        const nodes = g
            .append("g")
            .selectAll("g")
            .data(data.nodes)
            .join("g")
            .call(
                d3
                    .drag<SVGGElement, d3NodeData>()
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
            .attr("stroke-width", 2);

        // Add labels to nodes
        nodes
            .append("text")
            .text((d) => d.id)
            .attr("text-anchor", "middle")
            .attr("dy", 30)
            .attr("class", "text-sm fill-gray-700");

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
          `
                    )
                    .style("left", event.pageX + 10 + "px")
                    .style("top", event.pageY - 10 + "px")
                    .classed("hidden", false);
            })
            .on("mouseout", () => {
                tooltip.classed("hidden", true);
            });

        // Add hover interactions for links
        links
            .on("mouseover", (event, d) => {
                tooltip
                    .html(
                        `
            <div class="font-bold">Relationship</div>
            <div>${d.description}</div>
            <div class="mt-2">
              <span class="font-semibold">Keywords:</span> 
              ${d.keywords.join(", ")}
            </div>
            <div class="mt-1">
              <span class="font-semibold">Weight:</span> 
              ${d.weight}
            </div>
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
                .attr("x1", (d) => (d.source as any).x!)
                .attr("y1", (d) => (d.source as any).y!)
                .attr("x2", (d) => (d.target as any).x!)
                .attr("y2", (d) => (d.target as any).y!);

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

        // Cleanup
        return () => {
            simulation.stop();
        };
    }, [data, dimensions]);

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
            {/* Legend */}
            <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg border">
                <div className="text-sm font-bold mb-2">Node Types</div>
                {["SYMPTOM", "DISEASE", "TREATMENT", "MEDICATION"].map(
                    (type) => (
                        <div
                            key={type}
                            className="flex items-center gap-2 text-sm"
                        >
                            <div
                                className="w-4 h-4 rounded-full"
                                style={{
                                    backgroundColor: d3
                                        .scaleOrdinal<string>()
                                        .domain([
                                            "SYMPTOM",
                                            "DISEASE",
                                            "TREATMENT",
                                            "MEDICATION",
                                        ])
                                        .range([
                                            "#ff9999",
                                            "#99ff99",
                                            "#9999ff",
                                            "#ffff99",
                                        ])(type),
                                }}
                            />
                            {type}
                        </div>
                    )
                )}
            </div>

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

export default GraphViz;
