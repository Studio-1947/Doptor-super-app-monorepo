import { IsEmail, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ForgotPasswordDto {
  @ApiProperty({
    example: "user@example.com",
    description: "The email address to send the reset link to",
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
