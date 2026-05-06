import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  InitiateAuthCommand,
  AuthFlowType,
  SignUpCommand,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
  AdminConfirmSignUpCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import * as jwt from 'jsonwebtoken';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { AwsService } from '../aws/aws.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private awsService: AwsService,
    private configService: ConfigService,
  ) {}

  private get clientId() {
    return this.configService.get<string>('COGNITO_CLIENT_ID')!;
  }

  private get usersTable() {
    return this.configService.get<string>('DYNAMODB_TABLE_USERS')!;
  }

  async register(name: string, email: string, password: string) {
    try {
      const userId = uuidv4();

      await this.awsService.cognito.send(new SignUpCommand({
        ClientId: this.clientId,
        Username: email,
        Password: password,
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'name', Value: name },
          { Name: 'custom:role', Value: 'employee' },
          { Name: 'custom:teamId', Value: 'unassigned' },
        ],
      }));

      // Auto-confirm the user via admin API so they can log in immediately.
      // If the user pool has email verification enabled, this is skipped
      // and the user confirms via the code sent to their email instead.
      try {
        await this.awsService.cognito.send(new AdminConfirmSignUpCommand({
          UserPoolId: this.configService.get<string>('COGNITO_USER_POOL_ID')!,
          Username: email,
        }));
        this.logger.log(`Auto-confirmed user: ${email}`);
      } catch (confirmErr: any) {
        // If auto-confirm fails (e.g. pool requires email verification),
        // the user will receive a code by email and confirm manually.
        this.logger.warn(`Auto-confirm skipped for ${email}: ${confirmErr?.message}`);
      }

      await this.awsService.dynamoDb.send(new PutCommand({
        TableName: this.usersTable,
        Item: {
          userId,
          email,
          name,
          role: 'employee',
          teamId: 'unassigned',
          createdAt: new Date().toISOString(),
        },
      }));

      return {
        message: 'Registration successful. You can now sign in.',
        email,
      };
    } catch (err: any) {
      this.logger.error(`Registration failed for ${email}: ${err?.name} — ${err?.message}`);
      if (err?.name === 'UsernameExistsException') {
        throw new BadRequestException('An account with this email already exists');
      }
      if (err?.name === 'InvalidPasswordException') {
        throw new BadRequestException(err.message);
      }
      throw new BadRequestException('Registration failed. Please try again.');
    }
  }

  async confirmEmail(email: string, code: string) {
    try {
      await this.awsService.cognito.send(new ConfirmSignUpCommand({
        ClientId: this.clientId,
        Username: email,
        ConfirmationCode: code,
      }));
      return { message: 'Email confirmed successfully. You can now sign in.' };
    } catch (err: any) {
      this.logger.error(`Confirmation failed for ${email}: ${err?.name} — ${err?.message}`);
      if (err?.name === 'CodeMismatchException') throw new BadRequestException('Invalid confirmation code');
      if (err?.name === 'ExpiredCodeException') throw new BadRequestException('Confirmation code has expired');
      throw new BadRequestException('Confirmation failed. Please try again.');
    }
  }

  async resendConfirmation(email: string) {
    try {
      await this.awsService.cognito.send(new ResendConfirmationCodeCommand({
        ClientId: this.clientId,
        Username: email,
      }));
      return { message: 'Confirmation code resent. Please check your email.' };
    } catch (err: any) {
      this.logger.error(`Resend failed for ${email}: ${err?.name} — ${err?.message}`);
      throw new BadRequestException('Could not resend confirmation code');
    }
  }

  async login(email: string, password: string) {
    try {
      const command = new InitiateAuthCommand({
        AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
        ClientId: this.clientId,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      });

      const response = await this.awsService.cognito.send(command);

      if (response.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
        throw new UnauthorizedException(
          'You must set a new password. Please contact your administrator.',
        );
      }

      if (response.ChallengeName) {
        throw new UnauthorizedException(`Authentication challenge required: ${response.ChallengeName}`);
      }

      const authResult = response.AuthenticationResult!;
      const decoded = jwt.decode(authResult.IdToken!) as jwt.JwtPayload;

      return {
        accessToken: authResult.AccessToken,
        refreshToken: authResult.RefreshToken,
        idToken: authResult.IdToken,
        user: {
          userId: decoded['sub'],
          email: decoded['email'],
          role: decoded['custom:role'] ?? 'employee',
          teamId: decoded['custom:teamId'] ?? '',
          name: decoded['name'] ?? email.split('@')[0],
        },
      };
    } catch (err: any) {
      this.logger.error(`Login failed for ${email}: ${err?.name} — ${err?.message}`);
      if (err instanceof UnauthorizedException) throw err;
      if (err?.name === 'UserNotConfirmedException') {
        throw new UnauthorizedException('Please confirm your email before signing in');
      }
      if (err?.name === 'NotAuthorizedException') {
        throw new UnauthorizedException('Incorrect email or password');
      }
      if (err?.name === 'UserNotFoundException') {
        throw new UnauthorizedException('Incorrect email or password');
      }
      throw new UnauthorizedException('Login failed. Please try again.');
    }
  }

  async refresh(refreshToken: string) {
    try {
      const response = await this.awsService.cognito.send(new InitiateAuthCommand({
        AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
        ClientId: this.clientId,
        AuthParameters: { REFRESH_TOKEN: refreshToken },
      }));

      const authResult = response.AuthenticationResult!;
      return {
        accessToken: authResult.AccessToken,
        idToken: authResult.IdToken,
      };
    } catch (err: any) {
      this.logger.error(`Token refresh failed: ${err?.name} — ${err?.message}`);
      throw new UnauthorizedException('Session expired. Please sign in again.');
    }
  }
}
