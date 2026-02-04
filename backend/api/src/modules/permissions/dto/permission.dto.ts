import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty()
  action: string; // e.g., 'create', 'read', 'update', 'delete'

  @IsString()
  @IsNotEmpty()
  resource: string; // e.g., 'users', 'tasks', 'documents'

  @IsUUID()
  @IsNotEmpty()
  organisation_id: string;
}

export class UpdatePermissionDto {
  @IsString()
  action?: string;

  @IsString()
  resource?: string;
}
