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

  @ApiProperty({
    example: "123e4567-e89b-12d3-a456-426614174000",
    description: "The UUID of the organisation",
  })
  @IsUUID()
  @IsNotEmpty()
  organisation_id: string;

  @ApiProperty({
    example: ["uuid1", "uuid2"],
    description: "List of permission UUIDs",
    required: false,
    type: [String],
  })
  @IsArray()
  @IsOptional()
  permission_ids?: string[];
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
