# Phrase Learner

A single-user phrase learning app with spaced repetition.

## Tech Stack

- **Backend**: ASP.NET Core 9, Entity Framework Core, SQLite
- **Frontend**: Angular 19, standalone components
- **Container**: Docker (multi-stage build)

## Features

- Add phrases with meaning, example, and personal notes
- Spaced repetition review system
- Mobile-first responsive design
- Single container deployment

## Review Logic

| Status   | Review Interval |
|----------|-----------------|
| New      | Immediately     |
| Learning | 1-2 days        |
| Known    | 7 days          |

- **Know**: Confidence +1, advance status when confidence >= 3
- **Don't Know**: Confidence -1, revert to Learning if Known

## API Endpoints

| Method | Endpoint            | Description              |
|--------|---------------------|--------------------------|
| GET    | /api/review/today   | Get phrases due today    |
| POST   | /api/phrases        | Create a new phrase      |
| PUT    | /api/phrases/{id}   | Update a phrase          |
| POST   | /api/review/{id}    | Submit review action     |

## Local Development

### Prerequisites

- .NET 9 SDK
- Node.js 22+
- Docker (for containerized run)

### Run with Docker

```bash
docker build -t phrase-learner .
docker run -p 8080:8080 -v phrase-data:/data phrase-learner
```

Open http://localhost:8080

## Deploy to Render.com

1. **Create a new Web Service** on Render
2. **Connect your repository**
3. **Configure settings**:
   - **Environment**: Docker
   - **Region**: Choose closest to you
   - **Instance Type**: Free or Starter
4. **Add a Disk**:
   - **Mount Path**: `/data`
   - **Size**: 1 GB (minimum)
5. **Deploy**

### Render.com Configuration

Create a `render.yaml` in your repo root (optional, for Blueprint):

```yaml
services:
  - type: web
    name: phrase-learner
    runtime: docker
    plan: free
    healthCheckPath: /api/review/today
    disk:
      name: phrase-data
      mountPath: /data
      sizeGB: 1
```

## Project Structure

```
phrases/
├── Backend/
│   └── PhraseLearner.Api/
│       ├── Controllers/
│       ├── Data/
│       ├── Dtos/
│       ├── Migrations/
│       ├── Models/
│       ├── Services/
│       └── Program.cs
├── Frontend/
│   └── src/
│       └── app/
│           ├── add-phrase/
│           ├── models/
│           ├── review/
│           └── services/
├── Dockerfile
└── README.md
```

## License

MIT
