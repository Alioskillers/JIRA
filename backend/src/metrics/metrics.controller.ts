import { Controller, Post, Get, UseGuards } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/user.decorator';

@Controller('metrics')
@UseGuards(RolesGuard)
export class MetricsController {
  constructor(private metricsService: MetricsService) {}

  @Post('tasks-assigned')
  async publishTasksAssigned(@CurrentUser() user: any) {
    await this.metricsService.publishMetricWithDimension('TasksAssignedPerTeam', 1, 'TeamId', user.teamId);
    return { ok: true };
  }

  @Get('summary')
  getSummary() {
    return this.metricsService.getSummary();
  }
}
