import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsArray,
  IsOptional,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RegisterOrganisationDto {
  @ApiProperty({
    example: "admin@organisation.com",
    description: "The admin email address of the organisation",
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: "password123",
    description: "The admin password (min 8 characters)",
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    example: "Acme Corp",
    description: "The name of the organisation",
  })
  @IsString()
  @IsNotEmpty()
  organisation_name: string;

  @ApiProperty({
    example: "acme-corp",
    description: "Unique slug for the organisation URL",
  })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({
    example: ["education", "campus"],
    description: "List of enabled vertical modules for this organisation",
    required: false,
    type: [String],
  })
  @IsArray()
  @IsOptional()
  enabled_verticals?: string[];
}
