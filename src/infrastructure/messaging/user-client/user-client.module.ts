import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { USER_SERVICE } from 'src/auth/config';
import { envs } from 'src/auth/config/envs';

@Module({
    imports: [
        ClientsModule.register([
            {
                name: USER_SERVICE,
                transport: Transport.NATS,
                options: {
                    servers: envs.natsServers
                }
            }
        ])
    ],
    exports: [
        ClientsModule.register([
            {
                name: USER_SERVICE,
                transport: Transport.NATS,
                options: {
                    servers: envs.natsServers
                }
            }
        ])
    ]


})
export class UserClientModule { }
