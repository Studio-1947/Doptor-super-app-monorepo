import { IsNotEmpty, IsUUID, IsDateString, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateAttendanceDto {
  @ApiProperty({
    example: "123e4567-e89b-12d3-a456-426614174000",
    description: "The UUID of the user",
  })
  @IsUUID()
  @IsNotEmpty()
  user_id: string;

  @ApiProperty({
    example: "123e4567-e89b-12d3-a456-426614174000",
    description: "The UUID of the organisation",
  })
  @IsUUID()
  @IsNotEmpty()
  organisation_id: string;

  @ApiProperty({
    example: "2024-03-12T09:00:00Z",
    description: "The check-in timestamp",
    required: false,
  })
  @IsDateString()
  @IsOptional()
  check_in?: string;

  @ApiProperty({
    example: "2024-03-12T17:00:00Z",
    description: "The check-out timestamp",
    required: false,
  })
  @IsDateString()
  @IsOptional()
  check_out?: string;
}

export class UpdateAttendanceDto {
  @ApiProperty({
    example: "2024-03-12T09:00:00Z",
    description: "The check-in timestamp",
    required: false,
  })
  @IsDateString()
  @IsOptional()
  check_in?: string;

  @ApiProperty({
    example: "2024-03-12T17:00:00Z",
    description: "The check-out timestamp",
    required: false,
  })
  @IsDateString()
  @IsOptional()
  check_out?: string;
}

export class CheckInDto {
  @ApiProperty({
    example: "123e4567-e89b-12d3-a456-426614174000",
    description: "The UUID of the user checking in",
  })
  @IsUUID()
  @IsNotEmpty()
  user_id: string;

  @ApiProperty({
    example: "123e4567-e89b-12d3-a456-426614174000",
    description: "The UUID of the organisation",
  })
  @IsUUID()
  @IsNotEmpty()
  organisation_id: string;
}

export class CheckOutDto {
  @ApiProperty({
    example: "123e4567-e89b-12d3-a456-426614174000",
    description: "The UUID of the attendance record to check out from",
  })
  @IsUUID()
  @IsNotEmpty()
  attendance_id: string;
}
