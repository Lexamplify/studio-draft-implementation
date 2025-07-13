# API Endpoints Documentation

This document provides a comprehensive list of all API endpoints used in the LEXamplify web application.

## Authentication & User Management

### Exchange Google Credentials
- **Endpoint**: `/api/exchange-google-credential`
- **Method**: POST
- **Description**: Exchanges Google OAuth code for access tokens
- **Request Body**:
  ```json
  {
    "code": "string",
    "clientId": "string",
    "clientSecret": "string",
    "redirectUri": "string"
  }
  ```
- **Response**: Returns Google OAuth tokens
- **Error Codes**: 400 (Missing fields), 500 (Exchange failed)

## Document Management

### My Drafts
- **Endpoint**: `/api/my-drafts`
- **Method**: GET
- **Description**: Retrieves user's draft documents
- **Headers**: 
  - `Authorization: Bearer <idToken>`
- **Response**: 
  ```json
  {
    "drafts": [
      {
        "id": "string",
        "fileName": "string",
        "docUrl": "string",
        "templateType": "string",
        "createdAt": "timestamp"
      }
    ]
  }
  ```
- **Error Codes**: 401 (Unauthorized), 500 (Failed to fetch drafts)

### Download Template
- **Endpoint**: `/api/download-template`
- **Method**: POST
- **Description**: Generates a signed URL for downloading a template
- **Request Body**:
  ```json
  {
    "storageUrl": "string",
    "storagePath": "string"
  }
  ```
- **Response**: 
  ```json
  {
    "signedUrl": "string"
  }
  ```
- **Error Codes**: 400 (Invalid URL), 500 (Failed to generate URL)

### Copy to Google Drive
- **Endpoint**: `/api/copy-to-drive`
- **Method**: POST
- **Description**: Copies a template to user's Google Drive
- **Headers**:
  - `Authorization: Bearer <idToken>`
- **Request Body**:
  ```json
  {
    "templateUrl": "string",
    "templateType": "gdoc|docx",
    "accessToken": "string",
    "fileName": "string",
    "folderId": "string"
  }
  ```
- **Response**:
  ```json
  {
    "docUrl": "string"
  }
  ```
- **Error Codes**: 400 (Missing fields), 500 (Copy failed)

### Parse Document
- **Endpoint**: `/api/parse-document`
- **Method**: POST
- **Description**: Parses uploaded documents (PDF/DOCX) to extract text
- **Request Body**: FormData with file
- **Response**:
  ```json
  {
    "text": "string"
  }
  ```
- **Error Codes**: 400 (No file/Unsupported type), 500 (Parse failed)

## Legal Assistant & AI Features

### Legal Advice Chat
- **Endpoint**: `/api/legal-advice-chat`
- **Method**: POST
- **Description**: Handles legal advice chat interactions with AI
- **Request Body**:
  ```json
  {
    "question": "string",
    "chatHistory": [
      {
        "role": "user|model",
        "parts": [{"text": "string"}]
      }
    ],
    "action": "GeneralChat",
    "document": "string",
    "documentName": "string"
  }
  ```
- **Response**:
  ```json
  {
    "answer": "string"
  }
  ```
- **Error Codes**: 500 (Processing error)

### Search Templates
- **Endpoint**: `http://localhost:8000/api/search-templates`
- **Method**: POST
- **Description**: Semantic search for legal templates
- **Request Body**:
  ```json
  {
    "query": "string"
  }
  ```
- **Response**:
  ```json
  {
    "results": [
      {
        "id": "string",
        "name": "string",
        "description": "string",
        "storageUrl": "string"
      }
    ]
  }
  ```
- **Error Codes**: 500 (Search failed)

### AI Suggest
- **Endpoint**: `/suggest`
- **Method**: POST
- **Description**: AI-powered suggestions for legal document drafting
- **Request Body**:
  ```json
  {
    "actionType": "AISuggest",
    "caseId": "string",
    "templateName": "string",
    "draftContext": "string"
  }
  ```
- **Response**:
  ```json
  {
    "suggestion": "string"
  }
  ```
- **Error Codes**: 400 (Invalid request), 500 (AI processing failed)

## Case Management

### Get Cases
- **Endpoint**: `/cases`
- **Method**: GET
- **Description**: Retrieves list of all cases
- **Response**:
  ```json
  [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "caseSummary": "string"
    }
  ]
  ```
- **Error Codes**: 500 (Failed to load cases)

### Get Case Details
- **Endpoint**: `/cases/:caseId`
- **Method**: GET
- **Description**: Retrieves detailed information about a specific case
- **Response**:
  ```json
  {
    "id": "string",
    "name": "string",
    "description": "string",
    "caseSummary": "string",
    "files": [
      {
        "id": "string",
        "name": "string",
        "url": "string"
      }
    ]
  }
  ```
- **Error Codes**: 404 (Case not found), 500 (Internal server error)

## Notes
1. All endpoints requiring authentication expect a valid Firebase ID token in the Authorization header
2. File upload endpoints support PDF and DOCX formats
3. Google Drive integration requires valid Google OAuth tokens
4. AI features are rate-limited and may have usage restrictions
5. Some endpoints may require specific user roles or permissions 