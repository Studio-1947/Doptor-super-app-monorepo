import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsOptional,
  IsEmail,
  IsInt,
  IsObject,
  IsBoolean,
  IsDateString,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

// NOTE: AddFacultyDialog/AddStudentDialog (frontend/web/features/campus) collect
// more demographic fields than the `users` schema currently has columns for
// (phone, dateOfBirth, gender, qualification, guardianName, etc). The service
// layer ignores these extra fields today; they're declared here as optional
// passthrough so the global `forbidNonWhitelisted` ValidationPipe doesn't
// reject the whole request. Persisting them is schema work tracked for the
// real-API-wiring phase, not a validation concern.

export class CreateFacultyDto {
  @ApiProperty({ example: "jane.doe@university.edu" })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: "Jane" })
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @ApiProperty({ example: "Doe" })
  @IsString()
  @IsNotEmpty()
  last_name: string;

  @ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
  @IsUUID()
  @IsOptional()
  department_id?: string;

  @ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
  @IsUUID()
  @IsNotEmpty()
  organisation_id: string;

  // --- Not yet persisted; accepted to avoid breaking the existing form ---
  @ApiProperty({ required: false }) @IsString() @IsOptional() firstName?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() lastName?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() phone?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() dateOfBirth?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() gender?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() address?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() department?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() designation?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() qualification?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() specialization?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() experience?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() joinDate?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() subjects?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() salary?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() bloodGroup?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() emergencyContactName?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() emergencyContactRelation?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() emergencyContactPhone?: string;
}

export class CreateStudentDto {
  @ApiProperty({ example: "john.smith@university.edu" })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: "John" })
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @ApiProperty({ example: "Smith" })
  @IsString()
  @IsNotEmpty()
  last_name: string;

  @ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
  @IsUUID()
  @IsOptional()
  department_id?: string;

  @ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
  @IsUUID()
  @IsNotEmpty()
  organisation_id: string;

  // --- Not yet persisted; accepted to avoid breaking the existing form ---
  @ApiProperty({ required: false }) @IsString() @IsOptional() enrollmentNo?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() rollNo?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() department?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() batch?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() status?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() phone?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() guardianName?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() guardianPhone?: string;
}

export class CreateCourseDto {
  @ApiProperty({ example: "CS101" })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: "Introduction to Computer Science" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: "Covers the fundamentals of CS", required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 3, required: false })
  @IsInt()
  @IsOptional()
  credits?: number;

  @ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
  @IsUUID()
  @IsOptional()
  department_id?: string;

  @ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
  @IsUUID()
  @IsNotEmpty()
  organisation_id: string;
}

export class CreateDepartmentDto {
  @ApiProperty({ example: "Computer Science" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: "CS", required: false })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({ example: "Department of Computer Science", required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: "123e4567-e89b-12d3-a456-426614174000",
    required: false,
  })
  @IsUUID()
  @IsOptional()
  headOfDept?: string;

  @ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
  @IsUUID()
  @IsNotEmpty()
  organisation_id: string;
}

export class CreateAcademicYearDto {
  @ApiProperty({ example: "2025-2026" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: "2025-06-01" })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ example: "2026-05-31" })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  isCurrent?: boolean;

  @ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
  @IsUUID()
  @IsNotEmpty()
  organisation_id: string;
}

export class UpdateClassDto {
  @ApiProperty({ example: "CS101 - Section A", required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: "123e4567-e89b-12d3-a456-426614174000",
    required: false,
  })
  @IsUUID()
  @IsOptional()
  instructorId?: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  schedule?: Record<string, unknown>;

  @ApiProperty({
    example: "123e4567-e89b-12d3-a456-426614174000",
    required: false,
  })
  @IsUUID()
  @IsOptional()
  courseId?: string;
}
