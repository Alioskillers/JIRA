import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { UploadService } from './upload.service';
import { PresignedUrlDto } from './dto/upload.dto';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('upload')
@UseGuards(RolesGuard)
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post('presigned')
  getPresignedUrl(@Body() dto: PresignedUrlDto) {
    return this.uploadService.getPresignedPutUrl(dto.ext);
  }
}
