import { IsNotEmpty, IsString, IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreatePermissionDto {
  @ApiProperty({
    example: "create",
    description: "The action allowed by this permission",
  })
  @IsString()
  @IsNotEmpty()
  action: string; // e.g., 'create', 'read', 'update', 'delete'

  @ApiProperty({
    example: "users",
    description: "The resource affected by this permission",
  })
  @IsString()
  @IsNotEmpty()
  resource: string; // e.g., 'users', 'tasks', 'documents'

  @ApiProperty({
    example: "123e4567-e89b-12d3-a456-426614174000",
    description: "The UUID of the organisation",
  })
  @IsUUID()
  @IsNotEmpty()
  organisation_id: string;
}

export class UpdatePermissionDto {
  @ApiProperty({
    example: "read",
    description: "The new action",
    required: false,
  })
  @IsString()
  action?: string;

  @ApiProperty({
    example: "tasks",
    description: "The new resource",
    required: false,
  })
  @IsString()
  resource?: string;
}
