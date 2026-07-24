import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsIn,
  IsDateString,
  IsArray,
  IsHexColor,
  MaxLength,
  ArrayMaxSize,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export const TASK_STATUSES = ["todo", "in-progress", "review", "done"] as const;
export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export const TASK_SORT_FIELDS = [
  "created_at",
  "updated_at",
  "due_date",
  "priority",
  "number",
] as const;

export class CreateTaskDto {
  @ApiProperty({ example: "Review codebase" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title: string;

  @ApiProperty({ example: "Go through the new modules", required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: "123e4567-e89b-12d3-a456-426614174000",
    description:
      "Department that owns this task. Required — the task's reference " +
      "(e.g. FIN-12) is drawn from this department's counter.",
  })
  @IsUUID()
  @IsNotEmpty()
  department_id: string;

  @ApiProperty({
    description: "Parent task, for creating a subtask. Nesting is one level.",
    required: false,
  })
  @IsUUID()
  @IsOptional()
  parent_task_id?: string;

  @ApiProperty({ enum: TASK_STATUSES, required: false })
  @IsIn(TASK_STATUSES)
  @IsOptional()
  status?: (typeof TASK_STATUSES)[number];

  @ApiProperty({ enum: TASK_PRIORITIES, example: "medium", required: false })
  @IsIn(TASK_PRIORITIES)
  @IsOptional()
  priority?: (typeof TASK_PRIORITIES)[number];

  @ApiProperty({ example: "2026-08-15", required: false })
  @IsDateString()
  @IsOptional()
  due_date?: string;

  @ApiProperty({
    type: [String],
    description: "User UUIDs to assign. A task may have several assignees.",
    required: false,
  })
  @IsArray()
  @IsUUID("4", { each: true })
  @ArrayMaxSize(50)
  @IsOptional()
  assignee_ids?: string[];

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsUUID("4", { each: true })
  @ArrayMaxSize(50)
  @IsOptional()
  label_ids?: string[];
}

export class UpdateTaskDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  title?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: TASK_STATUSES, required: false })
  @IsIn(TASK_STATUSES)
  @IsOptional()
  status?: (typeof TASK_STATUSES)[number];

  @ApiProperty({ enum: TASK_PRIORITIES, required: false })
  @IsIn(TASK_PRIORITIES)
  @IsOptional()
  priority?: (typeof TASK_PRIORITIES)[number];

  @ApiProperty({ example: "2026-08-15", required: false })
  @IsDateString()
  @IsOptional()
  due_date?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  is_archived?: boolean;
}

export class AssignTaskDto {
  @ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
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

export class ToggleLabelDto {
  @ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
  @IsUUID()
  @IsNotEmpty()
  label_id: string;
}

export class CreateLabelDto {
  @ApiProperty({ example: "Budget" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  name: string;

  @ApiProperty({ example: "#64748b", required: false })
  @IsHexColor()
  @IsOptional()
  color?: string;
}

export class CreateCommentDto {
  @ApiProperty({ example: "Waiting on the finance sign-off." })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  body: string;
}

export class SetArchivedDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  @IsNotEmpty()
  is_archived: boolean;
}
