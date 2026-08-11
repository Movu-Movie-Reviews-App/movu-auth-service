import { IsEmail, IsString } from "class-validator";

export class VerifyPasswordResetDto {

    @IsString()
    @IsEmail()
    email: string;

    @IsString()
    code: string;
}