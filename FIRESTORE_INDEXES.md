# Firestore Index Configuration

## Required Indexes for Google Calendar Integration

The following composite indexes need to be created in the Firebase Console for optimal query performance:

### 1. Workspace Todos Index
**Collection:** `workspaceTodos`
**Fields:**
- `userId` (Ascending)
- `caseId` (Ascending) 
- `order` (Ascending)

**Purpose:** Efficient querying and sorting of todos by user and case

### 2. Workspace Events Index
**Collection:** `events`
**Fields:**
- `userId` (Ascending)
- `date` (Ascending)
- `time` (Ascending)

**Purpose:** Efficient querying and sorting of events by user and date/time

### 3. Workspace Notes Index
**Collection:** `workspaceNotes`
**Fields:**
- `userId` (Ascending)
- `caseId` (Ascending)

**Purpose:** Efficient querying of notes by user and case

## How to Create Indexes

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to Firestore Database > Indexes
4. Click "Create Index"
5. Add the fields in the order specified above
6. Set all fields to "Ascending"
7. Click "Create"

## Alternative: Auto-Generate Indexes

The application will automatically generate index creation URLs when queries fail. Look for error messages like:

```
The query requires an index. You can create it here: https://console.firebase.google.com/v1/r/project/...
```

Click these URLs to automatically create the required indexes.

## Performance Notes

- **Client-side sorting** is currently used to avoid complex index requirements
- **Simple queries** (single field filters) don't require composite indexes
- **Range queries** on multiple fields require composite indexes
- **Order by** clauses on multiple fields require composite indexes

## Current Implementation

The application uses client-side sorting for:
- Todo ordering by `order` field
- Event sorting by `date` and `time` fields

This approach works well for small to medium datasets but may need optimization for large datasets.

