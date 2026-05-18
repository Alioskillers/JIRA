import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from '../../src/auth/auth.service';
import { mockAwsService, mockConfigService, mockDynamoDb, mockCognito } from '../mocks/aws.mock';

jest.mock('jsonwebtoken', () => ({
  decode: jest.fn(() => ({
    sub: 'user-001',
    email: 'ali@mini-jira.com',
    name: 'Ali',
    'custom:role': 'manager',
    'custom:teamId': 'unassigned',
  })),
}));

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(mockAwsService as any, mockConfigService as any);
  });

  describe('register', () => {
    it('registers user with employee role by default', async () => {
      mockCognito.send.mockResolvedValueOnce({}).mockResolvedValueOnce({});
      mockDynamoDb.send.mockResolvedValueOnce({});

      const result = await service.register('Test', 'test@example.com', 'Pass123!');

      expect(result.email).toBe('test@example.com');
      expect(result.message).toContain('sign in');
      const signUpAttrs = mockCognito.send.mock.calls[0][0].input.UserAttributes;
      expect(signUpAttrs.find((a: any) => a.Name === 'custom:role')?.Value).toBe('employee');
      expect(signUpAttrs.find((a: any) => a.Name === 'custom:teamId')?.Value).toBe('unassigned');
    });

    it('writes employee record to DynamoDB with teamId=unassigned', async () => {
      mockCognito.send.mockResolvedValueOnce({}).mockResolvedValueOnce({});
      mockDynamoDb.send.mockResolvedValueOnce({});

      await service.register('New', 'new@example.com', 'Pass123!');

      const item = mockDynamoDb.send.mock.calls[0][0].input.Item;
      expect(item.role).toBe('employee');
      expect(item.teamId).toBe('unassigned');
      expect(item.email).toBe('new@example.com');
    });

    it('throws BadRequestException when email already exists', async () => {
      const err = Object.assign(new Error('User exists'), { name: 'UsernameExistsException' });
      mockCognito.send.mockRejectedValueOnce(err);

      await expect(service.register('Ali', 'ali@mini-jira.com', 'Pass123!'))
        .rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException for invalid password policy', async () => {
      const err = Object.assign(new Error('Weak password'), { name: 'InvalidPasswordException' });
      mockCognito.send.mockRejectedValueOnce(err);

      await expect(service.register('Ali', 'ali@example.com', 'weak'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    it('returns tokens and decoded user profile on success', async () => {
      mockCognito.send.mockResolvedValueOnce({
        AuthenticationResult: {
          AccessToken: 'access-tok',
          RefreshToken: 'refresh-tok',
          IdToken: 'id-tok',
        },
      });

      const result = await service.login('ali@mini-jira.com', 'Pass123!');

      expect(result.accessToken).toBe('access-tok');
      expect(result.user.role).toBe('manager');
      expect(result.user.email).toBe('ali@mini-jira.com');
    });

    it('throws UnauthorizedException for wrong password', async () => {
      const err = Object.assign(new Error('Incorrect'), { name: 'NotAuthorizedException' });
      mockCognito.send.mockRejectedValueOnce(err);

      await expect(service.login('ali@mini-jira.com', 'wrong')).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for non-existent user', async () => {
      const err = Object.assign(new Error('No user'), { name: 'UserNotFoundException' });
      mockCognito.send.mockRejectedValueOnce(err);

      await expect(service.login('ghost@x.com', 'Pass123!')).rejects.toThrow(UnauthorizedException);
    });

    it('throws with email confirmation message for unconfirmed users', async () => {
      const err = Object.assign(new Error('Not confirmed'), { name: 'UserNotConfirmedException' });
      mockCognito.send.mockRejectedValueOnce(err);

      await expect(service.login('unconf@x.com', 'Pass123!'))
        .rejects.toThrow(/confirm your email/i);
    });

    it('throws UnauthorizedException when NEW_PASSWORD_REQUIRED challenge returned', async () => {
      mockCognito.send.mockResolvedValueOnce({ ChallengeName: 'NEW_PASSWORD_REQUIRED' });

      await expect(service.login('ali@mini-jira.com', 'TempPass1!')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('returns new access and id tokens', async () => {
      mockCognito.send.mockResolvedValueOnce({
        AuthenticationResult: { AccessToken: 'new-access', IdToken: 'new-id' },
      });

      const result = await service.refresh('valid-refresh');

      expect(result.accessToken).toBe('new-access');
    });

    it('throws UnauthorizedException for expired refresh token', async () => {
      const err = Object.assign(new Error('Revoked'), { name: 'NotAuthorizedException' });
      mockCognito.send.mockRejectedValueOnce(err);

      await expect(service.refresh('expired')).rejects.toThrow(UnauthorizedException);
    });
  });
});
