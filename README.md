# Mini Jira — Full-Stack Task Management

## Architecture

```
CloudFront (https://d1kjmg4gujmstj.cloudfront.net)
    ├── /api/* → ALB → ECS (NestJS backend, port 3000)
    └── /*    → S3 static OR Next.js SSR (frontend)

AWS Services:
- Cognito (us-east-1_0EKgT0EKP)  — Auth / JWT
- DynamoDB                         — All data storage
- S3 (originals + resized buckets) — Image storage
- SNS (task-assignment-topic)      — Task assignment notifications
- SQS (task-assignment-queue)      — Async task processing
- CloudWatch (MiniJira namespace)  — Metrics & dashboard
- Lambda (image-resize, assignment-worker, daily-digest)
```

## CloudFront URL
**https://d1kjmg4gujmstj.cloudfront.net**

## Quick Start

### Backend
```bash
cd backend
npm install
npm run start:dev    # development
npm run build        # production build
npm run start:prod   # production
```

### Frontend
```bash
cd frontend
npm install
npm run dev          # development (port 3001 or 3000)
npm run build        # production build
npm run start        # production
```

## Demo Scenario — Ali (Manager) → Sara + Omar

1. **Ali (manager)** logs in at https://d1kjmg4gujmstj.cloudfront.net/login
2. Ali creates teams: "Frontend Team" and "Backend Team"
3. Ali invites **Sara** (employee, Frontend Team) and **Omar** (employee, Backend Team)
4. Ali creates tasks:
   - "Design Landing Page" → assigned to Sara (Frontend Team)
   - "Set up API Gateway" → assigned to Omar (Backend Team)
5. **Sara** logs in → sees ONLY Frontend Team tasks (enforced server-side via DynamoDB GSI)
6. **Omar** logs in → sees ONLY Backend Team tasks (enforced server-side via DynamoDB GSI)
7. Sara drags "Design Landing Page" from To Do → In Progress on the Kanban board
   → CloudWatch metric `TimeToCloseHours` published on completion
8. Both receive SNS email notifications on task assignment via Lambda `assignment-worker`

## DynamoDB Tables
| Table | Partition Key | GSI |
|-------|--------------|-----|
| Users | userId | teamId-index (teamId) |
| Teams | teamId | — |
| Projects | projectId | teamId-index (teamId) |
| Tasks | taskId | teamId-index (teamId), assigneeId-index (assigneeId) |
| Comments | commentId | taskId (via query) |
| ActivityLog | logId | — |

## Lambda Functions
- **image-resize**: S3 trigger → sharp resize to 300×300 → save to resized bucket
- **assignment-worker**: SQS (from SNS) → write ActivityLog → publish CloudWatch metric
- **daily-digest**: EventBridge 6AM UTC → scan due tasks → publish SNS emails

## CORS
Backend allows: `https://d1kjmg4gujmstj.cloudfront.net`, `http://localhost:3000`, `http://localhost:3001`
