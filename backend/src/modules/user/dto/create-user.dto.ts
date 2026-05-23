import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsNotEmpty()
  @IsString()
  fullName: string;

  /** Raw password to be hashed before storage */
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;
}
