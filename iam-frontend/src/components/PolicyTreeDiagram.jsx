import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './PolicyTreeDiagram.css';

/*
D3.js tree diagram
*/
function PolicyTreeDiagram({ policyData }) {
  const svgRef = useRef();
  const containerRef = useRef();

  useEffect(() => {
    if (!policyData || !policyData.statements) return;

    //clear previous diagram
    d3.select(svgRef.current).selectAll("*").remove();

    //create hierarchical data structure
    const hierarchyData = createHierarchyData(policyData);
    
    if (!hierarchyData) return;

    //set up dimensions
    const containerWidth = containerRef.current.offsetWidth;
    const width = Math.max(containerWidth, 600);
    const height = 500;
    const margin = { top: 20, right: 90, bottom: 30, left: 90 };

    //create SVG with zoom behavior
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // create tree layut
    const tree = d3.tree()
      .size([height - margin.top - margin.bottom, width - margin.left - margin.right]);

    // create root hierarchy
    const root = d3.hierarchy(hierarchyData);
    
    // collapse nodes initially (except the root and th first level)
    root.descendants().forEach((d, i) => {
      if (d.depth >= 2) {
        d._children = d.children;
        d.children = null;
      }
    });

    // update function for dynamic tree updates
    function update(source) {
      //compute new tree layout
      const treeData = tree(root);
      const nodes = treeData.descendants();
      const links = treeData.descendants().slice(1);

      // fixed depth
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

      //updates links
      const link = g.selectAll('.link')
        .data(links, d => d.id);

      //new links
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

  }, [policyData]);

  // create hierarchical data structure from policy data
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

  // Get node color based on type and data
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

  //Get node size based on type
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

  //Create tooltip text for nodes
   
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

  //Truncate text to specified length
   
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
    <div className="policy-tree-diagram" ref={containerRef}>
      <div className="chart-header">
        <h4>Policy Structure Tree</h4>
        <p>Click nodes to expand/collapse • Hover for details</p>
      </div>
      <div className="chart-container">
        <svg ref={svgRef}></svg>
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