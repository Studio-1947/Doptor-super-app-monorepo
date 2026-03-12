import { IsNotEmpty, IsString, IsUUID, IsObject } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateWorkflowDto {
  @ApiProperty({
    example: "Leave Approval",
    description: "The name of the workflow",
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: { steps: [] },
    description: "The workflow logic definition in JSON",
  })
  @IsObject()
  @IsNotEmpty()
  definition: any; // Workflow definition JSON

  @ApiProperty({
    example: "123e4567-e89b-12d3-a456-426614174000",
    description: "The UUID of the organisation",
  })
  @IsUUID()
  @IsNotEmpty()
  organisation_id: string;
}

export class UpdateWorkflowDto {
  @ApiProperty({
    example: "Updated Workflow Name",
    description: "The new name of the workflow",
    required: false,
  })
  @IsString()
  name?: string;

  @ApiProperty({
    example: { steps: [{ id: 1 }] },
    description: "The new workflow logic definition",
    required: false,
  })
  @IsObject()
  definition?: any;
}
