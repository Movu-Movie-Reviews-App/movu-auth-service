import 'dotenv/config'
import Joi, * as joi from 'joi';


interface EnvVars {

    PORT: number;
    DB_HOST: string;
    DB_USERNAME: string;
    DB_PASSWORD: string;
    AUTH_DB_NAME: string;
    AUTH_DB_PORT: number;
    NATS_SERVERS: string[];
    JWT_SECRET: string,
    JWT_EXPIRES_IN: string


}

const envsSchema = Joi.object({
    PORT: joi.number().required(),
    DB_HOST: joi.string().required(),
    AUTH_DB_PORT: joi.number().required(),
    DB_USERNAME: joi.string().required(),
    DB_PASSWORD: joi.string().required(),
    AUTH_DB_NAME: joi.string().required(),
    NATS_SERVERS: joi.array().items(joi.string()).required(),
    JWT_SECRET: joi.string().required(),
    JWT_EXPIRES_IN: joi.string().required()
}).unknown(true);

const { error, value } = envsSchema.validate({ ...process.env, NATS_SERVERS: process.env.NATS_SERVERS?.split(',') });

if (error) {
    throw new Error(`Config validation error: ${error.message}`)
}

const envVars: EnvVars = value;

export const envs = {
    port: envVars.PORT,
    dbHost: envVars.DB_HOST,
    dbPort: envVars.AUTH_DB_PORT,
    dbUsername: envVars.DB_USERNAME,
    dbPassword: envVars.DB_PASSWORD,
    dbName: envVars.AUTH_DB_NAME,
    natsServers: envVars.NATS_SERVERS,
    jwtSecret: envVars.JWT_SECRET,
    jwtExpiresIn: envVars.JWT_EXPIRES_IN
};




