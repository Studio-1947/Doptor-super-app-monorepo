import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsIn,
  IsDateString,
  IsArray,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export const TASK_STATUSES = ["todo", "in-progress", "review", "done"] as const;
export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;

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

  @ApiProperty({ enum: TASK_PRIORITIES, example: "medium", required: false })
  @IsIn(TASK_PRIORITIES)
  @IsOptional()
  priority?: (typeof TASK_PRIORITIES)[number];

  @ApiProperty({ example: "2026-08-15", required: false })
  @IsDateString()
  @IsOptional()
  due_date?: string;

  @ApiProperty({ example: ["finance", "budget"], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
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

  @ApiProperty({ enum: TASK_STATUSES, required: false })
  @IsIn(TASK_STATUSES)
  @IsOptional()
  status?: (typeof TASK_STATUSES)[number];

  @ApiProperty({
    example: "123e4567-e89b-12d3-a456-426614174000",
    description: "The UUID of the user assigned to this task",
    required: false,
  })
  @IsUUID()
  @IsOptional()
  assigned_to?: string;

  @ApiProperty({ enum: TASK_PRIORITIES, required: false })
  @IsIn(TASK_PRIORITIES)
  @IsOptional()
  priority?: (typeof TASK_PRIORITIES)[number];

  @ApiProperty({ example: "2026-08-15", required: false })
  @IsDateString()
  @IsOptional()
  due_date?: string;

  @ApiProperty({ example: ["finance", "budget"], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
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

export class UpdateTaskStatusDto {
  @ApiProperty({ enum: TASK_STATUSES, example: "in-progress" })
  @IsIn(TASK_STATUSES)
  @IsNotEmpty()
  status: (typeof TASK_STATUSES)[number];
}
