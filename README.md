# IAM Policy Visualizer 🔐

A full-stack web application that transforms complex AWS IAM policies into intuitive visual representations, making it easier to understand permissions, relationships, and security configurations.

![Project Status](https://img.shields.io/badge/Status-Week%204%20Complete-success)
![Backend](https://img.shields.io/badge/Backend-Spring%20Boot-green)
![Frontend](https://img.shields.io/badge/Frontend-React-blue)
![Database](https://img.shields.io/badge/Database-PostgreSQL-blue)

## 🎯 Overview

AWS IAM policies are critical for cloud security but can be incredibly confusing to understand. This application takes those complex JSON files and breaks them down into something actually readable.

The idea is simple: upload an IAM policy, and get back a clear breakdown of who can do what with which resources. No more squinting at nested JSON trying to figure out if someone accidentally gave admin access to the intern.

## ✨ Features

- 🔧 **Policy Upload**: Drag & drop or file picker for JSON policy files
- 📊 **Policy Analysis**: Parse and analyze complex IAM policy structures
- 🎨 **AWS Console UI**: Professional interface matching AWS design language
- ⚡ **Real-time Processing**: Instant policy analysis with beautiful loading animations
- 🔍 **Detailed Breakdown**: View actions, resources, principals, and conditions
- 🧪 **Sample Policies**: Built-in examples for testing and learning
- 📊 **Interactive Donut Chart**: Visual breakdown of Allow vs Deny statements
- 🌳 **Policy Tree Diagram**: Expandable hierarchical view of policy structure
- 🕸️ **Network Graph**: Drag-and-drop relationship mapping between principals, actions, and resources

## 🎨 Interactive Visualizations

Your uploaded policies come to life with three different visualization views:

### **📊 Summary Chart**
A beautiful donut chart showing the breakdown of Allow vs Deny statements with hover effects and smooth animations. Perfect for getting a quick overview of your policy's permission structure.

### **🌳 Tree Diagram** 
An interactive tree that shows the hierarchical structure of your policy. Click to expand and collapse branches, hover for details. Great for understanding how statements, actions, and resources relate to each other.

### **🕸️ Network Graph**
The coolest one - a force-directed graph where you can drag nodes around to explore relationships between principals, actions, and resources. Zoom, pan, and filter by node type to dive deep into policy connections.

All powered by D3.js with smooth transitions and AWS-themed styling that matches the rest of the interface.

## 🛠 Technology Stack

### Backend
- **Java 17** - Modern Java with latest features
- **Spring Boot 3.5** - Enterprise-grade framework
- **Spring Data JPA** - Database abstraction layer
- **Jackson** - JSON processing and serialization
- **PostgreSQL** - Robust relational database
- **Maven** - Dependency management
- **Docker** - Containerized database

### Frontend
- **React 18** - Modern frontend framework
- **Vite** - Fast build tool and dev server
- **Axios** - HTTP client for API communication
- **D3.js** - Interactive data visualizations
- **CSS3** - AWS Console-inspired styling
- **JavaScript ES6+** - Modern JavaScript features

### Development Tools
- **Lombok** - Reduces Java boilerplate code
- **CORS Configuration** - Cross-origin resource sharing
- **Hot Reload** - Fast development feedback loop

## 🏗 Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React App     │────▶│  Spring Boot    │────▶│   PostgreSQL    │
│  (Frontend)     │     │   (Backend)     │     │   (Database)    │
│                 │     │                 │     │                 │
│ • PolicyUploader│     │ • PolicyService │     │ • User/Role     │
│ • PolicyResults │     │ • PolicyController│     │ • Future: Policy│
│ • D3.js Charts  │     │ • JSON Parsing  │     │   Storage       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
     localhost:5173          localhost:8080           localhost:5432
```

### Data Flow
Here's what happens when you upload a policy:
1. You drop a JSON file into the interface
2. The frontend validates it's actually a proper policy file
3. Axios sends it to the Spring Boot backend
4. Jackson parses the JSON and the service analyzes everything
5. The backend extracts all the unique actions, resources, and principals
6. You get back a clean summary displayed in an AWS-styled interface
7. D3.js transforms the data into interactive visualizations

## 🌐 Live Demo

**Frontend:** `http://18.222.166.31:3000`  
**Backend API:** `http://18.222.166.31:8080`

Try it out! Upload your own IAM policies or use the sample policy loader to see the visualizations in action.

## 🚀 Getting Started

### Prerequisites
- **Java 17** or higher
- **Node.js 18** or higher
- **Docker** (for PostgreSQL)
- **Git**

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd iam-policy-visualizer
   ```

2. **Start PostgreSQL with Docker**
   ```bash
   docker run --name iam-postgres \
     -e POSTGRES_PASSWORD=pass \
     -e POSTGRES_DB=iamdb \
     -p 5432:5432 -d postgres
   ```

3. **Run Spring Boot application**
   ```bash
   cd iam-backend
   ./mvnw spring-boot:run
   ```

4. **Verify backend is running**
   ```bash
   curl http://localhost:8080/policy/test
   # Should return: "Policy controller is working!"
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd iam-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

### Testing the Application

1. **Upload a sample policy** - Click "Load Sample Policy" button
2. **Or upload your own** - Drag & drop a JSON file with IAM policy
3. **View results** - See policy analysis and interactive visualizations

## 📚 API Documentation

### Policy Endpoints

#### Upload Policy
```http
POST /policy/upload
Content-Type: application/json

{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:ListBucket"],
      "Resource": "arn:aws:s3:::example-bucket/*"
    }
  ]
}
```

**Response:**
```json
{
  "policyVersion": "2012-10-17",
  "totalStatements": 1,
  "uniqueActions": ["s3:GetObject", "s3:ListBucket"],
  "uniqueResources": ["arn:aws:s3:::example-bucket/*"],
  "principals": [],
  "statements": [...]
}
```

#### Health Check
```http
GET /policy/test
```

**Response:**
```
"Policy controller is working!"
```

### User Management Endpoints

#### Get All Users
```http
GET /users
```

#### Create User
```http
POST /users
Content-Type: application/json

{
  "username": "john_doe",
  "password": "secure_password"
}
```

## 📁 Project Structure

```
iam-policy-visualizer/
├── iam-backend/                 # Spring Boot Backend
│   ├── src/main/java/com/iam/iambackend/
│   │   ├── IamBackendApplication.java
│   │   ├── User.java            # JPA Entity
│   │   ├── Role.java            # JPA Entity  
│   │   ├── UserController.java  # REST Controller
│   │   ├── UserRepository.java  # Data Access
│   │   ├── config/
│   │   │   └── CorsConfig.java  # CORS Configuration
│   │   └── policy/              # Policy Processing Package
│   │       ├── IamPolicy.java   # AWS Policy Model
│   │       ├── Statement.java   # Policy Statement Model
│   │       ├── PolicySummary.java      # Frontend Response
│   │       ├── StatementSummary.java   # Simplified Statement
│   │       ├── PolicyController.java   # Policy REST API
│   │       └── PolicyService.java      # Business Logic
│   ├── src/main/resources/
│   │   └── application.properties      # Configuration
│   └── pom.xml                 # Maven Dependencies
│
└── iam-frontend/               # React Frontend
    ├── src/
    │   ├── main.jsx            # React Entry Point
    │   ├── index.css           # Global Styles
    │   ├── App.jsx             # Main Component
    │   ├── App.css             # AWS Theme Styles
    │   └── components/
    │       ├── PolicyUploader.jsx    # Upload Component
    │       ├── PolicyUploader.css    # Upload Styles
    │       ├── PolicyResults.jsx     # Results Display
    │       ├── PolicyResults.css     # Results Styles
    │       ├── PolicySummaryChart.jsx # D3.js Donut Chart
    │       ├── PolicySummaryChart.css # Chart Styles
    │       ├── PolicyTreeDiagram.jsx  # D3.js Tree Visualization
    │       ├── PolicyTreeDiagram.css  # Tree Styles
    │       ├── PolicyNetworkGraph.jsx # D3.js Network Graph
    │       └── PolicyNetworkGraph.css # Network Styles
    ├── package.json            # Dependencies
    └── vite.config.js          # Build Configuration
```

## 🗓 Development Progress

### Week 1: Getting the Foundation Right
Built the Spring Boot backend with PostgreSQL database. Set up user management with JPA entities and got the basic CRUD operations working.

### Week 2: The Policy Processing Brain  
Added the policy upload endpoint and JSON parsing logic. This was the tricky part - AWS policies can have inconsistent formats (sometimes actions are strings, sometimes arrays), so I had to build logic to handle all that.

### Week 3: Making It Look Good
Built the React frontend with an AWS Console-inspired design. Added file upload functionality, connected everything to the backend, and made it responsive. Also spent way too much time getting the layout centered properly.

### Week 4: The Visual Magic ✨
This is where things got really fun. Added three interactive D3.js visualizations that transform boring JSON into engaging, explorable charts. Built donut charts with hover effects, expandable tree diagrams, and a full network graph with drag-and-drop nodes. Also added smooth loading animations and page transitions that make the whole app feel premium.

### Week 5: Deployment & Polish 🚀
Deployed the full application to AWS EC2 with proper production configuration. Added enhanced loading states, smooth transitions, and final UX polish. Now it's running live in the cloud!

## 🔧 Configuration

### Backend Setup
The Spring Boot app expects PostgreSQL to be running on the default port. If you're using the Docker command from the setup section, these settings in `application.properties` should work:

```properties
spring.datasource.url=jdbc:postgresql://127.0.0.1:5432/iamdb
spring.datasource.username=postgres
spring.datasource.password=pass
```

### Frontend Setup
The React app is configured to talk to the backend on port 8080. If you need to change this, update the `BACKEND_URL` in `PolicyUploader.jsx`.

## 🐛 Troubleshooting

**"No response from backend"**: Your Spring Boot app probably isn't running. Check that you can hit `http://localhost:8080/policy/test` in your browser (or the EC2 URL if deployed).

**CORS errors**: Make sure the `CorsConfig.java` file is in place and your backend restarted after adding it.

**Database connection issues**: Check if your PostgreSQL container is still running with `docker ps`. If not, start it again with `docker start iam-postgres`.

**Frontend won't start**: Try deleting `node_modules` and running `npm install` again. Also check that you have Node.js 18 or higher.

**Visualizations not loading**: Make sure D3.js installed correctly with `npm install d3`. The charts need policy data to render, so upload a policy first.

**Built with ❤️ for better AWS IAM policy understanding**