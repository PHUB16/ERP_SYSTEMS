import { Request, Response, NextFunction } from 'express';
import { db, DbUser } from './db.js';

export interface AuthenticatedRequest extends Request {
  user?: DbUser;
}

export function extractBearerToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  // Also check query param ?token= for SSE EventSource connections
  if (typeof req.query.token === 'string') {
    return req.query.token;
  }
  return undefined;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = extractBearerToken(req);
  if (!token) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required. Missing Bearer token.' },
    });
  }

  const session = db.getSession(token);
  if (!session) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_SESSION', message: 'Session token is invalid or expired.' },
    });
  }

  const user = db.getUserById(session.userId);
  if (!user) {
    return res.status(401).json({
      success: false,
      error: { code: 'USER_NOT_FOUND', message: 'User associated with session not found.' },
    });
  }

  req.user = user;
  next();
}

export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const token = extractBearerToken(req);
  if (token) {
    const session = db.getSession(token);
    if (session) {
      req.user = db.getUserById(session.userId);
    }
  }
  next();
}

export function requireRole(allowedRoles: Array<'ADMIN' | 'LEAD' | 'MEMBER'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Action requires one of the following roles: ${allowedRoles.join(', ')}`,
        },
      });
    }

    next();
  };
}
