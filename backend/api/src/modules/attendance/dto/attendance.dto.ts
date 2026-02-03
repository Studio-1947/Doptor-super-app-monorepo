import { IsNotEmpty, IsUUID, IsDateString, IsOptional } from "class-validator";

export class CreateAttendanceDto {
  @IsUUID()
  @IsNotEmpty()
  user_id: string;

  @IsUUID()
  @IsNotEmpty()
  organisation_id: string;

  @IsDateString()
  @IsOptional()
  check_in?: string;

  @IsDateString()
  @IsOptional()
  check_out?: string;
}

export class UpdateAttendanceDto {
  @IsDateString()
  @IsOptional()
  check_in?: string;

  @IsDateString()
  @IsOptional()
  check_out?: string;
}

export class CheckInDto {
  @IsUUID()
  @IsNotEmpty()
  user_id: string;

  @IsUUID()
  @IsNotEmpty()
  organisation_id: string;
}

export class CheckOutDto {
  @IsUUID()
  @IsNotEmpty()
  attendance_id: string;
}
