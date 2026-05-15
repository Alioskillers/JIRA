import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/comment.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/user.decorator';

@Controller('tasks/:taskId/comments')
@UseGuards(RolesGuard)
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Post()
  create(
    @Param('taskId') taskId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: any,
  ) {
    return this.commentsService.create(taskId, dto, user);
  }

  @Get()
  findByTask(@Param('taskId') taskId: string, @CurrentUser() user: any) {
    return this.commentsService.findByTask(taskId, user);
  }
}
