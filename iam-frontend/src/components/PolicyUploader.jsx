import React, { useState, useRef } from 'react';
import axios from 'axios';
import './PolicyUploader.css';

/*
component for uploading and processing IAM policy files
Handles:
- file selection (drag & drop or file picker)
- JSON validation
- API communication with Spring Boot backend
- loading states and error handling
*/
function PolicyUploader({ onSuccess, onError, onLoadingChange, isLoading, error }) {
  // drag drop functionality
  const [isDragOver, setIsDragOver] = useState(false);
  
  //hidden file input
  const fileInputRef = useRef(null);

  //uses internal backend
  const BACKEND_URL = 'http://localhost:8080';

  // file selection from drag and drop
  const handleFileSelect = async (file) => {
    if (!file) return;

    //validates the file type
    if (!file.name.endsWith('.json')) {
      onError('Please select a JSON file');
      return;
    }

    //check if file 5mb or smaller
    if (file.size > 5 * 1024 * 1024) {
      onError('File too large. Please select a file smaller than 5MB');
      return;
    }

    try {
      //loading state
      onLoadingChange(true);
      
      //reads file
      const fileContent = await readFileAsText(file);
      
      //parse then validate JSON fikle
      let policyJson;
      try {
        policyJson = JSON.parse(fileContent);
      } catch (parseError) {
        onError('Invalid JSON file. Please check the file format.');
        return;
      }

      //compare if it is an iam policy
      if (!policyJson.Version || !policyJson.Statement) {
        onError('This doesn\'t appear to be a valid IAM policy. Missing Version or Statement fields.');
        return;
      }

      //send backend
      await uploadPolicyToBackend(policyJson); //allows execution to pause until everything is right

    } catch (error) {
      console.error('Error processing file:', error);
      onError('Error processing file: ' + error.message);
    }
  };

  // text reader
  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  // policy sent to backend 
  const uploadPolicyToBackend = async (policyJson) => {
    try {
      console.log('Sending policy to backend:', policyJson);
      
      const response = await axios.post(`${BACKEND_URL}/policy/upload`, policyJson, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      });

      console.log('Backend response:', response.data);
      
      // if success pass data to parent component
      onSuccess(response.data);

    } catch (error) {
      console.error('Backend error:', error);
      
      if (error.code === 'ECONNREFUSED') {
        onError('Cannot connect to backend. Make sure Spring Boot is running on port 8080.');
      } else if (error.response) {
        //server error
        onError(`Backend error: ${error.response.data || error.response.statusText}`);
      } else if (error.request) {
        //request but no response
        onError('No response from backend. Check if Spring Boot is running.');
      } else {
        //something else happened to the cpde
        onError('Unexpected error: ' + error.message);
      }
    }
  };

  
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  
  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  
  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  //sample policy for testing (we love tests)
  const loadSamplePolicy = async () => {
    const samplePolicy = {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "AllowS3ReadOnlyAccess",
          "Effect": "Allow",
          "Action": [
            "s3:GetObject",
            "s3:ListBucket"
          ],
          "Resource": [
            "arn:aws:s3:::example-bucket",
            "arn:aws:s3:::example-bucket/*"
          ]
        },
        {
          "Sid": "AllowEC2Describe",
          "Effect": "Allow",
          "Action": "ec2:DescribeInstances",
          "Resource": "*"
        }
      ]
    };

    try {
      onLoadingChange(true);
      await uploadPolicyToBackend(samplePolicy);
    } catch (error) {
      onError('Failed to load sample policy');
    }
  };

  return (
    <div className="policy-uploader">
      {/* Upload Area */}
      <div 
        className={`upload-area ${isDragOver ? 'drag-over' : ''} ${isLoading ? 'loading' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFilePicker}
      >
        {isLoading ? (
          <div className="loading-content">
            <div className="spinner"></div>
            <p>Processing policy...</p>
          </div>
        ) : (
          <div className="upload-content">
            <div className="upload-icon">📄</div>
            <h3>Drop your IAM policy JSON file here</h3>
            <p>or click to browse</p>
            <small>Supported format: .json (max 5MB)</small>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />

      {/* Action buttons */}
      <div className="upload-actions">
        <button 
          onClick={openFilePicker} 
          disabled={isLoading}
          className="btn btn-primary"
        >
          Choose File
        </button>
        <button 
          onClick={loadSamplePolicy} 
          disabled={isLoading}
          className="btn btn-secondary"
        >
          Load Sample Policy
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Help text */}
      <div className="help-text">
        <h4>Need a test policy?</h4>
        <p>Click "Load Sample Policy" or upload your own IAM policy JSON file. 
           The policy will be analyzed and you'll see a breakdown of permissions, 
           actions, and resources.</p>
      </div>
    </div>
  );
}

export default PolicyUploader;