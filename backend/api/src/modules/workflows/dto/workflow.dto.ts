import { IsNotEmpty, IsString, IsObject, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateWorkflowDto {
  @ApiProperty({ example: "Leave Approval" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: { steps: [] }, required: false })
  @IsObject()
  @IsOptional()
  definition?: Record<string, unknown>;

  // organisation_id deliberately removed — taken from the authenticated user.
}

export class UpdateWorkflowDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: { steps: [{ id: 1 }] }, required: false })
  @IsObject()
  @IsOptional()
  definition?: Record<string, unknown>;
}
