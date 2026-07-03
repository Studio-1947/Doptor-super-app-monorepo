import {
  IsString,
  IsNotEmpty,
  MinLength,
  IsOptional,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class AcceptInviteDto {
  @ApiProperty({
    description: "The invitation token received via email",
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    example: "newPassword123",
    description: "The password to set for the account (min 8 characters)",
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  first_name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  last_name?: string;
}
