import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsArray,
  IsOptional,
} from "class-validator";

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUUID()
  @IsNotEmpty()
  organisation_id: string;

  @IsArray()
  @IsOptional()
  permission_ids?: string[];
}

export class UpdateRoleDto {
  @IsString()
  @IsOptional()
  name?: string;
}

export class AssignPermissionsDto {
  @IsArray()
  @IsUUID("4", { each: true })
  permission_ids: string[];
}
