import { IsString, IsNotEmpty, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ResetPasswordDto {
  @ApiProperty({
    description: "The password reset token received via email",
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    example: "newPassword123",
    description: "The new password (min 8 characters)",
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  newPassword: string;
}
