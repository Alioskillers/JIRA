import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @IsIn(['todo', 'inprogress', 'inreview', 'done'])
  status?: string;

  @IsString()
  @IsOptional()
  @IsIn(['low', 'medium', 'high', 'critical'])
  priority?: string;

  @IsString()
  @IsOptional()
  deadline?: string;

  @IsString()
  @IsNotEmpty()
  assigneeId: string;

  @IsString()
  @IsNotEmpty()
  assigneeName: string;

  @IsString()
  @IsOptional()
  assigneeEmail?: string;

  @IsString()
  @IsNotEmpty()
  teamId: string;

  @IsString()
  @IsOptional()
  teamName?: string;

  @IsString()
  @IsOptional()
  projectId?: string;
}

export class UpdateStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['todo', 'inprogress', 'inreview', 'done'])
  status: string;
}
