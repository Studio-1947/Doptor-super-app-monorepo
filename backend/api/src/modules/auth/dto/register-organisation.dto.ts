import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsArray,
  IsOptional,
} from "class-validator";

export class RegisterOrganisationDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  organisation_name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsArray()
  @IsOptional()
  enabled_verticals?: string[];
}
