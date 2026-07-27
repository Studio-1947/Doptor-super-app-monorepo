import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsOptional,
  IsNumber,
  IsInt,
  IsDateString,
  Min,
  Max,
  MaxLength,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class PunchDto {
  @ApiProperty({ example: 12.9716, required: false, description: "GPS latitude" })
  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsOptional()
  lat?: number;

  @ApiProperty({ example: 77.5946, required: false, description: "GPS longitude" })
  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsOptional()
  lng?: number;
}

export class CreateLeaveTypeDto {
  @ApiProperty({ example: "Casual Leave" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  name: string;

  @ApiProperty({ example: 12, required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  default_annual_quota?: number;

  @ApiProperty({ example: "#64748b", required: false })
  @IsString()
  @IsOptional()
  color?: string;
}

export class AllocateBalanceDto {
  @ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
  @IsUUID()
  @IsNotEmpty()
  user_id: string;

  @ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
  @IsUUID()
  @IsNotEmpty()
  leave_type_id: string;

  @ApiProperty({ example: 2026 })
  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;

  @ApiProperty({ example: 12 })
  @IsInt()
  @Min(0)
  allocated: number;
}

export class SubmitLeaveRequestDto {
  @ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
  @IsUUID()
  @IsNotEmpty()
  leave_type_id: string;

  @ApiProperty({ example: "2026-08-10" })
  @IsDateString()
  @IsNotEmpty()
  start_date: string;

  @ApiProperty({ example: "2026-08-12" })
  @IsDateString()
  @IsNotEmpty()
  end_date: string;

  @ApiProperty({ example: "Family function", required: false })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  reason?: string;
}

export class ReviewLeaveRequestDto {
  @ApiProperty({ example: "Approved — enjoy!", required: false })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  note?: string;
}
