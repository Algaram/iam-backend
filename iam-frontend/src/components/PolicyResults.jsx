import React from 'react';
import './PolicyResults.css';

/**
displays the analyzed policy data returned from the Spring Boot backend.
Shows:
- summary statistics (total statements, unique actions, etc.)
- detailed breakdown of each statement
- actions and resources in an organized format
*/
function PolicyResults({ policyData, onReset }) {
  
  //summary stats cards
  const renderSummaryCards = () => {
    return (
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-number">{policyData.totalStatements}</div>
          <div className="card-label">Statements</div>
        </div>
        
        <div className="summary-card">
          <div className="card-number">{policyData.uniqueActions?.size || 0}</div>
          <div className="card-label">Unique Actions</div>
        </div>
        
        <div className="summary-card">
          <div className="card-number">{policyData.uniqueResources?.size || 0}</div>
          <div className="card-label">Resources</div>
        </div>
        
        <div className="summary-card">
          <div className="card-number">{policyData.principals?.size || 0}</div>
          <div className="card-label">Principals</div>
        </div>
      </div>
    );
  };

  // all unique actions
  const renderUniqueActions = () => {
    if (!policyData.uniqueActions || policyData.uniqueActions.length === 0) {
      return <p className="no-data">No actions found</p>;
    }

    return (
      <div className="tags-container">
        {Array.from(policyData.uniqueActions).map((action, index) => (
          <span key={index} className="tag tag-action">{action}</span>
        ))}
      </div>
    );
  };

  //list of any unique resouirce
  const renderUniqueResources = () => {
    if (!policyData.uniqueResources || policyData.uniqueResources.length === 0) {
      return <p className="no-data">No resources found</p>;
    }

    return (
      <div className="tags-container">
        {Array.from(policyData.uniqueResources).map((resource, index) => (
          <span key={index} className="tag tag-resource">{resource}</span>
        ))}
      </div>
    );
  };

  //statement details
  const renderStatements = () => {
    if (!policyData.statements || policyData.statements.length === 0) {
      return <p className="no-data">No statements found</p>;
    }

    return (
      <div className="statements-list">
        {policyData.statements.map((statement, index) => (
          <div key={index} className="statement-card">
            
            {/* Statement header */}
            <div className="statement-header">
              <span className={`effect-badge ${statement.effect?.toLowerCase()}`}>
                {statement.effect || 'Unknown'}
              </span>
              {statement.sid && (
                <span className="statement-id">ID: {statement.sid}</span>
              )}
            </div>

            {/* Actions */}
            <div className="statement-section">
              <h4>Actions:</h4>
              {statement.actions && statement.actions.length > 0 ? (
                <div className="tags-container">
                  {statement.actions.map((action, actionIndex) => (
                    <span key={actionIndex} className="tag tag-action">
                      {action}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="no-data">No actions specified</p>
              )}
            </div>

            {/* Resources */}
            <div className="statement-section">
              <h4>Resources:</h4>
              {statement.resources && statement.resources.length > 0 ? (
                <div className="tags-container">
                  {statement.resources.map((resource, resourceIndex) => (
                    <span key={resourceIndex} className="tag tag-resource">
                      {resource}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="no-data">No resources specified</p>
              )}
            </div>

            {/* Principal (if exists) */}
            {statement.principalSummary && (
              <div className="statement-section">
                <h4>Principal:</h4>
                <span className="tag tag-principal">{statement.principalSummary}</span>
              </div>
            )}

            {/* Conditions indicator */}
            {statement.hasConditions && (
              <div className="statement-section">
                <span className="conditions-indicator">⚠️ Has additional conditions</span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  //debug info
  const renderDebugInfo = () => {
    return (
      <details className="debug-section">
        <summary>Debug: Raw Backend Response</summary>
        <pre className="debug-json">
          {JSON.stringify(policyData, null, 2)}
        </pre>
      </details>
    );
  };

  return (
    <div className="policy-results">
      
      {/* Header with reset button */}
      <div className="results-header">
        <h2>Policy Analysis Results</h2>
        <button onClick={onReset} className="btn btn-secondary">
          Upload New Policy
        </button>
      </div>

      {/* Policy version info */}
      {policyData.policyVersion && (
        <div className="policy-info">
          <strong>Policy Version:</strong> {policyData.policyVersion}
        </div>
      )}

      {/* Summary cards */}
      <div className="section">
        <h3>Summary</h3>
        {renderSummaryCards()}
      </div>

      {/* Unique actions */}
      <div className="section">
        <h3>All Unique Actions</h3>
        {renderUniqueActions()}
      </div>

      {/* Unique resources */}
      <div className="section">
        <h3>All Unique Resources</h3>
        {renderUniqueResources()}
      </div>

      {/* Detailed statements */}
      <div className="section">
        <h3>Statement Details</h3>
        {renderStatements()}
      </div>

      {/* Visualization placeholder for Week 4 */}
      <div className="section">
        <h3>Visualizations</h3>
        <div className="visualization-placeholder">
          <div className="placeholder-content">
            <h4>📊 Coming in Week 4!</h4>
            <p>Interactive D3.js visualizations will appear here:</p>
            <ul>
              <li>Tree diagram showing permission hierarchy</li>
              <li>Network graph of relationships</li>
              <li>Interactive charts and filters</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Debug section for development */}
      {renderDebugInfo()}
    </div>
  );
}

export default PolicyResults;