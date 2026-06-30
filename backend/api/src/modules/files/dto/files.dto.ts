import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsIn,
  IsArray,
  IsDateString,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

const PRIORITIES = ["normal", "urgent", "immediate"] as const;
const SECURITY_LEVELS = [
  "unclassified",
  "restricted",
  "confidential",
  "secret",
] as const;

export class CreateFileDto {
  @ApiProperty({ example: "FILE/2026/01/001" })
  @IsString()
  @IsNotEmpty()
  file_number: string;

  @ApiProperty({ example: "Procurement of office supplies" })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false, enum: PRIORITIES })
  @IsIn(PRIORITIES)
  @IsOptional()
  priority?: (typeof PRIORITIES)[number];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  initial_note?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ required: false, enum: SECURITY_LEVELS })
  @IsIn(SECURITY_LEVELS)
  @IsOptional()
  securityLevel?: (typeof SECURITY_LEVELS)[number];

  @ApiProperty({ required: false, type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  dueDate?: string;
}

export class ForwardFileDto {
  @ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
  @IsUUID()
  @IsNotEmpty()
  toUserId: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  remarks?: string;
}

export class ReturnFileDto {
  @ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
  @IsUUID()
  @IsNotEmpty()
  toUserId: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  remarks?: string;
}

export class CloseFileDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  remarks?: string;
}

export class AddNoteDto {
  @ApiProperty({ example: "Reviewed and recommended for approval." })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  isFinal?: boolean;
}

export class ApproveFileDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  remarks?: string;

  @ApiProperty({
    required: false,
    description: "Forward to this user after approving, or leave empty to end the workflow",
  })
  @IsUUID()
  @IsOptional()
  forwardTo?: string;
}

export class RejectFileDto {
  @ApiProperty({ example: "Budget exceeds approved limit." })
  @IsString()
  @IsNotEmpty()
  remarks: string;
}
