import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsArray,
  IsOptional,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateRoleDto {
  @ApiProperty({ example: "Manager", description: "The name of the role" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: "Team management", required: false })
  @IsString()
  @IsOptional()
  description?: string;

  // SECURITY: organisation_id is deliberately absent. It is taken from the
  // authenticated user — accepting it from the body let any authenticated user
  // create a role inside any other organisation (verified privilege escalation).
}

export class UpdateRoleDto {
  @ApiProperty({
    example: "Senior Manager",
    description: "The new name of the role",
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;
}

export class AssignPermissionsDto {
  @ApiProperty({
    example: ["uuid1", "uuid2"],
    description: "List of permission UUIDs to assign to the role",
  })
  @IsArray()
  @IsUUID("4", { each: true })
  permission_ids: string[];
}
