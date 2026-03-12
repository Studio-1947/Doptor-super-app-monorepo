import { IsNotEmpty, IsString, IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateDocumentDto {
  @ApiProperty({
    example: "Offer Letter",
    description: "The name of the document",
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: "https://example.com/docs/offer-letter.pdf",
    description: "The URL of the document",
  })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiProperty({
    example: "123e4567-e89b-12d3-a456-426614174000",
    description: "The UUID of the organisation",
  })
  @IsUUID()
  @IsNotEmpty()
  organisation_id: string;
}

export class UpdateDocumentDto {
  @ApiProperty({
    example: "Updated Offer Letter",
    description: "The new name of the document",
    required: false,
  })
  @IsString()
  name?: string;

  @ApiProperty({
    example: "https://example.com/docs/new-offer-letter.pdf",
    description: "The new URL of the document",
    required: false,
  })
  @IsString()
  url?: string;
}
