import { Module } from '@nestjs/common';
import { envs } from './auth/config/envs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserClientModule } from './infrastructure/messaging/user-client/user-client.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [TypeOrmModule.forRoot({
    type: 'postgres',
    host: envs.dbHost,
    port: envs.dbPort,
    username: envs.dbUsername,
    password: envs.dbPassword,
    database: envs.dbName,
    autoLoadEntities: true,
    synchronize: true,
  }), UserClientModule, AuthModule],
})
export class AppModule { }
