import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsBoolean,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateTaskDto {
  @ApiProperty({
    example: "Review codebase",
    description: "The title of the task",
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: "Go through the new modules",
    description: "Detailed description of the task",
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: "123e4567-e89b-12d3-a456-426614174000",
    description: "The UUID of the user assigned to this task",
    required: false,
  })
  @IsUUID()
  @IsOptional()
  assigned_to?: string;

  @ApiProperty({
    example: "123e4567-e89b-12d3-a456-426614174000",
    description: "The UUID of the organisation",
  })
  @IsUUID()
  @IsNotEmpty()
  organisation_id: string;
}

export class UpdateTaskDto {
  @ApiProperty({
    example: "Review codebase (updated)",
    description: "The updated title of the task",
    required: false,
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    example: "Updated description",
    description: "The updated description",
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: true,
    description: "Whether the task is completed",
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  is_completed?: boolean;

  @ApiProperty({
    example: "123e4567-e89b-12d3-a456-426614174000",
    description: "The UUID of the user assigned to this task",
    required: false,
  })
  @IsUUID()
  @IsOptional()
  assigned_to?: string;
}

export class AssignTaskDto {
  @ApiProperty({
    example: "123e4567-e89b-12d3-a456-426614174000",
    description: "The UUID of the user to assign the task to",
  })
  @IsUUID()
  @IsNotEmpty()
  user_id: string;
}
