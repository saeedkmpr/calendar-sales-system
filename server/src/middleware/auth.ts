import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AuthUser, UserRole } from '../types';

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null;

  if (!token) {
    res.status(401).json({ error: 'ലോഗിൻ ചെയ്തിട്ടില്ല. ദയവായി ലോഗിൻ ചെയ്യുക (Unauthorized)' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AuthUser;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: 'ലോഗിൻ സെഷൻ കാലഹരണപ്പെട്ടു (Invalid or expired token)' });
  }
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'ലോഗിൻ ചെയ്തിട്ടില്ല (Unauthorized)' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'ഈ പ്രവർത്തനം ചെയ്യാൻ നിങ്ങൾക്ക് അനുമതിയില്ല (Forbidden: Insufficient permissions)',
      });
      return;
    }

    next();
  };
}
