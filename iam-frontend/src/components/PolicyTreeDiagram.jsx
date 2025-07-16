import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import './PolicyTreeDiagram.css';

/*
D3.js tree diagram
*/
function PolicyTreeDiagram({ policyData }) {
  const svgRef = useRef();
  const containerRef = useRef();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    if (!policyData || !policyData.statements) return;

    // clear previous diagram
    d3.select(svgRef.current).selectAll("*").remove();

    
    const hierarchyData = createHierarchyData(policyData);
    
    if (!hierarchyData) return;

    
    const containerWidth = containerRef.current.offsetWidth;
    const containerHeight = isFullscreen ? window.innerHeight - 100 : 500;
    const width = Math.max(containerWidth, 600);
    const height = containerHeight;
    const margin = { top: 20, right: 90, bottom: 30, left: 90 };

    
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    
    const zoom = d3.zoom()
      .scaleExtent([0.1, 5])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        setZoomLevel(event.transform.k);
      });

    svg.call(zoom);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    
    svg.zoomBehavior = zoom;

    // create tree 
    const tree = d3.tree()
      .size([height - margin.top - margin.bottom, width - margin.left - margin.right]);
    const root = d3.hierarchy(hierarchyData);
    root.descendants().forEach((d, i) => {
      if (d.depth >= 2) {
        d._children = d.children;
        d.children = null;
      }
    });

    
    function update(source) {
      
      const treeData = tree(root);
      const nodes = treeData.descendants();
      const links = treeData.descendants().slice(1);

      
      nodes.forEach(d => { d.y = d.depth * 150; });

      
      const node = g.selectAll('.node')
        .data(nodes, d => d.id || (d.id = ++i));

      
      const nodeEnter = node.enter().append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${source.y0 || 0},${source.x0 || 0})`)
        .on('click', click);

    
      nodeEnter.append('circle')
        .attr('r', 1e-6)
        .style('fill', d => getNodeColor(d))
        .style('stroke', '#232f3e')
        .style('stroke-width', '2px')
        .style('cursor', d => d._children ? 'pointer' : 'default');

      
      nodeEnter.append('text')
        .attr('dy', '.35em')
        .attr('x', d => d.children || d._children ? -13 : 13)
        .attr('text-anchor', d => d.children || d._children ? 'end' : 'start')
        .text(d => truncateText(d.data.name, 20))
        .style('fill-opacity', 1e-6)
        .style('font-size', '12px')
        .style('font-weight', d => d.depth === 0 ? '600' : '400');

      
      nodeEnter.append('title')
        .text(d => createTooltipText(d));

      
      const nodeUpdate = nodeEnter.merge(node);

      nodeUpdate.transition()
        .duration(750)
        .attr('transform', d => `translate(${d.y},${d.x})`);

      nodeUpdate.select('circle')
        .attr('r', d => getNodeSize(d))
        .style('fill', d => getNodeColor(d))
        .style('stroke', d => d._children ? '#ff9900' : '#232f3e');

      nodeUpdate.select('text')
        .style('fill-opacity', 1);

      
      const nodeExit = node.exit().transition()
        .duration(750)
        .attr('transform', d => `translate(${source.y},${source.x})`)
        .remove();

      nodeExit.select('circle')
        .attr('r', 1e-6);

      nodeExit.select('text')
        .style('fill-opacity', 1e-6);

      
      const link = g.selectAll('.link')
        .data(links, d => d.id);

      
      const linkEnter = link.enter().insert('path', 'g')
        .attr('class', 'link')
        .attr('d', d => {
          const o = { x: source.x0 || 0, y: source.y0 || 0 };
          return diagonal(o, o);
        })
        .style('fill', 'none')
        .style('stroke', '#d5dbdb')
        .style('stroke-width', '2px');

      
      const linkUpdate = linkEnter.merge(link);

      linkUpdate.transition()
        .duration(750)
        .attr('d', d => diagonal(d, d.parent));

    
      link.exit().transition()
        .duration(750)
        .attr('d', d => {
          const o = { x: source.x, y: source.y };
          return diagonal(o, o);
        })
        .remove();

      
      nodes.forEach(d => {
        d.x0 = d.x;
        d.y0 = d.y;
      });
    }

  
    function click(event, d) {
      if (d.children) {
        d._children = d.children;
        d.children = null;
      } else {
        d.children = d._children;
        d._children = null;
      }
      update(d);
    }

    function diagonal(s, d) {
      return `M ${s.y} ${s.x}
              C ${(s.y + d.y) / 2} ${s.x},
                ${(s.y + d.y) / 2} ${d.x},
                ${d.y} ${d.x}`;
    }

    
    let i = 0;
    root.x0 = height / 2;
    root.y0 = 0;
    update(root);

    
    svg.root = root;
    svg.updateFunction = update;

  }, [policyData, isFullscreen]);

  // zoom
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
    const bounds = svg.selectAll('.node').nodes().reduce((acc, node) => {
      const bbox = node.getBBox();
      const transform = d3.select(node).attr('transform');
      const translate = transform.match(/translate\(([^)]+)\)/);
      if (translate) {
        const [x, y] = translate[1].split(',').map(Number);
        acc.minX = Math.min(acc.minX, x + bbox.x);
        acc.maxX = Math.max(acc.maxX, x + bbox.x + bbox.width);
        acc.minY = Math.min(acc.minY, y + bbox.y);
        acc.maxY = Math.max(acc.maxY, y + bbox.y + bbox.height);
      }
      return acc;
    }, { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });

    const fullWidth = containerRef.current.offsetWidth;
    const fullHeight = isFullscreen ? window.innerHeight - 100 : 500;
    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;
    const midX = bounds.minX + width / 2;
    const midY = bounds.minY + height / 2;

    if (width === 0 || height === 0) return;

    const scale = Math.min(fullWidth, fullHeight) / Math.max(width, height) * 0.8;
    const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];

    svg.transition().duration(750).call(
      svg.zoomBehavior.transform,
      d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
    );
  };

  // expand/collapse nodes
  const expandAll = () => {
    const svg = d3.select(svgRef.current);
    const root = svg.root;
    
    function expand(d) {
      if (d._children) {
        d.children = d._children;
        d._children = null;
      }
      if (d.children) {
        d.children.forEach(expand);
      }
    }
    
    expand(root);
    svg.updateFunction(root);
  };

  const collapseAll = () => {
    const svg = d3.select(svgRef.current);
    const root = svg.root;
    
    function collapse(d) {
      if (d.children) {
        d._children = d.children;
        d.children = null;
      }
      if (d._children) {
        d._children.forEach(collapse);
      }
    }
    
    if (root.children) {
      root.children.forEach(collapse);
    }
    svg.updateFunction(root);
  };

  // fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const exitFullscreen = () => {
    setIsFullscreen(false);
  };

  // keyboard shortcuts
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
        case 'e':
        case 'E':
          expandAll();
          break;
        case 'c':
        case 'C':
          collapseAll();
          break;
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [isFullscreen]);

  const createHierarchyData = (policyData) => {
    const root = {
      name: `IAM Policy (${policyData.totalStatements} statements)`,
      type: 'root',
      children: []
    };

    policyData.statements.forEach((statement, index) => {
      const statementNode = {
        name: `Statement ${index + 1} (${statement.effect})`,
        type: 'statement',
        effect: statement.effect,
        sid: statement.sid,
        children: []
      };

      // add actions node
      if (statement.actions && statement.actions.length > 0) {
        const actionsNode = {
          name: `Actions (${statement.actions.length})`,
          type: 'actions',
          children: statement.actions.map(action => ({
            name: action,
            type: 'action',
            value: action
          }))
        };
        statementNode.children.push(actionsNode);
      }

      // add resources node
      if (statement.resources && statement.resources.length > 0) {
        const resourcesNode = {
          name: `Resources (${statement.resources.length})`,
          type: 'resources',
          children: statement.resources.map(resource => ({
            name: truncateText(resource, 30),
            type: 'resource',
            value: resource
          }))
        };
        statementNode.children.push(resourcesNode);
      }

      // add principal node if exists
      if (statement.principalSummary) {
        statementNode.children.push({
          name: `Principal: ${truncateText(statement.principalSummary, 20)}`,
          type: 'principal',
          value: statement.principalSummary
        });
      }

      // add conditions indicator
      if (statement.hasConditions) {
        statementNode.children.push({
          name: 'Has Conditions',
          type: 'conditions'
        });
      }

      root.children.push(statementNode);
    });

    return root;
  };

  // get node color based on type and data
  const getNodeColor = (d) => {
    switch (d.data.type) {
      case 'root':
        return '#232f3e';
      case 'statement':
        return d.data.effect === 'Allow' ? '#1d8102' : '#d13212';
      case 'actions':
        return '#0073bb';
      case 'resources':
        return '#1d8102';
      case 'principal':
        return '#b7791f';
      case 'conditions':
        return '#ff9900';
      case 'action':
        return '#e7f3ff';
      case 'resource':
        return '#d4eecd';
      default:
        return '#f2f3f3';
    }
  };

  //based off type create node size
  const getNodeSize = (d) => {
    switch (d.data.type) {
      case 'root':
        return 8;
      case 'statement':
        return 6;
      case 'actions':
      case 'resources':
        return 5;
      default:
        return 4;
    }
  };

  //tooltip creator
  const createTooltipText = (d) => {
    switch (d.data.type) {
      case 'root':
        return `IAM Policy with ${policyData.totalStatements} statements`;
      case 'statement':
        return `${d.data.effect} statement${d.data.sid ? ` (ID: ${d.data.sid})` : ''}`;
      case 'action':
        return `Action: ${d.data.value}`;
      case 'resource':
        return `Resource: ${d.data.value}`;
      case 'principal':
        return `Principal: ${d.data.value}`;
      case 'conditions':
        return 'This statement has additional conditions';
      default:
        return d.data.name;
    }
  };

  const truncateText = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (!policyData || !policyData.statements || policyData.statements.length === 0) {
    return (
      <div className="policy-tree-diagram">
        <div className="chart-header">
          <h4>Policy Structure Tree</h4>
          <p>No policy data available</p>
        </div>
        <div className="chart-empty">
          <p>Upload a policy to see the hierarchical structure</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`policy-tree-diagram ${isFullscreen ? 'fullscreen-active' : ''}`} ref={containerRef}>
      <div className="chart-header">
        <h4>Policy Structure Tree</h4>
        <p>Click nodes to expand/collapse • Hover for details</p>
      </div>
      
      <div className="chart-container">
        <svg ref={svgRef}></svg>
        
        {/* Tree Controls */}
        <div className="tree-controls">
          <button onClick={expandAll} className="tree-btn" title="Expand All (E)">📁</button>
          <button onClick={collapseAll} className="tree-btn" title="Collapse All (C)">📂</button>
        </div>

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
              <strong>Shortcuts:</strong> +/- (zoom) • 0 (reset) • F (fit) • E (expand) • C (collapse) • ESC (exit)
            </small>
          </div>
        )}
      </div>
      
      <div className="chart-legend">
        <div className="legend-item">
          <div className="legend-color" style={{backgroundColor: '#1d8102'}}></div>
          <span>Allow Statement</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{backgroundColor: '#d13212'}}></div>
          <span>Deny Statement</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{backgroundColor: '#0073bb'}}></div>
          <span>Actions</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{backgroundColor: '#1d8102'}}></div>
          <span>Resources</span>
        </div>
      </div>
    </div>
  );
}

export default PolicyTreeDiagram;