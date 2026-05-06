import { Controller, Post, Body, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RefreshDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

class ConfirmEmailDto {
  @IsEmail() email: string;
  @IsString() @IsNotEmpty() code: string;
}

class ResendCodeDto {
  @IsEmail() email: string;
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    this.logger.log(`Register request received for: ${dto.email}`);
    return this.authService.register(dto.name, dto.email, dto.password);
  }

  @Post('confirm')
  confirmEmail(@Body() dto: ConfirmEmailDto) {
    this.logger.log(`Confirm email request for: ${dto.email}`);
    return this.authService.confirmEmail(dto.email, dto.code);
  }

  @Post('resend-code')
  resendCode(@Body() dto: ResendCodeDto) {
    this.logger.log(`Resend code request for: ${dto.email}`);
    return this.authService.resendConfirmation(dto.email);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    this.logger.log(`Login request for: ${dto.email}`);
    return this.authService.login(dto.email, dto.password);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }
}
