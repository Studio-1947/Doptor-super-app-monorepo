import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUrl,
  MaxLength,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateDocumentDto {
  @ApiProperty({ example: "Offer Letter" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: "https://example.com/docs/offer-letter.pdf" })
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ example: "HR", required: false })
  @IsString()
  @IsOptional()
  @MaxLength(60)
  category?: string;

  // organisation_id deliberately removed — taken from the authenticated user.
}

/** Metadata for an uploaded document; the file itself is multipart. */
export class UploadDocumentMetaDto {
  @ApiProperty({ required: false, description: "Defaults to the filename" })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ example: "HR", required: false })
  @IsString()
  @IsOptional()
  @MaxLength(60)
  category?: string;
}

export class UpdateDocumentDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  name?: string;

  @ApiProperty({ required: false })
  @IsUrl()
  @IsOptional()
  url?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(60)
  category?: string;
}

export class ReviewDocumentDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  note?: string;
}
