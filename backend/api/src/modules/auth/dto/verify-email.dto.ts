import { IsString, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class VerifyEmailDto {
  @ApiProperty({
    description: "The verification token received via email",
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}
