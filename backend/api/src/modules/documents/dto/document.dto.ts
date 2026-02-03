import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  url: string;

  @IsUUID()
  @IsNotEmpty()
  organisation_id: string;
}

export class UpdateDocumentDto {
  @IsString()
  name?: string;

  @IsString()
  url?: string;
}
