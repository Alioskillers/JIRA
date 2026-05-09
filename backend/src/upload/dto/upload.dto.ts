import { IsString, IsNotEmpty } from 'class-validator';

export class PresignedUrlDto {
  @IsString()
  @IsNotEmpty()
  ext: string;
}
