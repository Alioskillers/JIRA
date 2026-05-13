import {
  Controller, Get, Post, Put, Delete, Body, Param,
  UseGuards, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateStatusDto } from './dto/task.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/user.decorator';

@Controller('tasks')
@UseGuards(RolesGuard)
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post()
  @Roles('manager')
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() dto: CreateTaskDto,
    @CurrentUser() user: any,
    @UploadedFile() file?: { buffer: Buffer; originalname: string; mimetype: string },
  ) {
    const imageBuffer = file?.buffer ?? null;
    const imageExt = file ? (file.originalname.split('.').pop() ?? 'jpg') : null;
    return this.tasksService.create(dto, imageBuffer, imageExt, user);
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.tasksService.findAll(user);
  }

  @Get('team/:teamId')
  @Roles('manager')
  findByTeam(@Param('teamId') teamId: string) {
    return this.tasksService.findByTeam(teamId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.tasksService.findOne(id, user);
  }

  @Put(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.updateStatus(id, dto.status, user);
  }

  @Put(':id')
  @Roles('manager')
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Param('id') id: string,
    @Body() dto: any,
    @UploadedFile() file?: { buffer: Buffer; originalname: string; mimetype: string },
  ) {
    const imageBuffer = file?.buffer ?? null;
    const imageExt = file ? (file.originalname.split('.').pop() ?? 'jpg') : null;
    return this.tasksService.update(id, dto, imageBuffer, imageExt);
  }

  @Delete(':id')
  @Roles('manager')
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }
}
