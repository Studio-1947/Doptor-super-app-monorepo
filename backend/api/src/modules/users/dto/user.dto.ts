import { IsEmail, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsUUID()
  organisation_id: string;
}

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  password?: string;
}

export class AssignRoleDto {
  @IsUUID()
  role_id: string;
}
