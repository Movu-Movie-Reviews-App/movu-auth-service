import { IsEmail, IsString, Matches, MinLength } from "class-validator";

export class RegisterUserDto {

    @IsString()
    @Matches(/^(?=.*\p{L})[\p{L}0-9._-]{3,16}$/u, {
        message: 'Username must be 6–16 characters, contain at least one letter, and may include letters, numbers, dot (.), hyphen (-), or underscore (_).'
    })
    userName: string;

    @IsString()
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(8)
    @Matches(
        /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message: 'The password must have a Uppercase, lowercase letter and a number'
    })
    password: string;
}