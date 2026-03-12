import { IsNotEmpty, IsString, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateOrganisationDto {
  @ApiProperty({
    example: "Acme Corp",
    description: "The name of the organisation",
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: "acme-corp",
    description: "Unique slug for the organisation",
  })
  @IsString()
  @IsNotEmpty()
  slug: string;
}

export class UpdateOrganisationDto {
  @ApiProperty({
    example: "Acme Corp",
    description: "The name of the organisation",
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: "acme-corp",
    description: "Unique slug for the organisation",
    required: false,
  })
  @IsString()
  @IsOptional()
  slug?: string;
}
