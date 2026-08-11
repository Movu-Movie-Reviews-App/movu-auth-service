import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAuthEntity } from './entities/user-auth.entity';
import { VerificationCode } from './entities/verification-code.entity';
import { envs } from './config/envs';
import { UserClientModule } from 'src/infrastructure/messaging/user-client/user-client.module';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  imports: [
    TypeOrmModule.forFeature([UserAuthEntity, VerificationCode]),
    JwtModule.register({

      secret: envs.jwtSecret,
      signOptions: {
        expiresIn: '2h'
      }
    }),
    UserClientModule

  ],
  exports: [JwtModule]
})

export class AuthModule { }
