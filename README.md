# IAM Policy Visualizer 🔐

**Live Application:** [http://18.222.166.31:3000/](http://18.222.166.31:3000/)

A full-stack web application that transforms complex AWS IAM policies into interactive visualizations, making it easier to understand permissions and security configurations.

![Status](https://img.shields.io/badge/Status-Live-success) ![Backend](https://img.shields.io/badge/Backend-Spring%20Boot-green) ![Frontend](https://img.shields.io/badge/Frontend-React-blue) ![Database](https://img.shields.io/badge/Database-PostgreSQL-blue)

## 🎯 Overview

AWS IAM policies are critical for cloud security but difficult to understand. This application takes complex JSON files and transforms them into clear, interactive visualizations showing who can do what with which resources.

## ✨ Key Features

- **Policy Upload**: Drag & drop JSON policy files with real-time validation
- **Interactive Visualizations**: Three D3.js charts with fullscreen and zoom capabilities
  - 📊 **Summary Chart**: Allow vs Deny statement breakdown
  - 🌳 **Tree Diagram**: Hierarchical policy structure with expand/collapse
  - 🕸️ **Network Graph**: Drag-and-drop relationship mapping
- **AWS-Styled UI**: Professional interface matching AWS design language
- **Mobile Responsive**: Works on desktop and mobile devices

## 🛠 Technology Stack

**Backend:** Java 17, Spring Boot 3.5, PostgreSQL, Maven, Docker  
**Frontend:** React 18, Vite, D3.js, Axios  
**Deployment:** AWS EC2, Docker containers

## 🚀 Try It Now

**Live Application:** [http://18.222.166.31:3000/](http://18.222.166.31:3000/)

1. Upload an IAM policy JSON file or use the sample policy
2. Explore interactive visualizations with fullscreen and zoom
3. Analyze policy structure, permissions, and relationships

## 📚 API Reference

### Upload Policy
```http
POST /policy/upload
Content-Type: application/json

{
  "Version": "2012-10-17",
  "Statement": [...]
}
```

**Response:** Policy analysis with visualizations data

### Health Check
```http
GET /policy/test
```

## 🗂 Project Structure

```
iam-policy-visualizer/
├── iam-backend/                 # Spring Boot Backend
│   ├── src/main/java/com/iam/iambackend/
│   │   ├── policy/              # Policy processing
│   │   └── config/              # CORS configuration
│   └── pom.xml
└── iam-frontend/               # React Frontend
    ├── src/components/
    │   ├── PolicyUploader.jsx   # File upload
    │   ├── PolicyResults.jsx    # Results display
    │   └── Policy*Chart.jsx     # D3.js visualizations
    └── package.json
```

## 🔧 Key Features Detail

### Interactive Visualizations
- **Fullscreen Mode**: Toggle fullscreen with ESC to exit
- **Zoom Controls**: +/- buttons, mouse wheel, fit-to-screen
- **Keyboard Shortcuts**: F (fit), E (expand), C (collapse), ESC (exit)
- **Mobile Optimized**: Touch-friendly controls and responsive design

### Policy Analysis
- Extracts actions, resources, principals, and conditions
- Identifies Allow vs Deny statements
- Shows policy structure and relationships
- Validates JSON format and IAM policy structure

## 🌐 Deployment

**Frontend:** `http://18.222.166.31:3000`  
**Backend API:** `http://18.222.166.31:8080`

Deployed on AWS EC2 with Docker containers and PostgreSQL database.

## 📄 License

MIT License - Built for educational purposes and AWS IAM policy understanding.

**Made with ❤️ by Alexander Ramirez**
