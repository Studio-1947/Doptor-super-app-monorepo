import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsOptional,
  MaxLength,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateDepartmentDto {
  @ApiProperty({
    example: "Engineering",
    description: "The name of the department",
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: "ENG",
    description: "Short code for the department",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  code?: string;

  @ApiProperty({
    example: "Responsible for product development",
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: "UUID of the user heading this department",
    required: false,
  })
  @IsUUID()
  @IsOptional()
  head_of_dept_id?: string;

  @ApiProperty({
    example: "ENG",
    description:
      "Prefix for task references from this department (e.g. ENG-12). " +
      "Falls back to the department code or name when unset.",
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  task_prefix?: string;

  // NOTE: organisation_id is deliberately absent. It is taken from the
  // authenticated user — accepting it from the body let any authenticated user
  // create a department inside any other organisation.
}

export class UpdateDepartmentDto {
  @ApiProperty({ example: "Software Engineering", required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: "ENG", required: false })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  code?: string;

  @ApiProperty({ example: "Updated description", required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  head_of_dept_id?: string;

  @ApiProperty({ example: "ENG", required: false })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  task_prefix?: string;
}
