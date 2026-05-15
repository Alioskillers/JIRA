import { Injectable, NestMiddleware, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';

export interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
    teamId: string;
    name?: string;
  };
}

const PUBLIC_ROUTES = [
  { method: 'GET',  path: /\/api\/health$/ },
  { method: 'POST', path: /\/api\/auth\/login$/ },
  { method: 'POST', path: /\/api\/auth\/refresh$/ },
  { method: 'POST', path: /\/api\/auth\/register$/ },
  { method: 'POST', path: /\/api\/auth\/confirm$/ },
  { method: 'POST', path: /\/api\/auth\/resend-code$/ },
];

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  private readonly logger = new Logger('JwtMiddleware');
  private jwksClient: jwksRsa.JwksClient;

  constructor(private configService: ConfigService) {
    this.jwksClient = jwksRsa({
      jwksUri: this.configService.get<string>('COGNITO_JWKS_URI')!,
      cache: true,
      rateLimit: true,
    });
  }

  async use(req: Request, _res: Response, next: NextFunction) {
    const { method, path: reqPath, originalUrl } = req;

    const isPublic = PUBLIC_ROUTES.some(
      r => r.method === method && (r.path.test(reqPath) || r.path.test(originalUrl)),
    );

    this.logger.debug(`${method} ${originalUrl} | path=${reqPath} | public=${isPublic}`);

    if (isPublic) return next();

    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      this.logger.warn(`Blocked unauthenticated request: ${method} ${originalUrl}`);
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = await this.verifyToken(token);

      this.logger.debug(
        `Token claims — sub=${decoded['sub']} | email=${decoded['email']} | custom:role=${decoded['custom:role']} | custom:teamId=${decoded['custom:teamId']}`,
      );

      (req as AuthenticatedRequest).user = {
        userId: decoded['sub'] as string,
        email: decoded['email'] as string,
        role: (decoded['custom:role'] as string) || 'employee',
        teamId: (decoded['custom:teamId'] as string) || 'unassigned',
        name: (decoded['name'] as string) || (decoded['email'] as string),
      };
      next();
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private verifyToken(token: string): Promise<jwt.JwtPayload> {
    return new Promise((resolve, reject) => {
      const getKey = (header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) => {
        this.jwksClient.getSigningKey(header.kid!, (err, key) => {
          if (err) return callback(err);
          callback(null, key!.getPublicKey());
        });
      };
      jwt.verify(token, getKey, { algorithms: ['RS256'] }, (err, decoded) => {
        if (err) return reject(err);
        resolve(decoded as jwt.JwtPayload);
      });
    });
  }
}
