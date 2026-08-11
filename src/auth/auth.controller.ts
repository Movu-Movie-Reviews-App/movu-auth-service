import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login-user.dto';
import { RequestPasswordResetDto, VerifyPasswordResetDto } from './dto';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RegisterUserDto } from './dto/register-user.dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @MessagePattern('auth.register')
  register(@Payload() registerUserDto: RegisterUserDto) {
    return this.authService.registerUser(registerUserDto);
  }

  @MessagePattern('auth.login')
  login(@Payload() loginUserDto: LoginUserDto) {
    return this.authService.loginUser(loginUserDto);
  }

  @MessagePattern('auth.check-status')
  checkStatus(@Payload('userId', ParseUUIDPipe) userId: string) {
    return this.authService.checkStatus(userId);
  }

  @MessagePattern('auth.request-password-reset')
  requestResetPassword(@Payload() email: RequestPasswordResetDto) {

    return this.authService.requestPasswordReset(email);


  }

  @MessagePattern('auth.reset-password')
  confirmResetPassword(@Payload() verifyPasswordDto: VerifyPasswordResetDto) {
    return this.authService.verifyResetCode(verifyPasswordDto);

  }

}
