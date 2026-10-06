import { Router, Response } from 'express';
import { db, dbEmitter, hashPassword, DbUser } from './db.js';
import { requireAuth, optionalAuth, AuthenticatedRequest } from './auth.js';

export const apiRouter = Router();

// Track active real-time SSE clients
const activeClients = new Set<{ id: string; res: Response; userId?: string }>();

// Broadcast helper for SSE
dbEmitter.on('mutation', (eventData: { type: string; payload: any; timestamp: string }) => {
  const payloadString = JSON.stringify(eventData);
  for (const client of activeClients) {
    try {
      client.res.write(`event: ${eventData.type}\n`);
      client.res.write(`data: ${payloadString}\n\n`);
    } catch (err) {
      console.warn('[SSE] Failed writing to client:', err);
    }
  }
});

// --- Health Check ---
apiRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    connectedClients: activeClients.size,
  });
});

// --- Authentication Endpoints ---

// Register
apiRouter.post('/auth/register', (req, res) => {
  const { email, password, fullName, role } = req.body;

  if (!email || !password || !fullName) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'Email, password, and fullName are required.' },
    });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(409).json({
      success: false,
      error: { code: 'USER_EXISTS', message: 'An account with this email already exists.' },
    });
  }

  const user = db.createUser({
    email,
    passwordHash: hashPassword(password),
    fullName,
    role: role || 'MEMBER',
  });

  const session = db.createSession(user.id);

  const { passwordHash, ...safeUser } = user;
  res.status(201).json({
    success: true,
    data: {
      token: session.token,
      user: safeUser,
    },
  });
});

// Login
apiRouter.post('/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'Email and password are required.' },
    });
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
    });
  }

  const computedHash = hashPassword(password);
  if (user.passwordHash !== computedHash) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
    });
  }

  const session = db.createSession(user.id);
  const { passwordHash, ...safeUser } = user;

  res.json({
    success: true,
    data: {
      token: session.token,
      user: safeUser,
    },
  });
});

// Quick Demo Login
apiRouter.post('/auth/demo', (req, res) => {
  const { role } = req.body;
  const users = db.getUsers();

  let targetUser: DbUser | undefined;
  if (role) {
    targetUser = users.find((u) => u.role === role);
  }
  if (!targetUser) {
    targetUser = users[0];
  }

  const session = db.createSession(targetUser.id);
  res.json({
    success: true,
    data: {
      token: session.token,
      user: targetUser,
    },
  });
});

// Current User Me
apiRouter.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
  const { passwordHash, ...safeUser } = req.user!;
  res.json({
    success: true,
    data: safeUser,
  });
});

// Logout
apiRouter.post('/auth/logout', requireAuth, (req: AuthenticatedRequest, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '').trim();
  if (token) {
    db.deleteSession(token);
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

// --- Team Users ---
apiRouter.get('/users', (_req, res) => {
  res.json({
    success: true,
    data: db.getUsers(),
  });
});

// --- Tasks Endpoints ---

// List Tasks with filters
apiRouter.get('/tasks', (req, res) => {
  const { status, priority, assigneeId, search, tag } = req.query;
  const tasks = db.getTasks({
    status: status as string,
    priority: priority as string,
    assigneeId: assigneeId as string,
    search: search as string,
    tag: tag as string,
  });

  res.json({
    success: true,
    data: tasks,
  });
});

// Get Single Task
apiRouter.get('/tasks/:id', (req, res) => {
  const task = db.getTaskById(req.params.id);
  if (!task) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Task not found.' },
    });
  }

  res.json({
    success: true,
    data: task,
  });
});

// Create Task
apiRouter.post('/tasks', requireAuth, (req: AuthenticatedRequest, res) => {
  const { title, description, status, priority, assigneeId, dueDate, estimatedHours, tags } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'Task title is required.' },
    });
  }

  const newTask = db.createTask({
    title: title.trim(),
    description,
    status,
    priority,
    assigneeId,
    dueDate,
    estimatedHours: Number(estimatedHours) || 0,
    tags: Array.isArray(tags) ? tags : [],
    reporter: req.user!,
  });

  res.status(201).json({
    success: true,
    data: newTask,
  });
});

// Update Task
apiRouter.patch('/tasks/:id', optionalAuth, (req: AuthenticatedRequest, res) => {
  const { title, description, status, priority, assigneeId, dueDate, estimatedHours, spentHours, tags } = req.body;

  const updates: any = {};
  if (title !== undefined) updates.title = title.trim();
  if (description !== undefined) updates.description = description;
  if (status !== undefined) updates.status = status;
  if (priority !== undefined) updates.priority = priority;
  if (assigneeId !== undefined) updates.assigneeId = assigneeId;
  if (dueDate !== undefined) updates.dueDate = dueDate;
  if (estimatedHours !== undefined) updates.estimatedHours = Number(estimatedHours);
  if (spentHours !== undefined) updates.spentHours = Number(spentHours);
  if (tags !== undefined) updates.tags = tags;

  const updatedTask = db.updateTask(req.params.id, updates, req.user);
  if (!updatedTask) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Task not found.' },
    });
  }

  res.json({
    success: true,
    data: updatedTask,
  });
});

// Delete Task
apiRouter.delete('/tasks/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const deleted = db.deleteTask(req.params.id);
  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Task not found.' },
    });
  }

  res.json({
    success: true,
    data: { id: req.params.id },
  });
});

// --- Comments ---
apiRouter.get('/tasks/:id/comments', (req, res) => {
  const comments = db.getComments(req.params.id);
  res.json({
    success: true,
    data: comments,
  });
});

apiRouter.post('/tasks/:id/comments', requireAuth, (req: AuthenticatedRequest, res) => {
  const { content } = req.body;
  if (!content || content.trim() === '') {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'Comment content cannot be empty.' },
    });
  }

  const comment = db.addComment(req.params.id, content.trim(), req.user!);
  if (!comment) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Task not found.' },
    });
  }

  res.status(201).json({
    success: true,
    data: comment,
  });
});

// --- Subtasks ---
apiRouter.post('/tasks/:id/subtasks', optionalAuth, (req: AuthenticatedRequest, res) => {
  const { title } = req.body;
  if (!title || title.trim() === '') {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'Subtask title is required.' },
    });
  }

  const subtask = db.addSubtask(req.params.id, title.trim(), req.user);
  if (!subtask) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Task not found.' },
    });
  }

  res.status(201).json({
    success: true,
    data: subtask,
  });
});

apiRouter.patch('/tasks/:id/subtasks/:subtaskId', optionalAuth, (req: AuthenticatedRequest, res) => {
  const subtask = db.toggleSubtask(req.params.id, req.params.subtaskId, req.user);
  if (!subtask) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Subtask or task not found.' },
    });
  }

  res.json({
    success: true,
    data: subtask,
  });
});

apiRouter.delete('/tasks/:id/subtasks/:subtaskId', (_req, res) => {
  const deleted = db.deleteSubtask(_req.params.id, _req.params.subtaskId);
  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Subtask or task not found.' },
    });
  }

  res.json({
    success: true,
    data: { id: _req.params.subtaskId },
  });
});

// --- Time Logging ---
apiRouter.post('/tasks/:id/time-log', optionalAuth, (req, res) => {
  const { hours } = req.body;
  const numHours = parseFloat(hours);
  if (isNaN(numHours) || numHours <= 0) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'Valid hours number greater than 0 required.' },
    });
  }

  const task = db.getTaskById(req.params.id);
  if (!task) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Task not found.' },
    });
  }

  const updatedTask = db.updateTask(
    req.params.id,
    { spentHours: (task.spentHours || 0) + numHours },
    (req as AuthenticatedRequest).user
  );

  res.json({
    success: true,
    data: updatedTask,
  });
});

// --- Analytics ---
apiRouter.get('/analytics', (_req, res) => {
  const analytics = db.getAnalytics();
  res.json({
    success: true,
    data: analytics,
  });
});

// --- Real-Time Stream (Server-Sent Events) ---
apiRouter.get('/realtime/stream', (req, res) => {
  // Setup SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering on reverse proxies like Nginx/Cloud Run
  res.flushHeaders?.();

  const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const token = typeof req.query.token === 'string' ? req.query.token : undefined;
  let userId: string | undefined;

  if (token) {
    const session = db.getSession(token);
    if (session) userId = session.userId;
  }

  const clientRecord = { id: clientId, res, userId };
  activeClients.add(clientRecord);

  // Send initial handshake
  res.write(`event: system:connected\n`);
  res.write(
    `data: ${JSON.stringify({
      status: 'CONNECTED',
      clientId,
      activeSubscribers: activeClients.size,
      timestamp: new Date().toISOString(),
    })}\n\n`
  );

  // Send 15-second ping heartbeat to keep connection alive
  const pingInterval = setInterval(() => {
    try {
      res.write(`event: system:ping\n`);
      res.write(`data: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`);
    } catch {
      clearInterval(pingInterval);
      activeClients.delete(clientRecord);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(pingInterval);
    activeClients.delete(clientRecord);
  });
});
