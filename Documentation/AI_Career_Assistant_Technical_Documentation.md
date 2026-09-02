# AI Career Assistant — Technical Documentation

## 1. System Overview

The AI Career Assistant is a web-based application designed to help university students and recent graduates create, improve, analyze, and customize their CVs.

The application uses:

- **Frontend:** React
- **Backend:** Python + FastAPI
- **AI Model:** Gemini
- **Database:** MySQL
- **Deployment:** Docker
- **PDF Generation:** Python-based PDF generation library (TBD)

The main architecture is:

```text
User
  │
  ▼
React Frontend
  │
  │ HTTP / REST API
  ▼
FastAPI Backend
  │
  ├── MySQL Database
  │
  ├── Gemini AI
  │
  └── PDF Generator
```

---

# 2. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React | User interface |
| Frontend Tooling | Node.js + npm | Running React tooling and managing packages |
| Backend | Python | Backend application logic |
| API Framework | FastAPI | REST API and request handling |
| AI | Gemini | CV generation, analysis, customization, and chatbot |
| Database | MySQL | Persistent application data |
| PDF Generation | Python library | Generate downloadable CV PDFs |
| Deployment | Docker | Containerize and deploy the application |
| API Communication | HTTP / REST | Frontend-backend communication |

**Important:** Node.js is used for React development and package management. It is not the backend of the application.

---

# 3. System Communication

The frontend communicates with the backend through HTTP/REST APIs.

```text
React
  │
  │ HTTP Request
  ▼
FastAPI
  │
  ├── Database Operations → MySQL
  │
  ├── AI Requests → Gemini
  │
  └── PDF Generation → Python PDF Service
```

The React frontend does **not** communicate directly with Gemini.

The Gemini API key and AI-related business logic remain on the backend.

---

# 4. Main Technical Components

The system consists of the following main components:

1. React Frontend
2. FastAPI Backend
3. MySQL Database
4. Gemini AI Service
5. CV Service
6. Chatbot Service
7. CV Analysis Service
8. Job Customization Service
9. PDF Generation Service
10. Authentication Service
11. Docker Deployment Environment

---

# 5. Frontend Architecture

The frontend is built using React.

Its main responsibilities are:

- Displaying the application interface
- Collecting user input
- Displaying CV information
- Allowing users to edit their CV
- Displaying AI-generated content
- Displaying CV analysis results
- Providing the AI chatbot interface
- Sending requests to the FastAPI backend
- Displaying loading and error states

The frontend should not contain sensitive API keys or direct Gemini API calls.

---

# 6. Frontend Pages and Interfaces

The main pages are:

### Authentication

- Login
- Register

### Main Application

- Dashboard
- Career Profile
- My CVs
- Create CV
- Edit CV
- Analyze CV
- Customize CV
- AI Career Chatbot
- Interview Preparation

### CV Editor

The CV editor allows users to:

- Edit personal information
- Edit professional summary
- Edit education
- Edit experience
- Edit skills
- Edit projects
- Edit certifications
- Select a CV template
- Preview the CV
- Ask the AI assistant for modifications
- Save changes
- Export the CV as PDF

---

# 7. Frontend Project Skeleton

```text
frontend/
│
├── src/
│   │
│   ├── components/
│   │   │
│   │   ├── common/
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Loading.jsx
│   │   │   └── ErrorMessage.jsx
│   │   │
│   │   ├── layout/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── DashboardLayout.jsx
│   │   │
│   │   ├── profile/
│   │   │   ├── PersonalInfoForm.jsx
│   │   │   ├── EducationForm.jsx
│   │   │   ├── ExperienceForm.jsx
│   │   │   ├── SkillsForm.jsx
│   │   │   ├── ProjectsForm.jsx
│   │   │   └── CertificationsForm.jsx
│   │   │
│   │   ├── cv/
│   │   │   ├── CVEditor.jsx
│   │   │   ├── CVPreview.jsx
│   │   │   ├── CVSection.jsx
│   │   │   ├── TemplateSelector.jsx
│   │   │   └── CVActions.jsx
│   │   │
│   │   ├── chatbot/
│   │   │   ├── Chatbot.jsx
│   │   │   ├── ChatMessage.jsx
│   │   │   ├── ChatInput.jsx
│   │   │   └── CVActionNotification.jsx
│   │   │
│   │   ├── analyzer/
│   │   │   ├── ScoreCard.jsx
│   │   │   ├── AnalysisResult.jsx
│   │   │   └── Recommendation.jsx
│   │   │
│   │   └── jobs/
│   │       ├── JobDescriptionForm.jsx
│   │       ├── JobAnalysis.jsx
│   │       └── CustomizedCV.jsx
│   │
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Profile.jsx
│   │   ├── MyCVs.jsx
│   │   ├── CreateCV.jsx
│   │   ├── EditCV.jsx
│   │   ├── AnalyzeCV.jsx
│   │   ├── CustomizeCV.jsx
│   │   ├── Chatbot.jsx
│   │   └── InterviewPreparation.jsx
│   │
│   ├── services/
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── profileService.js
│   │   ├── cvService.js
│   │   ├── chatService.js
│   │   ├── analysisService.js
│   │   ├── jobService.js
│   │   └── pdfService.js
│   │
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useProfile.js
│   │   ├── useCV.js
│   │   └── useChat.js
│   │
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── CVContext.jsx
│   │
│   ├── types/
│   │   ├── user.js
│   │   ├── profile.js
│   │   ├── cv.js
│   │   └── chat.js
│   │
│   ├── utils/
│   │   ├── validation.js
│   │   └── formatting.js
│   │
│   ├── assets/
│   │
│   ├── App.jsx
│   └── main.jsx
│
├── public/
├── package.json
└── ...
```

### Frontend Folder Responsibilities

- `pages/` — Complete screens shown to the user.
- `components/` — Reusable UI components.
- `services/` — Functions responsible for calling FastAPI endpoints.
- `hooks/` — Reusable React logic.
- `context/` — Global application state.
- `types/` — Frontend data structures.
- `utils/` — Helper and validation functions.
- `assets/` — Images, icons, and other frontend assets.

---

# 8. Backend Architecture

The backend is built with **Python and FastAPI**.

Its responsibilities include:

- Authentication
- User profile management
- CV management
- CV generation
- CV analysis
- Job-specific CV customization
- Chatbot processing
- Gemini communication
- PDF generation
- Database operations
- Data validation
- Authorization
- Error handling

The backend is the main application layer between the React frontend and the external/internal services.

---

# 9. Backend Project Skeleton

```text
backend/
│
├── app/
│   │
│   ├── main.py
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── profile.py
│   │   ├── cv.py
│   │   ├── chat.py
│   │   ├── analysis.py
│   │   ├── jobs.py
│   │   └── pdf.py
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── profile_service.py
│   │   ├── cv_service.py
│   │   ├── chatbot_service.py
│   │   ├── analysis_service.py
│   │   ├── job_service.py
│   │   ├── ai_service.py
│   │   └── pdf_service.py
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── profile.py
│   │   ├── cv.py
│   │   ├── conversation.py
│   │   ├── job.py
│   │   └── analysis.py
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── profile.py
│   │   ├── cv.py
│   │   ├── chat.py
│   │   ├── job.py
│   │   └── analysis.py
│   │
│   ├── database/
│   │   ├── __init__.py
│   │   ├── connection.py
│   │   ├── session.py
│   │   └── base.py
│   │
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   └── dependencies.py
│   │
│   └── utils/
│       ├── validators.py
│       └── helpers.py
│
├── requirements.txt
├── .env
└── ...
```

---

# 10. Backend Folder Responsibilities

### `main.py`

Creates the FastAPI application and:

- Registers API routers
- Configures middleware
- Configures CORS
- Initializes the application

### `api/`

Contains API routes/endpoints.

Examples:

```text
POST   /api/auth/register
POST   /api/auth/login

GET    /api/profile
PUT    /api/profile

POST   /api/cv/generate
GET    /api/cv
GET    /api/cv/{cv_id}
PUT    /api/cv/{cv_id}

POST   /api/chat/message

POST   /api/cv/analyze

POST   /api/jobs/customize

GET    /api/cv/{cv_id}/pdf
```

The API layer should mainly:

1. Receive the request.
2. Validate the request.
3. Call the appropriate service.
4. Return the response.

### `services/`

Contains the application's business logic.

For example:

```text
cv_service.py
```

handles operations such as:

- Creating CVs
- Updating CV sections
- Retrieving CVs
- Managing CV versions

### `models/`

Contains the database models representing MySQL tables.

### `schemas/`

Contains Pydantic request and response schemas.

### `database/`

Handles MySQL database connections, sessions, and base model configuration.

### `core/`

Contains configuration, security, authentication dependencies, and shared backend configuration.

### `utils/`

Contains reusable helper functions and validation utilities.

---

# 11. Database Architecture

The application uses **MySQL** as its relational database.

The database stores persistent application data such as:

- Users
- Career profiles
- CVs
- CV versions
- Conversations
- Chat messages
- Job descriptions
- CV analysis results

A simplified relationship is:

```text
User
 │
 ├── Career Profile
 │
 ├── CVs
 │    └── CV Versions
 │
 ├── Conversations
 │    └── Chat Messages
 │
 ├── Job Descriptions
 │
 └── CV Analysis Results
```

---

# 12. Main Database Models

The initial database models are:

### User

Stores authentication-related information.

Possible fields:

```text
id
email
password_hash
created_at
updated_at
```

### Profile

Stores the user's central career information.

Possible fields:

```text
id
user_id
full_name
phone
email
location
summary
linkedin
github
created_at
updated_at
```

### CV

Stores the main CV record.

Possible fields:

```text
id
user_id
title
template
created_at
updated_at
```

### CV Version

Stores versions of a CV.

Possible fields:

```text
id
cv_id
version_number
content
created_at
```

### Conversation

Stores chatbot conversations.

Possible fields:

```text
id
user_id
title
created_at
updated_at
```

### Chat Message

Stores individual chatbot messages.

Possible fields:

```text
id
conversation_id
role
content
created_at
```

### Job Description

Stores job descriptions used for customization.

Possible fields:

```text
id
user_id
title
company
description
created_at
```

### Analysis

Stores CV analysis results.

Possible fields:

```text
id
user_id
cv_id
score
results
recommendations
created_at
```

The exact database design may be refined during implementation.

---

# 13. CV Data Model

The CV should be stored as structured data rather than only as a generated PDF.

Example:

```json
{
  "personal_info": {},
  "summary": "",
  "education": [],
  "experience": [],
  "skills": [],
  "projects": [],
  "certifications": []
}
```

This makes it possible to update individual CV sections.

For example:

```text
User
  ↓
CV Editor
  ↓
Update Summary
  ↓
FastAPI
  ↓
CV Service
  ↓
MySQL
```

---

# 14. CV Version Management

The system should support CV versions.

For example:

```text
CV
│
├── Version 1
├── Version 2
├── Version 3
└── Version 4
```

This allows users to:

- Keep previous CV versions
- Review changes
- Restore previous content
- Create customized versions for different jobs

---

# 15. AI Architecture

Gemini is used as the application's AI model.

The backend contains a centralized:

```text
ai_service.py
```

This service is responsible for communicating with Gemini.

Other services can use it:

```text
CV Service
     │
     ▼
AI Service
     │
     ▼
Gemini

Analysis Service
     │
     ▼
AI Service
     │
     ▼
Gemini

Job Service
     │
     ▼
AI Service
     │
     ▼
Gemini

Chatbot Service
     │
     ▼
AI Service
     │
     ▼
Gemini
```

This prevents different parts of the application from implementing separate Gemini integrations.

---

# 16. AI Context Management

Gemini may need different context depending on the task.

For example, the chatbot may receive:

```text
User Profile
+
Current CV
+
Job Description
+
Conversation History
+
Current User Request
```

The backend is responsible for collecting the appropriate context before sending a request to Gemini.

The frontend should not be responsible for assembling or managing sensitive AI context.

---

# 17. AI Career Chatbot Architecture

The chatbot is available from:

- Dashboard
- CV Editor

The chatbot can answer career questions and can also understand requests related to the user's CV.

Example:

> "Make my summary shorter and focus more on Python."

The flow is:

```text
React Chatbot
      │
      ▼
POST /api/chat/message
      │
      ▼
Chatbot Service
      │
      ├── User Profile
      ├── Current CV
      ├── Job Description
      └── Chat History
      │
      ▼
AI Service
      │
      ▼
Gemini
```

---

# 18. Conversational CV Editing

The chatbot should be able to identify when the user wants to modify the CV.

For example:

> "Add Python to my skills."

Instead of allowing Gemini to directly update the database, Gemini should return a structured action.

Example:

```json
{
  "type": "cv_update",
  "section": "skills",
  "action": "add",
  "content": "Python"
}
```

The backend then validates and applies the action.

---

# 19. CV Modification Flow

The correct architecture is:

```text
User
  │
  ▼
React Chatbot
  │
  ▼
Chatbot Service
  │
  ▼
Gemini
  │
  ▼
Structured CV Action
  │
  ▼
CV Service
  │
  ▼
Validation
  │
  ▼
MySQL
  │
  ▼
Updated CV
  │
  ▼
React CV Editor
```

The chatbot should **not** directly modify the database.

The CV Service remains responsible for changing CV data.

---

# 20. AI Safety and Data Integrity

The AI must not invent:

- Skills
- Work experience
- Education
- Projects
- Certifications
- Achievements
- Qualifications

AI-generated content should be based on information provided by the user.

When the AI suggests a CV modification, the application should allow the user to review the change before or while applying it, depending on the final UX design.

---

# 21. API Architecture

The backend follows a REST API structure.

Example endpoint groups:

```text
/api/auth
/api/profile
/api/cv
/api/chat
/api/analysis
/api/jobs
/api/pdf
```

Example:

```text
POST /api/cv/generate
```

The request may contain the user's profile information or a reference to the stored profile.

The backend then:

```text
Request
  ↓
API Route
  ↓
CV Service
  ↓
AI Service
  ↓
Gemini
  ↓
CV Service
  ↓
MySQL
  ↓
Response
```

---

# 22. CV Generation Workflow

The CV generation process is:

```text
User Profile
     │
     ▼
React
     │
     ▼
FastAPI
     │
     ▼
CV Service
     │
     ▼
AI Service
     │
     ▼
Gemini
     │
     ▼
Structured CV
     │
     ▼
CV Service
     │
     ▼
MySQL
     │
     ▼
React CV Editor
```

---

# 23. Job-Specific CV Workflow

The user can provide a job description.

The system compares:

```text
User Career Profile
+
Current CV
+
Job Description
```

The information is sent to Gemini through the backend.

Gemini can identify:

- Relevant skills
- Relevant experience
- Relevant projects
- Missing or important keywords
- Areas that should be emphasized

The system then generates a customized CV based only on the user's actual information.

---

# 24. CV Analysis Workflow

The CV Analyzer evaluates the user's CV.

Example flow:

```text
React
  │
  ▼
FastAPI
  │
  ▼
Analysis Service
  │
  ▼
AI Service
  │
  ▼
Gemini
  │
  ▼
Analysis Result
  │
  ▼
React
```

Possible results include:

- Overall score
- Strengths
- Weaknesses
- Recommendations
- Missing information
- Formatting/content suggestions

---

# 25. PDF Generation Workflow

The CV is stored as structured data.

When the user requests a PDF:

```text
React
  │
  ▼
FastAPI
  │
  ▼
PDF Service
  │
  ▼
CV Data + Selected Template
  │
  ▼
PDF Generator
  │
  ▼
PDF File
  │
  ▼
User
```

The PDF generation library is still to be selected.

---

# 26. Authentication and Authorization

Authentication is handled by the FastAPI backend.

The system should ensure that users can only access their own:

- Profile
- CVs
- Conversations
- Job descriptions
- Analysis results

The frontend should not be trusted to enforce authorization.

Authorization must be validated by the backend.

---

# 27. Data Validation

Validation should occur at multiple levels.

### Frontend

Used for:

- Required fields
- Basic input validation
- User experience

### Backend

Used for:

- Request validation
- Data types
- Required fields
- Business rules
- Authorization
- AI-generated action validation

Pydantic schemas should be used for API request and response validation.

---

# 28. Error Handling

The backend should return appropriate HTTP errors.

Examples:

```text
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
422 Validation Error
500 Internal Server Error
```

The frontend should display user-friendly messages instead of raw backend errors.

---

# 29. Security Considerations

Important security requirements include:

### Gemini API Key

The Gemini API key must only exist on the backend.

```text
React ❌ → Gemini
React → FastAPI → Gemini ✅
```

### Database Credentials

MySQL credentials must be stored in environment variables and not hardcoded.

### Authentication

Passwords must never be stored as plain text.

### Authorization

Every user-specific resource must be checked against the authenticated user.

### Environment Variables

Sensitive configuration should be stored in `.env` during local development and supplied securely in deployment environments.

---

# 30. Docker Deployment Architecture

The application will be deployed using **Docker**.

The main containers are:

```text
                    Docker Environment
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
   React Container   FastAPI Container   MySQL Container
          │                │                │
          │                ├──── Gemini ────┤
          │                │
          │                └──── PDF
          │
          └──── HTTP/API ─────► FastAPI
```

A Docker Compose setup can be used to manage the frontend, backend, and MySQL containers together.

---

# 31. Docker Project Structure

The overall project can be organized as:

```text
ai-career-assistant/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── Dockerfile
│
├── backend/
│   ├── app/
│   ├── requirements.txt
│   ├── .env
│   └── Dockerfile
│
├── docker-compose.yml
├── .env
├── .gitignore
└── README.md
```

---

# 32. Docker Compose Architecture

A simplified Docker Compose configuration will contain:

```text
services:

  frontend:
    React application

  backend:
    FastAPI application

  mysql:
    MySQL database
```

Communication:

```text
Browser
   │
   ▼
Frontend Container
   │
   ▼
Backend Container
   │
   ├──► MySQL Container
   │
   ├──► Gemini API
   │
   └──► PDF Generator
```

The containers communicate through the Docker network.

MySQL does not need to be exposed publicly to the internet.

---

# 33. Complete Project Skeleton

The complete initial project structure is:

```text
ai-career-assistant/
│
├── frontend/
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── layout/
│   │   │   ├── profile/
│   │   │   ├── cv/
│   │   │   ├── chatbot/
│   │   │   ├── analyzer/
│   │   │   └── jobs/
│   │   │
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── MyCVs.jsx
│   │   │   ├── CreateCV.jsx
│   │   │   ├── EditCV.jsx
│   │   │   ├── AnalyzeCV.jsx
│   │   │   ├── CustomizeCV.jsx
│   │   │   ├── Chatbot.jsx
│   │   │   └── InterviewPreparation.jsx
│   │   │
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   ├── profileService.js
│   │   │   ├── cvService.js
│   │   │   ├── chatService.js
│   │   │   ├── analysisService.js
│   │   │   ├── jobService.js
│   │   │   └── pdfService.js
│   │   │
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── assets/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── public/
│   ├── package.json
│   └── Dockerfile
│
├── backend/
│   │
│   ├── app/
│   │   ├── main.py
│   │   │
│   │   ├── api/
│   │   │   ├── auth.py
│   │   │   ├── profile.py
│   │   │   ├── cv.py
│   │   │   ├── chat.py
│   │   │   ├── analysis.py
│   │   │   ├── jobs.py
│   │   │   └── pdf.py
│   │   │
│   │   ├── services/
│   │   │   ├── auth_service.py
│   │   │   ├── profile_service.py
│   │   │   ├── cv_service.py
│   │   │   ├── chatbot_service.py
│   │   │   ├── analysis_service.py
│   │   │   ├── job_service.py
│   │   │   ├── ai_service.py
│   │   │   └── pdf_service.py
│   │   │
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── profile.py
│   │   │   ├── cv.py
│   │   │   ├── conversation.py
│   │   │   ├── job.py
│   │   │   └── analysis.py
│   │   │
│   │   ├── schemas/
│   │   │   ├── auth.py
│   │   │   ├── profile.py
│   │   │   ├── cv.py
│   │   │   ├── chat.py
│   │   │   ├── job.py
│   │   │   └── analysis.py
│   │   │
│   │   ├── database/
│   │   │   ├── connection.py
│   │   │   ├── session.py
│   │   │   └── base.py
│   │   │
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── dependencies.py
│   │   │
│   │   └── utils/
│   │       ├── validators.py
│   │       └── helpers.py
│   │
│   ├── requirements.txt
│   ├── .env
│   └── Dockerfile
│
├── docker-compose.yml
├── .env
├── .gitignore
└── README.md
```

---

# 34. Overall Application Flow

The overall architecture is:

```text
                         USER
                           │
                           ▼
                  ┌─────────────────┐
                  │ React Frontend  │
                  └────────┬────────┘
                           │
                        HTTP/REST
                           │
                           ▼
                  ┌─────────────────┐
                  │ FastAPI Backend │
                  └────────┬────────┘
                           │
          ┌────────────────┼──────────────────┐
          │                │                  │
          ▼                ▼                  ▼
      API Layer        Services          MySQL Database
                           │
             ┌─────────────┼──────────────┐
             │             │              │
             ▼             ▼              ▼
        CV Service    Chatbot Service  Job Service
             │             │
             │             ▼
             │        AI/Gemini Service
             │             │
             │             ▼
             │           Gemini
             │
             ▼
        PDF Service
```

---

# 35. Main User-to-System Flow

A typical user journey through the technical system is:

```text
User Registers
      │
      ▼
React
      │
      ▼
FastAPI
      │
      ▼
MySQL
      │
      ▼
User Creates Career Profile
      │
      ▼
Profile Stored in MySQL
      │
      ▼
User Generates CV
      │
      ▼
FastAPI → Gemini
      │
      ▼
Generated Structured CV
      │
      ▼
MySQL
      │
      ▼
React CV Editor
      │
      ├──────────────► User Manually Edits
      │
      ├──────────────► AI Chatbot Modification
      │
      ├──────────────► CV Analysis
      │
      ├──────────────► Job-Specific Customization
      │
      └──────────────► PDF Export
```

---

# 36. Important Architectural Principles

### 1. React is the presentation layer

React handles:

- UI
- User interaction
- Forms
- CV editing interface
- Chatbot interface
- Displaying results

### 2. FastAPI is the application/backend layer

FastAPI handles:

- Authentication
- Business logic
- API requests
- Database access
- AI requests
- PDF generation

### 3. MySQL is the persistent data layer

MySQL stores:

- User data
- Profile data
- CV data
- CV versions
- Chat history
- Job descriptions
- Analysis results

### 4. Gemini is accessed through the backend

The frontend never directly calls Gemini.

### 5. CV modifications go through the CV Service

The chatbot does not directly modify the database.

### 6. CV data is structured

The CV should be stored in structured form so individual sections can be modified.

### 7. Docker provides the deployment environment

Frontend, backend, and MySQL are containerized and managed as part of the deployment architecture.

---

# 37. Final Architecture

The final system architecture is:

```text
                         ┌──────────────┐
                         │     USER     │
                         └──────┬───────┘
                                │
                                ▼
                    ┌─────────────────────┐
                    │   React Frontend    │
                    │                     │
                    │ Dashboard           │
                    │ Profile             │
                    │ CV Editor           │
                    │ CV Analyzer         │
                    │ Job Customization   │
                    │ AI Chatbot          │
                    └──────────┬──────────┘
                               │
                            HTTP/REST
                               │
                               ▼
                    ┌─────────────────────┐
                    │   FastAPI Backend   │
                    │                     │
                    │ API Layer           │
                    │ Services            │
                    │ Validation           │
                    │ Authentication      │
                    └───────┬─────┬───────┘
                            │     │
                 ┌──────────┘     └───────────┐
                 ▼                            ▼
        ┌─────────────────┐          ┌─────────────────┐
        │   MySQL         │          │  AI Service     │
        │   Database      │          │                 │
        │                 │          │    Gemini       │
        └─────────────────┘          └─────────────────┘
                 ▲
                 │
                 │
        ┌────────┴────────┐
        │  PDF Service    │
        │                 │
        │ Python PDF Gen. │
        └─────────────────┘


                 Docker Deployment
        ┌─────────────────────────────────┐
        │                                 │
        │  Frontend Container             │
        │  Backend Container              │
        │  MySQL Container                │
        │                                 │
        └─────────────────────────────────┘
```

The core architectural principle is:

> **React handles what the user sees, FastAPI handles what the application does, MySQL stores the application's persistent data, Gemini provides the AI capabilities, and Docker provides the deployment environment.**
