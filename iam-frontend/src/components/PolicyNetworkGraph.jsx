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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    if (!policyData || !policyData.statements) return;

    d3.select(svgRef.current).selectAll("*").remove();

    const { nodes, links } = createNetworkData(policyData);
    
    if (nodes.length === 0) return;

    const containerWidth = containerRef.current.offsetWidth;
    const containerHeight = isFullscreen ? window.innerHeight - 100 : 400;
    const width = Math.max(containerWidth, 500);
    const height = containerHeight;

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    // Enhanced zoom behavior with programmatic control
    const zoom = d3.zoom()
      .scaleExtent([0.1, 5])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        setZoomLevel(event.transform.k);
      });

    svg.call(zoom);
    const g = svg.append("g");
    svg.zoomBehavior = zoom;

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

    // hover effects
    node.on("mouseover", function(event, d) {
      highlightConnections(d, node, link, true);
      d3.select(this).select("circle")
        .transition()
        .duration(200)
        .attr("r", getNodeRadius(d) * 1.3)
        .attr("stroke-width", 3);
    })
    .on("mouseout", function(event, d) {
      highlightConnections(d, node, link, false);
      d3.select(this).select("circle")
        .transition()
        .duration(200)
        .attr("r", getNodeRadius(d))
        .attr("stroke-width", 2);
    });

    
    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    
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

    
    if (selectedNodeType !== 'all') {
      node.style("opacity", d => d.type === selectedNodeType ? 1 : 0.2);
      link.style("opacity", d => 
        (d.source.type === selectedNodeType || d.target.type === selectedNodeType) ? 0.8 : 0.1
      );
    } else {
      node.style("opacity", 1);
      link.style("opacity", 0.8);
    }

    
    svg.simulation = simulation;
    svg.nodeSelection = node;
    svg.linkSelection = link;

  }, [policyData, selectedNodeType, isFullscreen]);

  // zoom items
  const handleZoomIn = () => {
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(
      svg.zoomBehavior.scaleBy, 1.5
    );
  };

  const handleZoomOut = () => {
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(
      svg.zoomBehavior.scaleBy, 1 / 1.5
    );
  };

  const handleZoomReset = () => {
    const svg = d3.select(svgRef.current);
    svg.transition().duration(500).call(
      svg.zoomBehavior.transform,
      d3.zoomIdentity
    );
  };

  const handleFitToScreen = () => {
    const svg = d3.select(svgRef.current);
    const bounds = svg.select('.nodes').node().getBBox();
    const fullWidth = containerRef.current.offsetWidth;
    const fullHeight = isFullscreen ? window.innerHeight - 100 : 400;
    const width = bounds.width;
    const height = bounds.height;
    const midX = bounds.x + width / 2;
    const midY = bounds.y + height / 2;
    if (width == 0 || height == 0) return;
    const scale = Math.min(fullWidth, fullHeight) / Math.max(width, height) * 0.9;
    const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];

    svg.transition().duration(750).call(
      svg.zoomBehavior.transform,
      d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
    );
  };

  // fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const exitFullscreen = () => {
    setIsFullscreen(false);
  };

  // keyboard butts
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (!isFullscreen) return;
      
      switch (event.key) {
        case 'Escape':
          exitFullscreen();
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case '0':
          handleZoomReset();
          break;
        case 'f':
        case 'F':
          handleFitToScreen();
          break;
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [isFullscreen]);

  // Create network data from policy data
  const createNetworkData = (policyData) => {
    const nodes = [];
    const links = [];
    const nodeMap = new Map();

    const addNode = (id, label, type, data = {}) => {
      if (!nodeMap.has(id)) {
        const node = { id, label, type, ...data };
        nodes.push(node);
        nodeMap.set(id, node);
      }
      return nodeMap.get(id);
    };

    policyData.statements.forEach((statement, stmtIndex) => {
      const statementId = `stmt-${stmtIndex}`;
      const statementNode = addNode(
        statementId,
        `Statement ${stmtIndex + 1}`,
        'statement',
        { effect: statement.effect, sid: statement.sid }
      );

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

  const getNodeRadius = (d) => {
    switch (d.type) {
      case 'statement': return 12;
      case 'action': return 8;
      case 'resource': return 10;
      case 'principal': return 9;
      default: return 6;
    }
  };

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

  const highlightConnections = (d, nodeSelection, linkSelection, highlight) => {
    const connectedNodes = new Set();
    
    linkSelection.each(function(link) {
      if (link.source.id === d.id || link.target.id === d.id) {
        connectedNodes.add(link.source.id);
        connectedNodes.add(link.target.id);
      }
    });

    nodeSelection.style("opacity", node => {
      if (!highlight) return 1;
      return connectedNodes.has(node.id) ? 1 : 0.2;
    });

    linkSelection.style("stroke-opacity", link => {
      if (!highlight) return 0.8;
      return (link.source.id === d.id || link.target.id === d.id) ? 1 : 0.1;
    })
    .style("stroke", link => {
      if (!highlight) return "#d5dbdb";
      return (link.source.id === d.id || link.target.id === d.id) ? "#ff9900" : "#d5dbdb";
    });
  };

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
    <div className={`policy-network-graph ${isFullscreen ? 'fullscreen-active' : ''}`} ref={containerRef}>
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
        
        {/* Zoom Controls */}
        <div className="zoom-controls">
          <button onClick={handleZoomIn} className="zoom-btn" title="Zoom In (+)">+</button>
          <button onClick={handleZoomOut} className="zoom-btn" title="Zoom Out (-)">−</button>
          <button onClick={handleZoomReset} className="zoom-btn" title="Reset Zoom (0)">⌂</button>
          <button onClick={handleFitToScreen} className="zoom-btn" title="Fit to Screen (F)">⛶</button>
        </div>

        {/* Fullscreen Controls */}
        <div className="fullscreen-controls">
          <button onClick={toggleFullscreen} className="fullscreen-btn" title="Toggle Fullscreen">
            {isFullscreen ? '⛶' : '⛶'}
          </button>
        </div>

        {/* Zoom Level Indicator */}
        <div className="zoom-info">
          Zoom: {Math.round(zoomLevel * 100)}%
        </div>

        {/* Fullscreen Exit Button */}
        {isFullscreen && (
          <div className="fullscreen-exit">
            <button onClick={exitFullscreen} className="exit-btn">
              ✕ Exit Fullscreen (ESC)
            </button>
          </div>
        )}

        {/* Keyboard Shortcuts Help */}
        {isFullscreen && (
          <div className="keyboard-shortcuts">
            <small>
              <strong>Shortcuts:</strong> +/- (zoom) • 0 (reset) • F (fit) • ESC (exit)
            </small>
          </div>
        )}
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