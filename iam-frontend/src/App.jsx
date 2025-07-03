import React, { useState } from 'react';
import './App.css';
import PolicyUploader from './components/PolicyUploader';
import PolicyResults from './components/PolicyResults';

/*
main App Component
this is the root component that manages the overall application state:
- handles policy upload results
- switches between upload view and results view
- manages communication between upload and display components
*/


function App() {
  //state to store the policy analysis results from the backend
  const [policyData, setPolicyData] = useState(null);
  
  // state to track if we're currently uploading/processing
  const [isLoading, setIsLoading] = useState(false);
  
  // state to store any error messages
  const [error, setError] = useState(null);

  //policy uploader calls this if succesful policy upload and analysis
  const handlePolicySuccess = (analysisResults) => {
    setPolicyData(analysisResults);
    setError(null);
    setIsLoading(false);
  };

  //handles errors policy uploader will call this if something goes wrong
  const handlePolicyError = (errorMessage) => {
    setError(errorMessage);
    setPolicyData(null);
    setIsLoading(false);
  };

  // loading state policy uploader calls during process
  const handleLoadingChange = (loading) => {
    setIsLoading(loading);
  };

  //reset for new policy
  const handleReset = () => {
    setPolicyData(null);
    setError(null);
    setIsLoading(false);
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <h1>IAM Policy Visualizer</h1>
        <p>Upload and analyze AWS IAM policies to understand permissions and relationships</p>
      </header>

      {/* Main Content */}
      <main className="app-main">
        {/* Show upload interface if no policy data */}
        {!policyData && (
          <PolicyUploader
            onSuccess={handlePolicySuccess}
            onError={handlePolicyError}
            onLoadingChange={handleLoadingChange}
            isLoading={isLoading}
            error={error}
          />
        )}

        {/* Show results if we have policy data */}
        {policyData && (
          <PolicyResults
            policyData={policyData}
            onReset={handleReset}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>Made by Alex Ramirez :P</p>
      </footer>
    </div>
  );
}

export default App;