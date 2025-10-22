# CRUD Server - Problem 5

A RESTful API backend server built with **ExpressJS** and **TypeScript** that provides complete CRUD (Create, Read, Update, Delete) operations for managing resources. The server uses SQLite for data persistence.

## Features

- ✅ **Create** resources
- ✅ **List** resources with filtering capabilities
- ✅ **Get** individual resource details
- ✅ **Update** resource information
- ✅ **Delete** resources
- ✅ TypeScript for type safety
- ✅ SQLite database for data persistence
- ✅ RESTful API design
- ✅ Error handling middleware
- ✅ Request logging
- ✅ CORS enabled

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: SQLite3
- **Additional Libraries**:
  - `cors` - Cross-Origin Resource Sharing
  - `dotenv` - Environment variable management
  - `ts-node-dev` - Development server with auto-reload

## Project Structure

```
src/problem5/
├── src/
│   ├── controllers/
│   │   └── resource.controller.ts    # Request handlers
│   ├── database/
│   │   └── database.ts                # Database connection & initialization
│   ├── middleware/
│   │   └── errorHandler.ts           # Error handling & logging middleware
│   ├── models/
│   │   └── resource.model.ts         # TypeScript interfaces
│   ├── routes/
│   │   └── resource.routes.ts        # API route definitions
│   ├── services/
│   │   └── resource.service.ts       # Business logic layer
│   ├── app.ts                         # Express app configuration
│   └── server.ts                      # Server entry point
├── .env.example                       # Environment variables template
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Prerequisites

Before running this application, make sure you have:

- **Node.js** (v18 or higher recommended, tested with v20.19.5)
- **pnpm** package manager (v9 or higher)
  - Install pnpm: `npm install -g pnpm@latest` or `curl -fsSL https://get.pnpm.io/install.sh | sh -`
  - Verify installation: `pnpm --version`

## Installation & Setup

### 1. Navigate to the project directory

```bash
cd src/problem5
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

Create a `.env` file in the `src/problem5` directory:

```bash
cp .env.example .env
```

Edit `.env` file (optional - defaults are provided):

```env
PORT=3000
NODE_ENV=development
DATABASE_PATH=./database.sqlite
```

### 4. Build the project

```bash
pnpm run build
```

## Running the Application

### Development Mode (with auto-reload)

```bash
pnpm run dev
```

### Production Mode

```bash
pnpm run build
pnpm start
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

## API Endpoints

### Base URL
```
http://localhost:3000
```

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "OK",
  "message": "Server is running"
}
```

---

### 1. Create a Resource

**Endpoint:** `POST /api/v1/resources`

**Request Body:**
```json
{
  "name": "Sample Resource",
  "description": "This is a sample resource",
  "category": "electronics",
  "status": "active"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Sample Resource",
    "description": "This is a sample resource",
    "category": "electronics",
    "status": "active",
    "created_at": "2025-10-22 10:30:00",
    "updated_at": "2025-10-22 10:30:00"
  },
  "message": "Resource created successfully"
}
```

---

### 2. List Resources (with filters)

**Endpoint:** `GET /api/v1/resources`

**Query Parameters:**
- `category` (optional) - Filter by category
- `status` (optional) - Filter by status
- `name` (optional) - Search by name (partial match)

**Examples:**
```http
GET /api/v1/resources
GET /api/v1/resources?category=electronics
GET /api/v1/resources?status=active
GET /api/v1/resources?name=Sample
GET /api/v1/resources?category=electronics&status=active
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Sample Resource",
      "description": "This is a sample resource",
      "category": "electronics",
      "status": "active",
      "created_at": "2025-10-22 10:30:00",
      "updated_at": "2025-10-22 10:30:00"
    }
  ],
  "count": 1
}
```

---

### 3. Get Resource Details

**Endpoint:** `GET /api/v1/resources/:id`

**Example:**
```http
GET /api/v1/resources/1
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Sample Resource",
    "description": "This is a sample resource",
    "category": "electronics",
    "status": "active",
    "created_at": "2025-10-22 10:30:00",
    "updated_at": "2025-10-22 10:30:00"
  }
}
```

**Error Response:** `404 Not Found`
```json
{
  "error": "Resource not found"
}
```

---

### 4. Update Resource

**Endpoint:** `PUT /api/v1/resources/:id`

**Request Body:** (all fields are optional)
```json
{
  "name": "Updated Resource Name",
  "description": "Updated description",
  "category": "furniture",
  "status": "inactive"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Updated Resource Name",
    "description": "Updated description",
    "category": "furniture",
    "status": "inactive",
    "created_at": "2025-10-22 10:30:00",
    "updated_at": "2025-10-22 10:45:00"
  },
  "message": "Resource updated successfully"
}
```

---

### 5. Delete Resource

**Endpoint:** `DELETE /api/v1/resources/:id`

**Example:**
```http
DELETE /api/v1/resources/1
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Resource deleted successfully"
}
```

**Error Response:** `404 Not Found`
```json
{
  "error": "Resource not found"
}
```

---

## Data Model

### Resource Schema

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | INTEGER | Auto | - | Primary key (auto-increment) |
| `name` | TEXT | Yes | - | Resource name |
| `description` | TEXT | No | NULL | Resource description |
| `category` | TEXT | No | NULL | Resource category |
| `status` | TEXT | No | 'active' | Resource status |
| `created_at` | DATETIME | Auto | CURRENT_TIMESTAMP | Creation timestamp |
| `updated_at` | DATETIME | Auto | CURRENT_TIMESTAMP | Last update timestamp |

## Testing the API

You can test the API using:

### Using cURL

**Create a resource:**
```bash
curl -X POST http://localhost:3000/api/v1/resources \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Resource",
    "description": "A test resource",
    "category": "test",
    "status": "active"
  }'
```

**List all resources:**
```bash
curl http://localhost:3000/api/v1/resources
```

**Get a specific resource:**
```bash
curl http://localhost:3000/api/v1/resources/1
```

**Update a resource:**
```bash
curl -X PUT http://localhost:3000/api/v1/resources/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Resource",
    "status": "inactive"
  }'
```

**Delete a resource:**
```bash
curl -X DELETE http://localhost:3000/api/v1/resources/1
```

### Using Postman or Thunder Client

1. Import the API endpoints into your API testing tool
2. Set the base URL to `http://localhost:3000`
3. Test each endpoint with the examples provided above

## Error Handling

The API includes comprehensive error handling:

- **400 Bad Request** - Invalid input or missing required fields
- **404 Not Found** - Resource not found or route doesn't exist
- **500 Internal Server Error** - Server-side errors

Error responses follow this format:
```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message"
}
```

## Development Scripts

- `pnpm run dev` - Start development server with auto-reload
- `pnpm run build` - Compile TypeScript to JavaScript
- `pnpm start` - Start production server
- `pnpm run clean` - Remove compiled files
- `pnpm run rebuild` - Clean and rebuild the project
- `pnpm test` - Run all tests
- `pnpm run test:watch` - Run tests in watch mode
- `pnpm run test:coverage` - Run tests with coverage report

## Database

The application uses SQLite for simplicity and portability. The database file (`database.sqlite`) is automatically created in the project root when you first run the application.

To reset the database, simply delete the `database.sqlite` file and restart the server.

---

## Testing

The project includes comprehensive unit and integration tests using Jest and Supertest.

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode (re-runs on file changes)
pnpm run test:watch

# Run tests with coverage report
pnpm run test:coverage
```

### Test Structure

```
src/__tests__/
├── setup.ts                           # Test configuration
├── services/
│   └── resource.service.test.ts       # Service layer tests
├── api/
│   └── resource.api.test.ts           # API endpoint tests
└── middleware/
    └── errorHandler.test.ts           # Middleware tests
```

### Test Coverage

The test suite covers:
- ✅ **Service Layer**: All CRUD operations, filtering, validation
- ✅ **API Endpoints**: All HTTP methods, status codes, error handling
- ✅ **Middleware**: Error handling, logging, 404 handling
- ✅ **Edge Cases**: Invalid inputs, non-existent resources, empty data

### Example Test Output

```bash
PASS  src/__tests__/services/resource.service.test.ts
PASS  src/__tests__/api/resource.api.test.ts
PASS  src/__tests__/middleware/errorHandler.test.ts

Test Suites: 3 passed, 3 total
Tests:       45 passed, 45 total
Snapshots:   0 total
Time:        2.5s
```

---

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production` in your `.env` file
2. Build the project: `pnpm run build`
3. Start the server: `pnpm start`
4. Consider using a process manager like PM2:
   ```bash
   pnpm install -g pm2
   pm2 start dist/server.js --name crud-server
   ```

## Notes

- The database is created automatically on first run
- All timestamps are in UTC
- The API supports CORS for cross-origin requests
- Request logging is enabled by default
- TypeScript provides compile-time type checking for better code quality

## License

MIT
