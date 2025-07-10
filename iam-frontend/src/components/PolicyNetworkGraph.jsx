import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import './PolicyNetworkGraph.css';

/*
D3.js network graph
*/
function PolicyNetworkGraph({ policyData }) {
  const svgRef = useRef();
  const containerRef = useRef();
  const [selectedNodeType, setSelectedNodeType] = useState('all');

  useEffect(() => {
    if (!policyData || !policyData.statements) return;

    d3.select(svgRef.current).selectAll("*").remove();

    const { nodes, links } = createNetworkData(policyData);
    
    if (nodes.length === 0) return;

    const containerWidth = containerRef.current.offsetWidth;
    const width = Math.max(containerWidth, 500);
    const height = 400;

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);


    const zoom = d3.zoom()
      .scaleExtent([0.5, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    const g = svg.append("g");

    // force simulation
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(80))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(20));


    const colorScale = d3.scaleOrdinal()
      .domain(['statement', 'action', 'resource', 'principal'])
      .range(['#232f3e', '#0073bb', '#1d8102', '#b7791f']);

   
    const link = g.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .enter().append("line")
      .attr("class", "link")
      .style("stroke", "#d5dbdb")
      .style("stroke-opacity", 0.8)
      .style("stroke-width", d => Math.sqrt(d.value || 1) + 1);

    
    const node = g.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .enter().append("g")
      .attr("class", "node")
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    
    node.append("circle")
      .attr("r", d => getNodeRadius(d))
      .attr("fill", d => colorScale(d.type))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("cursor", "pointer");

    
    node.append("text")
      .text(d => truncateText(d.label, 15))
      .attr("x", 0)
      .attr("y", d => getNodeRadius(d) + 15)
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .style("fill", "#232f3e")
      .style("pointer-events", "none");

    
    node.append("title")
      .text(d => createTooltipText(d));

    //hover effects
    node.on("mouseover", function(event, d) {
      // higlhight connected nodes and links
      highlightConnections(d, node, link, true);
      
      // enlarge hovered node
      d3.select(this).select("circle")
        .transition()
        .duration(200)
        .attr("r", getNodeRadius(d) * 1.3)
        .attr("stroke-width", 3);
    })
    .on("mouseout", function(event, d) {
      // remove highlights
      highlightConnections(d, node, link, false);
      
      //return node to normal size
      d3.select(this).select("circle")
        .transition()
        .duration(200)
        .attr("r", getNodeRadius(d))
        .attr("stroke-width", 2);
    });

    //update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    //drag functions
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    //filter nodes based on selected type
    if (selectedNodeType !== 'all') {
      node.style("opacity", d => d.type === selectedNodeType ? 1 : 0.2);
      link.style("opacity", d => 
        (d.source.type === selectedNodeType || d.target.type === selectedNodeType) ? 0.8 : 0.1
      );
    } else {
      node.style("opacity", 1);
      link.style("opacity", 0.8);
    }

  }, [policyData, selectedNodeType]);

  //Create network data from policy data
   
  const createNetworkData = (policyData) => {
    const nodes = [];
    const links = [];
    const nodeMap = new Map();

    // helper to add node if it doesn't exist
    const addNode = (id, label, type, data = {}) => {
      if (!nodeMap.has(id)) {
        const node = { id, label, type, ...data };
        nodes.push(node);
        nodeMap.set(id, node);
      }
      return nodeMap.get(id);
    };

    //process each statement
    policyData.statements.forEach((statement, stmtIndex) => {
      const statementId = `stmt-${stmtIndex}`;
      const statementNode = addNode(
        statementId,
        `Statement ${stmtIndex + 1}`,
        'statement',
        { effect: statement.effect, sid: statement.sid }
      );

      // add action nodes and links
      if (statement.actions) {
        statement.actions.forEach(action => {
          const actionId = `action-${action}`;
          const actionNode = addNode(actionId, action, 'action');
          links.push({
            source: statementId,
            target: actionId,
            type: 'allows',
            value: 1
          });
        });
      }

      // add resource nodes and links
      if (statement.resources) {
        statement.resources.forEach(resource => {
          const resourceId = `resource-${resource}`;
          const resourceNode = addNode(resourceId, resource, 'resource');
          links.push({
            source: statementId,
            target: resourceId,
            type: 'affects',
            value: 1
          });
        });
      }

      // add principal node and link if exists
      if (statement.principalSummary) {
        const principalId = `principal-${statement.principalSummary}`;
        const principalNode = addNode(principalId, statement.principalSummary, 'principal');
        links.push({
          source: principalId,
          target: statementId,
          type: 'has',
          value: 1
        });
      }
    });

    return { nodes, links };
  };

  //get node radius based on type and connections
   
  const getNodeRadius = (d) => {
    switch (d.type) {
      case 'statement':
        return 12;
      case 'action':
        return 8;
      case 'resource':
        return 10;
      case 'principal':
        return 9;
      default:
        return 6;
    }
  };

  //create tooltip text for nodes
   
  const createTooltipText = (d) => {
    switch (d.type) {
      case 'statement':
        return `Statement: ${d.effect}${d.sid ? ` (${d.sid})` : ''}`;
      case 'action':
        return `Action: ${d.label}`;
      case 'resource':
        return `Resource: ${d.label}`;
      case 'principal':
        return `Principal: ${d.label}`;
      default:
        return d.label;
    }
  };

  //highlight all connected nodes and links
   
  const highlightConnections = (d, nodeSelection, linkSelection, highlight) => {
    const connectedNodes = new Set();
    
    //connected nodes
    linkSelection.each(function(link) {
      if (link.source.id === d.id || link.target.id === d.id) {
        connectedNodes.add(link.source.id);
        connectedNodes.add(link.target.id);
      }
    });

    // change node highlight
    nodeSelection.style("opacity", node => {
      if (!highlight) return 1;
      return connectedNodes.has(node.id) ? 1 : 0.2;
    });

    //chaneg link highlight
    linkSelection.style("stroke-opacity", link => {
      if (!highlight) return 0.8;
      return (link.source.id === d.id || link.target.id === d.id) ? 1 : 0.1;
    })
    .style("stroke", link => {
      if (!highlight) return "#d5dbdb";
      return (link.source.id === d.id || link.target.id === d.id) ? "#ff9900" : "#d5dbdb";
    });
  };

  //Truncate text to specified length
   
  const truncateText = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (!policyData || !policyData.statements || policyData.statements.length === 0) {
    return (
      <div className="policy-network-graph">
        <div className="chart-header">
          <h4>Policy Relationship Network</h4>
          <p>No policy data available</p>
        </div>
        <div className="chart-empty">
          <p>Upload a policy to see the relationship network</p>
        </div>
      </div>
    );
  }

  return (
    <div className="policy-network-graph" ref={containerRef}>
      <div className="chart-header">
        <h4>Policy Relationship Network</h4>
        <p>Drag nodes • Hover to highlight • Zoom to explore</p>
      </div>
      
      {/* Filter Controls */}
      <div className="filter-controls">
        <label>Filter by type:</label>
        <select 
          value={selectedNodeType} 
          onChange={(e) => setSelectedNodeType(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Nodes</option>
          <option value="statement">Statements</option>
          <option value="action">Actions</option>
          <option value="resource">Resources</option>
          <option value="principal">Principals</option>
        </select>
      </div>

      <div className="chart-container">
        <svg ref={svgRef}></svg>
      </div>

      {/* Legend */}
      <div className="chart-legend">
        <div className="legend-item">
          <div className="legend-color" style={{backgroundColor: '#232f3e'}}></div>
          <span>Statements</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{backgroundColor: '#0073bb'}}></div>
          <span>Actions</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{backgroundColor: '#1d8102'}}></div>
          <span>Resources</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{backgroundColor: '#b7791f'}}></div>
          <span>Principals</span>
        </div>
      </div>
    </div>
  );
}

export default PolicyNetworkGraph;