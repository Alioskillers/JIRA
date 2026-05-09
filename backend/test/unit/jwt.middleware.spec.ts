import { JwtMiddleware } from '../../src/common/middleware/jwt.middleware';
import { UnauthorizedException } from '@nestjs/common';
import { mockConfigService } from '../mocks/aws.mock';

const mockVerifyToken = jest.fn();

jest.mock('jwks-rsa', () => {
  return jest.fn(() => ({
    getSigningKey: jest.fn((kid: string, cb: Function) => {
      cb(null, { getPublicKey: () => 'mock-public-key' });
    }),
  }));
});

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn((token, getKey, opts, cb) => {
    if (token === 'valid-manager-token') {
      cb(null, {
        sub: 'manager-001',
        email: 'ali@mini-jira.com',
        name: 'Ali',
        'custom:role': 'manager',
        'custom:teamId': 'unassigned',
      });
    } else if (token === 'valid-employee-token') {
      cb(null, {
        sub: 'employee-001',
        email: 'sara@mini-jira.com',
        name: 'Sara',
        'custom:role': 'employee',
        'custom:teamId': 'team-frontend-001',
      });
    } else {
      cb(new Error('invalid signature'));
    }
  }),
}));

describe('JwtMiddleware', () => {
  let middleware: JwtMiddleware;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    middleware = new JwtMiddleware(mockConfigService as any);
    mockNext = jest.fn();
  });

  const makeReq = (path: string, method: string, token?: string) => ({
    method,
    path,
    originalUrl: path,
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });

  // ─── PUBLIC ROUTES (no token required) ───────────────────────────────────

  describe('public route bypass', () => {
    const publicRoutes = [
      { method: 'GET', path: '/api/health' },
      { method: 'POST', path: '/api/auth/login' },
      { method: 'POST', path: '/api/auth/refresh' },
      { method: 'POST', path: '/api/auth/register' },
      { method: 'POST', path: '/api/auth/confirm' },
      { method: 'POST', path: '/api/auth/resend-code' },
    ];

    it.each(publicRoutes)('$method $path bypasses JWT check', async ({ method, path }) => {
      const req = makeReq(path, method); // no token
      await middleware.use(req as any, {} as any, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  // ─── PROTECTED ROUTES ────────────────────────────────────────────────────

  describe('protected route enforcement', () => {
    it('passes valid manager token and attaches user with role=manager', async () => {
      const req = makeReq('/api/tasks', 'GET', 'valid-manager-token') as any;
      await middleware.use(req, {} as any, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(req.user.role).toBe('manager');
      expect(req.user.userId).toBe('manager-001');
    });

    it('passes valid employee token and attaches user with role=employee and teamId', async () => {
      const req = makeReq('/api/tasks', 'GET', 'valid-employee-token') as any;
      await middleware.use(req, {} as any, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(req.user.role).toBe('employee');
      expect(req.user.teamId).toBe('team-frontend-001');
    });

    it('throws UnauthorizedException when Authorization header is missing', async () => {
      const req = makeReq('/api/tasks', 'GET'); // no token

      await expect(middleware.use(req as any, {} as any, mockNext))
        .rejects.toThrow(UnauthorizedException);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException for invalid/tampered token', async () => {
      const req = makeReq('/api/tasks', 'GET', 'tampered-token');

      await expect(middleware.use(req as any, {} as any, mockNext))
        .rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for malformed Authorization header (no Bearer prefix)', async () => {
      const req = {
        method: 'GET',
        path: '/api/tasks',
        originalUrl: '/api/tasks',
        headers: { authorization: 'Basic dXNlcjpwYXNz' },
      };

      await expect(middleware.use(req as any, {} as any, mockNext))
        .rejects.toThrow(UnauthorizedException);
    });

    it('defaults missing custom:role to employee', async () => {
      const jwt = require('jsonwebtoken');
      jwt.verify.mockImplementationOnce((_token: any, _getKey: any, _opts: any, cb: Function) => {
        cb(null, { sub: 'u1', email: 'x@x.com' }); // no custom:role
      });
      const req = makeReq('/api/tasks', 'GET', 'any-token') as any;
      await middleware.use(req, {} as any, mockNext);
      expect(req.user.role).toBe('employee');
    });

    it('defaults missing custom:teamId to unassigned', async () => {
      const jwt = require('jsonwebtoken');
      jwt.verify.mockImplementationOnce((_token: any, _getKey: any, _opts: any, cb: Function) => {
        cb(null, { sub: 'u1', email: 'x@x.com', 'custom:role': 'employee' });
      });
      const req = makeReq('/api/tasks', 'GET', 'any-token') as any;
      await middleware.use(req, {} as any, mockNext);
      expect(req.user.teamId).toBe('unassigned');
    });
  });
});
