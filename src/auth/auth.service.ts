import { BadRequestException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CompletePasswordResetDto, LoginUserDto, RequestPasswordResetDto, VerifyPasswordResetDto } from './dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { VerificationCode } from './entities/verification-code.entity';
import { MoreThan, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { UserAuthEntity } from './entities/user-auth.entity';
import { RegisterUserDto } from './dto/register-user.dto';
import { USER_SERVICE, envs } from './config';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';


@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(VerificationCode)
    private readonly verificationCodeRepository: Repository<VerificationCode>,
    @InjectRepository(UserAuthEntity)
    private readonly userAuthRepository: Repository<UserAuthEntity>,
    private readonly jwtService: JwtService,
    @Inject(USER_SERVICE)
    private readonly userClient: ClientProxy
  ) {
  }



  async registerUser(registerUserDto: RegisterUserDto) {
    const { email, password, userName } = registerUserDto;

    const userAuth = this.userAuthRepository.create({
      email,
      password,
      userName,
    });

    await this.userAuthRepository.save(userAuth);

    try {
      // firstValueFrom, not a bare await: send() returns a cold Observable, so
      // awaiting it resolves without ever subscribing — the message is never sent
      // and the rollback below can never fire.
      await firstValueFrom(this.userClient.send('users.create', {
        id: userAuth.id,
        userName,
      }));

    } catch (error) {
      await this.userAuthRepository.delete(userAuth.id);
      throw error;
    }

    return {
      user: userAuth,
      token: this.getJwtToken(userAuth.id, userAuth.userName),
    };
  }

  async loginUser(loginUserDto: LoginUserDto) {

    const { email, password } = loginUserDto;

    const user = await this.userAuthRepository.findOne({ where: { email }, select: { password: true, id: true, userName: true } });

    if (!user) {
      throw new BadRequestException('Credentials are not valid');
    }

    if (!bcrypt.compareSync(password, user.password)) {
      throw new BadRequestException('Credentials are not valid');
    }


    const { password: passwordToDelete, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token: this.getJwtToken(user.id, user.userName)
    }

  }

  // Takes the raw token, never a caller-supplied user id: the signature is what
  // proves the caller is who they claim to be. Trusting an incoming userId would
  // let anyone act as any user.
  async checkStatus(token: string) {

    let payload: { id: string; userName: string };

    try {
      payload = this.jwtService.verify(token, { secret: envs.jwtSecret });
    } catch {
      throw new RpcException({ status: 401, message: 'Invalid or expired token' });
    }

    const user = await this.findUserById(payload.id);

    return {
      user,
      valid: true,
      token: this.getJwtToken(user.id, user.userName)
    }


  }

  // Password Reset Request

  async requestPasswordReset(requestPasswordResetDto: RequestPasswordResetDto) {

    try {

      const { email } = requestPasswordResetDto;

      const user = await this.findUserByEmail(email);

      if (!user) {
        throw new BadRequestException('User with specified email does not exist');
      }

      await this.verifyRecentCodesExistence(email);
      const verificationCode = await this.createVerificationCode(user.id);

      // await this.emailService.sendPasswordResetEmail(email, user.userName, verificationCode.code);
      return { message: 'Verification code sent to email' };



    } catch (error) {
      console.log(error)

      throw new InternalServerErrorException('Failed to process password reset request, check server logs for more details');
    }

  }

  private async verifyRecentCodesExistence(email: string) {
    const recentCode = await this.verificationCodeRepository.findOne({
      where: {
        email: email,
        used: false,
        createdAt: MoreThan(new Date(Date.now() - 2 * 60 * 1000))
      }
    });
    if (recentCode) {
      throw new BadRequestException('A recent verification code has already been sent. Please wait before requesting a new one.');
    }
  }


  private async createVerificationCode(userId: string) {

    const user = await this.findUserById(userId);

    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const createdAt = new Date();
    const verificationCode = this.verificationCodeRepository.create({
      code,
      createdAt,
      expiresAt,
      user,
      email: user.email
    });

    await this.verificationCodeRepository.save(verificationCode);

    return { code: verificationCode.code }
  }

  //Password Reset Verification

  async verifyResetCode(verifyPasswordResetDto: VerifyPasswordResetDto) {

    const verificationCode = await this.getResetCode(verifyPasswordResetDto);

    return { message: 'Verification successful' };

  }


  private async getResetCode(verifyPasswordResetDto: VerifyPasswordResetDto) {
    try {
      const { email, code } = verifyPasswordResetDto;

      const verificationCode = await this.verificationCodeRepository.findOne({
        where: {
          email: email,
          code: code,
          used: false,
          expiresAt: MoreThan(new Date())
        },
      });

      if (!verificationCode) {
        throw new BadRequestException('Invalid or expired verification code');
      }

      return verificationCode;

    } catch (error) {

      throw new InternalServerErrorException('Failed to verify code, check server logs for more details');

    }
  }


  async completePasswordReset(completePasswordResetDto: CompletePasswordResetDto) {
    try {
      const { email, newPassword, code } = completePasswordResetDto;

      const verificationCode = await this.getResetCode({ email, code });

      const updatedUser = await this.userAuthRepository.preload({
        id: verificationCode.user.id,
        password: newPassword
      });

      if (!updatedUser) {
        throw new BadRequestException('Failed to update user password');
      }

      await this.userAuthRepository.save(updatedUser);

      verificationCode.used = true;
      await this.verificationCodeRepository.save(verificationCode);

      // await this.emailService.sendPasswordChangeEmail(email, verificationCode.user.userName);

      return { message: 'Password updated successfully' };

    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update password, check server logs for more details');
    }
  }

  async findUserById(id: string) {

    const user = await this.userAuthRepository.findOne({ where: { id } });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user;

  }

  async findUserByEmail(email: string) {
    const user = await this.userAuthRepository.findOne({ where: { email } });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user;
  }

  private getJwtToken(id: string, userName: string) {
    return this.jwtService.sign({
      id: id,
      userName: userName
    });
  }

}
