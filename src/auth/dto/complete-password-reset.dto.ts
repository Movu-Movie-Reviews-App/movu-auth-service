import { IsEmail, IsString, Matches } from "class-validator";

export class CompletePasswordResetDto {

    @IsEmail()
    @IsString()
    email: string;

    @IsString()
    code: string;

    @IsString()
    @Matches(
        /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message: 'The password must have a Uppercase, lowercase letter and a number'
    })
    newPassword: string;
}