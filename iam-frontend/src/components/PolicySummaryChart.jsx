import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './PolicySummaryChart.css';

/*
D3.js policy chart
*/
function PolicySummaryChart({ policyData }) {
  const svgRef = useRef();
  const containerRef = useRef();

  useEffect(() => {
    if (!policyData || !policyData.statements) return;

    // clear previous chart
    d3.select(svgRef.current).selectAll("*").remove();

    //processs data for the chart
    const data = processStatementData(policyData.statements);
    
    if (data.length === 0) return;

    // set up dimensions
    const containerWidth = containerRef.current.offsetWidth;
    const width = Math.min(containerWidth, 400);
    const height = 300;
    const margin = 40;
    const radius = Math.min(width, height) / 2 - margin;

    //create SVG
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    //create main group and center it
    const g = svg.append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    //create color scale
    const color = d3.scaleOrdinal()
      .domain(["Allow", "Deny"])
      .range(["#1d8102", "#d13212"]); //green for Allow red for Deny

    //create pie layout
    const pie = d3.pie()
      .value(d => d.count)
      .sort(null); // dont sort keep original order

    // create arc generator
    const arc = d3.arc()
      .innerRadius(radius * 0.5) // donut hole
      .outerRadius(radius);

    // create hover arc 
    const arcHover = d3.arc()
      .innerRadius(radius * 0.5)
      .outerRadius(radius + 10);

    // create slices
    const arcs = g.selectAll(".arc")
      .data(pie(data))
      .enter().append("g")
      .attr("class", "arc");

    // add slices with animation
    arcs.append("path")
      .attr("d", arc)
      .attr("fill", d => color(d.data.effect))
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        // hover animation
        d3.select(this)
          .transition()
          .duration(200)
          .attr("d", arcHover);
        
        //show tooltip
        showTooltip(event, d.data);
      })
      .on("mouseout", function(event, d) {
        // Return to normal size
        d3.select(this)
          .transition()
          .duration(200)
          .attr("d", arc);
        
        //hide tooltip
        hideTooltip();
      })
      .transition()
      .duration(800)
      .attrTween("d", function(d) {
        const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return function(t) {
          return arc(interpolate(t));
        };
      });

    
    arcs.append("text")
      .attr("transform", d => `translate(${arc.centroid(d)})`)
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .attr("font-weight", "600")
      .attr("fill", "white")
      .style("pointer-events", "none")
      .text(d => {
        const percentage = ((d.data.count / policyData.totalStatements) * 100).toFixed(1);
        return `${percentage}%`;
      })
      .style("opacity", 0)
      .transition()
      .delay(800)
      .duration(400)
      .style("opacity", 1);

    
    const centerGroup = g.append("g").attr("class", "center-text");
    
    centerGroup.append("text")
      .attr("text-anchor", "middle")
      .attr("font-size", "24px")
      .attr("font-weight", "700")
      .attr("fill", "#232f3e")
      .attr("dy", "-0.2em")
      .text(policyData.totalStatements)
      .style("opacity", 0)
      .transition()
      .delay(1000)
      .duration(400)
      .style("opacity", 1);

    centerGroup.append("text")
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("fill", "#545b64")
      .attr("dy", "1.2em")
      .text("Total Statements")
      .style("opacity", 0)
      .transition()
      .delay(1000)
      .duration(400)
      .style("opacity", 1);

    
    createLegend(svg, data, color, width, height);

  }, [policyData]);

  //Process policy statements into chart data
  const processStatementData = (statements) => {
    const effectCounts = statements.reduce((acc, statement) => {
      const effect = statement.effect || 'Unknown';
      acc[effect] = (acc[effect] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(effectCounts).map(([effect, count]) => ({
      effect,
      count
    }));
  };

  //Create legend for the chart

  const createLegend = (svg, data, color, width, height) => {
    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width - 100}, 20)`);

    const legendItems = legend.selectAll(".legend-item")
      .data(data)
      .enter().append("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => `translate(0, ${i * 25})`);

    // Legend color squares
    legendItems.append("rect")
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", d => color(d.effect))
      .attr("stroke", "#d5dbdb")
      .attr("stroke-width", 1);

    // Legend text
    legendItems.append("text")
      .attr("x", 20)
      .attr("y", 12)
      .attr("font-size", "12px")
      .attr("fill", "#232f3e")
      .text(d => `${d.effect} (${d.count})`);
  };

  //Show tooltip on hover

  const showTooltip = (event, data) => {
    const tooltip = d3.select("body").append("div")
      .attr("class", "chart-tooltip")
      .style("position", "absolute")
      .style("background", "rgba(0, 0, 0, 0.8)")
      .style("color", "white")
      .style("padding", "8px 12px")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("z-index", 1000);

    tooltip.html(`
      <strong>${data.effect}</strong><br>
      Statements: ${data.count}<br>
      Percentage: ${((data.count / policyData.totalStatements) * 100).toFixed(1)}%
    `)
    .style("left", (event.pageX + 10) + "px")
    .style("top", (event.pageY - 10) + "px")
    .style("opacity", 0)
    .transition()
    .duration(200)
    .style("opacity", 1);
  };

  //Hide tooltip
   
  const hideTooltip = () => {
    d3.selectAll(".chart-tooltip")
      .transition()
      .duration(200)
      .style("opacity", 0)
      .remove();
  };

  return (
    <div className="policy-summary-chart" ref={containerRef}>
      <div className="chart-header">
        <h4>Statement Breakdown</h4>
        <p>Distribution of Allow vs Deny statements</p>
      </div>
      <div className="chart-container">
        <svg ref={svgRef}></svg>
      </div>
    </div>
  );
}

export default PolicySummaryChart;