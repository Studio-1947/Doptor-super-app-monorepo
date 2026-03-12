import { IsNotEmpty, IsString, IsUUID, IsOptional } from "class-validator";
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
    example: "Responsible for product development",
    description: "Description of the department",
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: "123e4567-e89b-12d3-a456-426614174000",
    description: "The UUID of the organisation",
  })
  @IsUUID()
  @IsNotEmpty()
  organisation_id: string;
}

export class UpdateDepartmentDto {
  @ApiProperty({
    example: "Software Engineering",
    description: "The new name of the department",
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: "Updated description",
    description: "The new description",
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
