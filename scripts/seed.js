const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});
const db = DynamoDBDocumentClient.from(client);

// ── Real Cognito users ──────────────────────────────────────────────────────
const USERS = {
  ali_manager:  { id: '8448c4f8-f041-704b-5f65-17ef714694ab', name: 'Ali',        email: 'ali@mini-jira.com',                    role: 'manager',  teamId: null },
  omar:         { id: 'b4f8f408-4001-7065-84d1-52f5ea756b3b', name: 'Omar',       email: 'omar@mini-jira.com',                   role: 'employee', teamId: 'team-backend' },
  ali_ahmed:    { id: 'e4b814b8-e031-70b1-5545-64366fa76c9c', name: 'Ali Ahmed',  email: 'alioskiller8@gmail.com',               role: 'employee', teamId: 'team-backend' },
  osama:        { id: 'f4581438-1001-70d4-e540-6821f0768629', name: 'Osama',      email: 'osama.elayashy@student.giu-uni.de',    role: 'employee', teamId: 'team-frontend' },
  sara:         { id: 'f4d87408-b041-7041-671a-11f4a3318882', name: 'Sara',       email: 'sara@mini-jira.com',                   role: 'employee', teamId: 'team-frontend' },
};

// ── Teams ───────────────────────────────────────────────────────────────────
const teams = [
  {
    teamId: 'team-backend',
    name: 'Backend Team',
    description: 'Handles all server-side APIs, databases, and cloud infrastructure.',
    managerId: USERS.ali_manager.id,
    managerName: USERS.ali_manager.name,
    memberIds: [USERS.ali_ahmed.id, USERS.omar.id],
    createdAt: '2026-04-01T08:00:00.000Z',
  },
  {
    teamId: 'team-frontend',
    name: 'Frontend Team',
    description: 'Builds and maintains the Next.js web application and UI components.',
    managerId: USERS.ali_manager.id,
    managerName: USERS.ali_manager.name,
    memberIds: [USERS.osama.id, USERS.sara.id],
    createdAt: '2026-04-01T08:00:00.000Z',
  },
];

// ── Users table ─────────────────────────────────────────────────────────────
const users = Object.values(USERS).map(u => ({
  userId: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  teamId: u.teamId || 'unassigned',
  createdAt: '2026-04-01T08:00:00.000Z',
}));

// ── Projects ─────────────────────────────────────────────────────────────────
const projects = [
  {
    projectId: 'proj-001',
    name: 'Mini Jira Platform',
    description: 'Core task management platform including backend APIs, frontend UI, and AWS infrastructure.',
    teamId: 'team-backend',
    status: 'active',
    createdBy: USERS.ali_manager.id,
    createdAt: '2026-04-01T08:00:00.000Z',
    updatedAt: '2026-05-01T08:00:00.000Z',
  },
  {
    projectId: 'proj-002',
    name: 'Mobile App',
    description: 'React Native mobile application for iOS and Android.',
    teamId: 'team-frontend',
    status: 'active',
    createdBy: USERS.ali_manager.id,
    createdAt: '2026-04-15T08:00:00.000Z',
    updatedAt: '2026-05-05T08:00:00.000Z',
  },
  {
    projectId: 'proj-003',
    name: 'Analytics Dashboard',
    description: 'Real-time metrics and reporting dashboard for managers.',
    teamId: 'team-backend',
    status: 'planning',
    createdBy: USERS.ali_manager.id,
    createdAt: '2026-05-01T08:00:00.000Z',
    updatedAt: '2026-05-01T08:00:00.000Z',
  },
];

// ── Tasks ────────────────────────────────────────────────────────────────────
const tasks = [
  // Backend Team — proj-001
  {
    taskId: 'task-001',
    title: 'Set up DynamoDB tables and GSIs',
    description: 'Create all required DynamoDB tables with proper partition keys, sort keys, and global secondary indexes for team-based queries.',
    status: 'done',
    priority: 'high',
    deadline: '2026-04-10',
    assigneeId: USERS.ali_ahmed.id,
    assigneeName: USERS.ali_ahmed.name,
    teamId: 'team-backend',
    projectId: 'proj-001',
    createdBy: USERS.ali_manager.id,
    createdAt: '2026-04-02T09:00:00.000Z',
    updatedAt: '2026-04-09T16:00:00.000Z',
    imageKey: null, resizedImageKey: null, imageVersions: [],
    auditLog: [
      { action: 'STATUS_CHANGE', userId: USERS.ali_ahmed.id, userName: USERS.ali_ahmed.name, fromStatus: 'todo', toStatus: 'inprogress', timestamp: '2026-04-05T10:00:00.000Z' },
      { action: 'STATUS_CHANGE', userId: USERS.ali_ahmed.id, userName: USERS.ali_ahmed.name, fromStatus: 'inprogress', toStatus: 'done', timestamp: '2026-04-09T16:00:00.000Z' },
    ],
  },
  {
    taskId: 'task-002',
    title: 'Implement JWT authentication middleware',
    description: 'Build NestJS middleware to validate Cognito idTokens via JWKS endpoint. Must handle public routes and attach user context to requests.',
    status: 'done',
    priority: 'high',
    deadline: '2026-04-12',
    assigneeId: USERS.omar.id,
    assigneeName: USERS.omar.name,
    teamId: 'team-backend',
    projectId: 'proj-001',
    createdBy: USERS.ali_manager.id,
    createdAt: '2026-04-03T09:00:00.000Z',
    updatedAt: '2026-04-11T14:00:00.000Z',
    imageKey: null, resizedImageKey: null, imageVersions: [],
    auditLog: [
      { action: 'STATUS_CHANGE', userId: USERS.omar.id, userName: USERS.omar.name, fromStatus: 'todo', toStatus: 'done', timestamp: '2026-04-11T14:00:00.000Z' },
    ],
  },
  {
    taskId: 'task-003',
    title: 'Build S3 image upload with Lambda resize',
    description: 'Allow tasks to have image attachments. Upload originals to S3, trigger Lambda to resize to 300x300, serve from resized bucket via presigned URLs.',
    status: 'done',
    priority: 'medium',
    deadline: '2026-04-20',
    assigneeId: USERS.ali_ahmed.id,
    assigneeName: USERS.ali_ahmed.name,
    teamId: 'team-backend',
    projectId: 'proj-001',
    createdBy: USERS.ali_manager.id,
    createdAt: '2026-04-10T09:00:00.000Z',
    updatedAt: '2026-04-19T11:00:00.000Z',
    imageKey: null, resizedImageKey: null, imageVersions: [],
    auditLog: [
      { action: 'STATUS_CHANGE', userId: USERS.ali_ahmed.id, userName: USERS.ali_ahmed.name, fromStatus: 'inprogress', toStatus: 'done', timestamp: '2026-04-19T11:00:00.000Z' },
    ],
  },
  {
    taskId: 'task-004',
    title: 'Integrate SNS email notifications',
    description: 'Send formatted email notifications on task assignment and daily digest for tasks due today. Use MessageStructure json for per-protocol formatting.',
    status: 'done',
    priority: 'medium',
    deadline: '2026-04-25',
    assigneeId: USERS.omar.id,
    assigneeName: USERS.omar.name,
    teamId: 'team-backend',
    projectId: 'proj-001',
    createdBy: USERS.ali_manager.id,
    createdAt: '2026-04-15T09:00:00.000Z',
    updatedAt: '2026-04-24T15:00:00.000Z',
    imageKey: null, resizedImageKey: null, imageVersions: [],
    auditLog: [
      { action: 'STATUS_CHANGE', userId: USERS.omar.id, userName: USERS.omar.name, fromStatus: 'todo', toStatus: 'done', timestamp: '2026-04-24T15:00:00.000Z' },
    ],
  },
  {
    taskId: 'task-005',
    title: 'Set up CloudWatch dashboard',
    description: 'Create comprehensive CloudWatch dashboard with 38 widgets covering Lambda functions, DynamoDB, S3, SNS, SQS, and Cognito metrics.',
    status: 'inprogress',
    priority: 'low',
    deadline: '2026-05-20',
    assigneeId: USERS.ali_ahmed.id,
    assigneeName: USERS.ali_ahmed.name,
    teamId: 'team-backend',
    projectId: 'proj-001',
    createdBy: USERS.ali_manager.id,
    createdAt: '2026-05-01T09:00:00.000Z',
    updatedAt: '2026-05-10T09:00:00.000Z',
    imageKey: null, resizedImageKey: null, imageVersions: [],
    auditLog: [
      { action: 'STATUS_CHANGE', userId: USERS.ali_ahmed.id, userName: USERS.ali_ahmed.name, fromStatus: 'todo', toStatus: 'inprogress', timestamp: '2026-05-05T09:00:00.000Z' },
    ],
  },
  {
    taskId: 'task-006',
    title: 'Write unit tests for all services',
    description: 'Achieve 90%+ coverage across TasksService, CommentsService, AuthService, and Lambda handlers using Jest with mocked AWS SDK clients.',
    status: 'inprogress',
    priority: 'medium',
    deadline: '2026-05-18',
    assigneeId: USERS.omar.id,
    assigneeName: USERS.omar.name,
    teamId: 'team-backend',
    projectId: 'proj-001',
    createdBy: USERS.ali_manager.id,
    createdAt: '2026-05-02T09:00:00.000Z',
    updatedAt: '2026-05-10T09:00:00.000Z',
    imageKey: null, resizedImageKey: null, imageVersions: [],
    auditLog: [
      { action: 'STATUS_CHANGE', userId: USERS.omar.id, userName: USERS.omar.name, fromStatus: 'todo', toStatus: 'inprogress', timestamp: '2026-05-06T09:00:00.000Z' },
    ],
  },
  {
    taskId: 'task-007',
    title: 'Add rate limiting to API endpoints',
    description: 'Implement request throttling using NestJS ThrottlerModule to prevent abuse. Apply stricter limits on auth endpoints.',
    status: 'todo',
    priority: 'medium',
    deadline: '2026-05-25',
    assigneeId: USERS.ali_ahmed.id,
    assigneeName: USERS.ali_ahmed.name,
    teamId: 'team-backend',
    projectId: 'proj-001',
    createdBy: USERS.ali_manager.id,
    createdAt: '2026-05-08T09:00:00.000Z',
    updatedAt: '2026-05-08T09:00:00.000Z',
    imageKey: null, resizedImageKey: null, imageVersions: [],
    auditLog: [],
  },
  {
    taskId: 'task-008',
    title: 'Implement task search and filtering',
    description: 'Add API endpoints to search tasks by title, filter by status/priority/assignee, and sort by deadline or creation date.',
    status: 'todo',
    priority: 'low',
    deadline: '2026-06-01',
    assigneeId: USERS.omar.id,
    assigneeName: USERS.omar.name,
    teamId: 'team-backend',
    projectId: 'proj-001',
    createdBy: USERS.ali_manager.id,
    createdAt: '2026-05-09T09:00:00.000Z',
    updatedAt: '2026-05-09T09:00:00.000Z',
    imageKey: null, resizedImageKey: null, imageVersions: [],
    auditLog: [],
  },
  // Frontend Team — proj-002
  {
    taskId: 'task-009',
    title: 'Build Kanban board with drag-and-drop',
    description: 'Implement drag-and-drop Kanban board using @dnd-kit. Support moving tasks between todo, in-progress, review, and done columns with optimistic UI updates.',
    status: 'done',
    priority: 'high',
    deadline: '2026-04-18',
    assigneeId: USERS.osama.id,
    assigneeName: USERS.osama.name,
    teamId: 'team-frontend',
    projectId: 'proj-002',
    createdBy: USERS.ali_manager.id,
    createdAt: '2026-04-05T09:00:00.000Z',
    updatedAt: '2026-04-17T17:00:00.000Z',
    imageKey: null, resizedImageKey: null, imageVersions: [],
    auditLog: [
      { action: 'STATUS_CHANGE', userId: USERS.osama.id, userName: USERS.osama.name, fromStatus: 'inprogress', toStatus: 'done', timestamp: '2026-04-17T17:00:00.000Z' },
    ],
  },
  {
    taskId: 'task-010',
    title: 'Design landing page and auth screens',
    description: 'Create polished landing page with hero section, feature highlights, and smooth transitions. Build login and signup forms with validation.',
    status: 'done',
    priority: 'high',
    deadline: '2026-04-15',
    assigneeId: USERS.sara.id,
    assigneeName: USERS.sara.name,
    teamId: 'team-frontend',
    projectId: 'proj-002',
    createdBy: USERS.ali_manager.id,
    createdAt: '2026-04-04T09:00:00.000Z',
    updatedAt: '2026-04-14T12:00:00.000Z',
    imageKey: null, resizedImageKey: null, imageVersions: [],
    auditLog: [
      { action: 'STATUS_CHANGE', userId: USERS.sara.id, userName: USERS.sara.name, fromStatus: 'todo', toStatus: 'done', timestamp: '2026-04-14T12:00:00.000Z' },
    ],
  },
  {
    taskId: 'task-011',
    title: 'Implement cookie-based auth store',
    description: 'Replace localStorage auth with js-cookie. Handle SSR hydration mismatch using hydrate() pattern with AuthHydrator component.',
    status: 'done',
    priority: 'medium',
    deadline: '2026-04-22',
    assigneeId: USERS.osama.id,
    assigneeName: USERS.osama.name,
    teamId: 'team-frontend',
    projectId: 'proj-002',
    createdBy: USERS.ali_manager.id,
    createdAt: '2026-04-10T09:00:00.000Z',
    updatedAt: '2026-04-21T15:00:00.000Z',
    imageKey: null, resizedImageKey: null, imageVersions: [],
    auditLog: [
      { action: 'STATUS_CHANGE', userId: USERS.osama.id, userName: USERS.osama.name, fromStatus: 'inprogress', toStatus: 'done', timestamp: '2026-04-21T15:00:00.000Z' },
    ],
  },
  {
    taskId: 'task-012',
    title: 'Build task detail modal with comments',
    description: 'Full-featured task detail view with status updates, comment thread, image display, audit log timeline, and edit capabilities.',
    status: 'inprogress',
    priority: 'high',
    deadline: '2026-05-15',
    assigneeId: USERS.sara.id,
    assigneeName: USERS.sara.name,
    teamId: 'team-frontend',
    projectId: 'proj-002',
    createdBy: USERS.ali_manager.id,
    createdAt: '2026-05-01T09:00:00.000Z',
    updatedAt: '2026-05-10T09:00:00.000Z',
    imageKey: null, resizedImageKey: null, imageVersions: [],
    auditLog: [
      { action: 'STATUS_CHANGE', userId: USERS.sara.id, userName: USERS.sara.name, fromStatus: 'todo', toStatus: 'inprogress', timestamp: '2026-05-05T09:00:00.000Z' },
    ],
  },
  {
    taskId: 'task-013',
    title: 'Add dark/light theme toggle',
    description: 'Implement theme switching using next-themes. Persist preference in localStorage. Support system preference detection.',
    status: 'todo',
    priority: 'low',
    deadline: '2026-05-28',
    assigneeId: USERS.osama.id,
    assigneeName: USERS.osama.name,
    teamId: 'team-frontend',
    projectId: 'proj-002',
    createdBy: USERS.ali_manager.id,
    createdAt: '2026-05-07T09:00:00.000Z',
    updatedAt: '2026-05-07T09:00:00.000Z',
    imageKey: null, resizedImageKey: null, imageVersions: [],
    auditLog: [],
  },
  {
    taskId: 'task-014',
    title: 'Mobile responsiveness audit',
    description: 'Audit all pages for mobile breakpoints. Fix layout issues on screens < 768px. Priority: Kanban board, task cards, and navigation.',
    status: 'todo',
    priority: 'medium',
    deadline: '2026-05-22',
    assigneeId: USERS.sara.id,
    assigneeName: USERS.sara.name,
    teamId: 'team-frontend',
    projectId: 'proj-002',
    createdBy: USERS.ali_manager.id,
    createdAt: '2026-05-08T09:00:00.000Z',
    updatedAt: '2026-05-08T09:00:00.000Z',
    imageKey: null, resizedImageKey: null, imageVersions: [],
    auditLog: [],
  },
  // Analytics — proj-003
  {
    taskId: 'task-015',
    title: 'Design analytics data model',
    description: 'Define metrics schema for tracking task velocity, team performance, and deadline adherence. Plan DynamoDB access patterns.',
    status: 'inprogress',
    priority: 'medium',
    deadline: '2026-05-30',
    assigneeId: USERS.ali_ahmed.id,
    assigneeName: USERS.ali_ahmed.name,
    teamId: 'team-backend',
    projectId: 'proj-003',
    createdBy: USERS.ali_manager.id,
    createdAt: '2026-05-05T09:00:00.000Z',
    updatedAt: '2026-05-10T09:00:00.000Z',
    imageKey: null, resizedImageKey: null, imageVersions: [],
    auditLog: [
      { action: 'STATUS_CHANGE', userId: USERS.ali_ahmed.id, userName: USERS.ali_ahmed.name, fromStatus: 'todo', toStatus: 'inprogress', timestamp: '2026-05-08T09:00:00.000Z' },
    ],
  },
];

// ── Comments ─────────────────────────────────────────────────────────────────
const comments = [
  { commentId: 'cmt-001', taskId: 'task-001', content: 'GSI created successfully. teamId-index is live and returning correct results.', authorId: USERS.ali_ahmed.id, authorName: USERS.ali_ahmed.name, authorRole: 'employee', createdAt: '2026-04-08T10:00:00.000Z' },
  { commentId: 'cmt-002', taskId: 'task-001', content: 'Verified the query performance. P99 latency under 5ms with GSI. Good to close.', authorId: USERS.ali_manager.id, authorName: USERS.ali_manager.name, authorRole: 'manager', createdAt: '2026-04-09T14:00:00.000Z' },
  { commentId: 'cmt-003', taskId: 'task-002', content: 'Had to test both req.path and req.originalUrl for public route matching — NestJS strips the prefix from req.path.', authorId: USERS.omar.id, authorName: USERS.omar.name, authorRole: 'employee', createdAt: '2026-04-09T11:00:00.000Z' },
  { commentId: 'cmt-004', taskId: 'task-002', content: 'Also make sure the token used is idToken not accessToken. accessToken does not carry custom attributes from Cognito.', authorId: USERS.ali_manager.id, authorName: USERS.ali_manager.name, authorRole: 'manager', createdAt: '2026-04-10T09:00:00.000Z' },
  { commentId: 'cmt-005', taskId: 'task-003', content: 'sharp must be installed with --os=linux --cpu=x64 before packaging for Lambda. darwin-arm64 binary will not work in the Lambda runtime.', authorId: USERS.ali_ahmed.id, authorName: USERS.ali_ahmed.name, authorRole: 'employee', createdAt: '2026-04-18T13:00:00.000Z' },
  { commentId: 'cmt-006', taskId: 'task-003', content: 'Using HeadObjectCommand before generating presigned URLs is the right approach. Avoids 403s on missing objects.', authorId: USERS.omar.id, authorName: USERS.omar.name, authorRole: 'employee', createdAt: '2026-04-19T10:00:00.000Z' },
  { commentId: 'cmt-007', taskId: 'task-005', content: 'Dashboard JSON must be saved to a file and referenced with file:// — inline shell JSON breaks on quote escaping.', authorId: USERS.ali_ahmed.id, authorName: USERS.ali_ahmed.name, authorRole: 'employee', createdAt: '2026-05-08T15:00:00.000Z' },
  { commentId: 'cmt-008', taskId: 'task-006', content: 'uuid module is ESM-only. Need moduleNameMapper in jest config pointing to uuid/dist/index.js (CJS build).', authorId: USERS.omar.id, authorName: USERS.omar.name, authorRole: 'employee', createdAt: '2026-05-07T14:00:00.000Z' },
  { commentId: 'cmt-009', taskId: 'task-009', content: 'dnd-kit works great for the Kanban columns. Using useSortable + DndContext with onDragEnd to call the status update API.', authorId: USERS.osama.id, authorName: USERS.osama.name, authorRole: 'employee', createdAt: '2026-04-15T16:00:00.000Z' },
  { commentId: 'cmt-010', taskId: 'task-011', content: 'Zustand persist caused hydration mismatch on SSR. Switched to js-cookie with manual hydrate() called in AuthHydrator after mount.', authorId: USERS.osama.id, authorName: USERS.osama.name, authorRole: 'employee', createdAt: '2026-04-20T11:00:00.000Z' },
  { commentId: 'cmt-011', taskId: 'task-012', content: 'Working on the comment thread UI. Should we show audit log entries inline or in a separate tab?', authorId: USERS.sara.id, authorName: USERS.sara.name, authorRole: 'employee', createdAt: '2026-05-06T10:00:00.000Z' },
  { commentId: 'cmt-012', taskId: 'task-012', content: 'Keep them inline but use a timeline component. Alternate comment bubbles with audit entries using different styling.', authorId: USERS.ali_manager.id, authorName: USERS.ali_manager.name, authorRole: 'manager', createdAt: '2026-05-06T11:30:00.000Z' },
  { commentId: 'cmt-013', taskId: 'task-015', content: 'Proposing to store pre-aggregated daily snapshots in DynamoDB rather than computing on the fly. Faster reads for the dashboard.', authorId: USERS.ali_ahmed.id, authorName: USERS.ali_ahmed.name, authorRole: 'employee', createdAt: '2026-05-09T10:00:00.000Z' },
  { commentId: 'cmt-014', taskId: 'task-007', content: 'Should we use @nestjs/throttler or a custom Redis-based solution? Redis gives us distributed rate limiting across instances.', authorId: USERS.omar.id, authorName: USERS.omar.name, authorRole: 'employee', createdAt: '2026-05-09T13:00:00.000Z' },
  { commentId: 'cmt-015', taskId: 'task-007', content: 'Start with @nestjs/throttler for now — we are single instance. Add Redis later if we scale horizontally.', authorId: USERS.ali_manager.id, authorName: USERS.ali_manager.name, authorRole: 'manager', createdAt: '2026-05-09T14:00:00.000Z' },
];

// ── Activity Log ──────────────────────────────────────────────────────────────
const activityLog = [
  { logId: 'log-001', type: 'TASK_ASSIGNED', taskId: 'task-001', taskTitle: 'Set up DynamoDB tables and GSIs', assigneeId: USERS.ali_ahmed.id, teamId: 'team-backend', timestamp: '2026-04-02T09:01:00.000Z' },
  { logId: 'log-002', type: 'TASK_ASSIGNED', taskId: 'task-002', taskTitle: 'Implement JWT authentication middleware', assigneeId: USERS.omar.id, teamId: 'team-backend', timestamp: '2026-04-03T09:01:00.000Z' },
  { logId: 'log-003', type: 'TASK_ASSIGNED', taskId: 'task-003', taskTitle: 'Build S3 image upload with Lambda resize', assigneeId: USERS.ali_ahmed.id, teamId: 'team-backend', timestamp: '2026-04-10T09:01:00.000Z' },
  { logId: 'log-004', type: 'TASK_ASSIGNED', taskId: 'task-004', taskTitle: 'Integrate SNS email notifications', assigneeId: USERS.omar.id, teamId: 'team-backend', timestamp: '2026-04-15T09:01:00.000Z' },
  { logId: 'log-005', type: 'TASK_ASSIGNED', taskId: 'task-009', taskTitle: 'Build Kanban board with drag-and-drop', assigneeId: USERS.osama.id, teamId: 'team-frontend', timestamp: '2026-04-05T09:01:00.000Z' },
  { logId: 'log-006', type: 'TASK_ASSIGNED', taskId: 'task-010', taskTitle: 'Design landing page and auth screens', assigneeId: USERS.sara.id, teamId: 'team-frontend', timestamp: '2026-04-04T09:01:00.000Z' },
  { logId: 'log-007', type: 'TASK_ASSIGNED', taskId: 'task-011', taskTitle: 'Implement cookie-based auth store', assigneeId: USERS.osama.id, teamId: 'team-frontend', timestamp: '2026-04-10T09:01:00.000Z' },
  { logId: 'log-008', type: 'TASK_ASSIGNED', taskId: 'task-005', taskTitle: 'Set up CloudWatch dashboard', assigneeId: USERS.ali_ahmed.id, teamId: 'team-backend', timestamp: '2026-05-01T09:01:00.000Z' },
  { logId: 'log-009', type: 'TASK_ASSIGNED', taskId: 'task-012', taskTitle: 'Build task detail modal with comments', assigneeId: USERS.sara.id, teamId: 'team-frontend', timestamp: '2026-05-01T09:01:00.000Z' },
  { logId: 'log-010', type: 'TASK_ASSIGNED', taskId: 'task-015', taskTitle: 'Design analytics data model', assigneeId: USERS.ali_ahmed.id, teamId: 'team-backend', timestamp: '2026-05-05T09:01:00.000Z' },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
async function putItem(TableName, Item) {
  await db.send(new PutCommand({ TableName, Item }));
}

async function seedTable(name, items, tableName) {
  console.log(`\nSeeding ${name} (${items.length} items)...`);
  for (const item of items) {
    await putItem(tableName, item);
    process.stdout.write('.');
  }
  console.log(` ✓`);
}

// ── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  try {
    await seedTable('Teams',       teams,       'Teams');
    await seedTable('Users',       users,       'Users');
    await seedTable('Projects',    projects,    'Projects');
    await seedTable('Tasks',       tasks,       'Tasks');
    await seedTable('Comments',    comments,    'Comments');
    await seedTable('ActivityLog', activityLog, 'ActivityLog');

    console.log('\n✅ Seed complete!');
    console.log(`   Teams: ${teams.length} | Users: ${users.length} | Projects: ${projects.length}`);
    console.log(`   Tasks: ${tasks.length} | Comments: ${comments.length} | Activity: ${activityLog.length}`);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
})();
