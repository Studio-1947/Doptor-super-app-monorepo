import { IsEmail, IsOptional, IsString, IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateUserDto {
  @ApiProperty({
    example: "user@example.com",
    description: "The email address of the user",
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: "password123",
    description: "The password of the user",
  })
  @IsString()
  password: string;

  @ApiProperty({
    example: "123e4567-e89b-12d3-a456-426614174000",
    description: "The UUID of the organisation",
  })
  @IsUUID()
  organisation_id: string;
}

export class UpdateUserDto {
  @ApiProperty({
    example: "user@example.com",
    description: "The email address of the user",
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    example: "newPassword123",
    description: "The password of the user",
    required: false,
  })
  @IsString()
  @IsOptional()
  password?: string;
}

export class AssignRoleDto {
  @ApiProperty({
    example: "123e4567-e89b-12d3-a456-426614174000",
    description: "The UUID of the role to assign",
  })
  @IsUUID()
  role_id: string;
}
