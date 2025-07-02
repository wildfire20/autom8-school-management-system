# AutoM8 School Management System - API Testing

## Using PowerShell (Windows)

### 1. Test the server is running
```powershell
Invoke-RestMethod -Uri "http://localhost:3000" -Method GET
```

### 2. Test GET /api/auth/test
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/test" -Method GET
```

### 3. Test POST /api/auth/register
```powershell
$registerData = @{
    full_name = "John Doe"
    email = "john.doe@school.edu"
    student_number = "STU12345"
    password = "securePassword123"
    role = "student"
    school_id = 1
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method POST -Body $registerData -ContentType "application/json"
```

## Using curl (Git Bash or WSL)

### 1. Test GET /api/auth/test
```bash
curl http://localhost:3000/api/auth/test
```

### 2. Test POST /api/auth/register
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Jane Smith",
    "email": "jane.smith@school.edu", 
    "student_number": "STU67890",
    "password": "securePassword123",
    "role": "student",
    "school_id": 1
  }' \
  http://localhost:3000/api/auth/register
```

## Using Node.js Test Script

Run the included test script:
```bash
node test-routes.js
```

## Postman Collection

Import this JSON into Postman:

```json
{
  "info": {
    "name": "AutoM8 School Management API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Test Route",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:3000/api/auth/test",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "auth", "test"]
        }
      }
    },
    {
      "name": "Register User",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"full_name\": \"Test User\",\n  \"email\": \"test@school.edu\",\n  \"student_number\": \"STU001\",\n  \"password\": \"password123\",\n  \"role\": \"student\",\n  \"school_id\": 1\n}"
        },
        "url": {
          "raw": "http://localhost:3000/api/auth/register",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "auth", "register"]
        }
      }
    }
  ]
}
```
