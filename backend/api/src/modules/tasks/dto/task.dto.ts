import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsBoolean,
} from "class-validator";

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  assigned_to?: string;

  @IsUUID()
  @IsNotEmpty()
  organisation_id: string;
}

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  is_completed?: boolean;

  @IsUUID()
  @IsOptional()
  assigned_to?: string;
}

export class AssignTaskDto {
  @IsUUID()
  @IsNotEmpty()
  user_id: string;
}
