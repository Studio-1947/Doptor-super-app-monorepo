import { IsNotEmpty, IsString, IsUUID, IsObject } from "class-validator";

export class CreateWorkflowDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsObject()
  @IsNotEmpty()
  definition: any; // Workflow definition JSON

  @IsUUID()
  @IsNotEmpty()
  organisation_id: string;
}

export class UpdateWorkflowDto {
  @IsString()
  name?: string;

  @IsObject()
  definition?: any;
}
