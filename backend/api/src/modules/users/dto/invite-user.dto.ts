import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  ArrayMinSize,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class InviteUserDto {
  @ApiProperty({ example: "user@example.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  first_name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  last_name?: string;

  @ApiProperty({
    required: false,
    description: "RBAC role to assign to the invitee",
  })
  @IsUUID()
  @IsOptional()
  role_id?: string;

  @ApiProperty({
    required: false,
    description:
      "Free-text campus role tag ('faculty' | 'student'); leave unset for office invites",
  })
  @IsString()
  @IsOptional()
  legacy_role?: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  department_id?: string;
}

export class BulkInviteUsersDto {
  @ApiProperty({ type: [InviteUserDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InviteUserDto)
  invites: InviteUserDto[];
}
