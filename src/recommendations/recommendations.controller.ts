import { Controller, Get, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('recommendations')
@UseGuards(JwtAuthGuard)
export class RecommendationsController {
    constructor(private readonly recommendationsService: RecommendationsService) { }

    @Get()
    async getRecommendations(
        @CurrentUser() user: any,
        @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    ) {
        return this.recommendationsService.getRecommendations(user.userId, limit || 10);
    }
}
