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

  // SECURITY: organisation_id is deliberately absent — taken from the
  // authenticated user so a caller cannot create permission rows in another org.
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
