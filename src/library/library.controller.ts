import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { LibraryService } from './library.service';
import { CreateInteractionDto } from './dto/create-interaction.dto';
import { UpdateInteractionDto } from './dto/update-interaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { InteractionStatus } from './entities/interaction.entity';

@Controller('library')
@UseGuards(JwtAuthGuard)
export class LibraryController {
    constructor(private readonly libraryService: LibraryService) { }

    @Post()
    async addInteraction(
        @CurrentUser() user: any,
        @Body() createInteractionDto: CreateInteractionDto,
    ) {
        return this.libraryService.addInteraction(
            user.userId,
            createInteractionDto.googleBookId,
            createInteractionDto.status,
        );
    }

    @Get()
    async getUserInteractions(
        @CurrentUser() user: any,
        @Query('status') status?: InteractionStatus,
    ) {
        return this.libraryService.getUserInteractions(user.userId, status);
    }

    @Patch(':id')
    async updateInteraction(
        @CurrentUser() user: any,
        @Param('id', ParseIntPipe) id: number,
        @Body() updateInteractionDto: UpdateInteractionDto,
    ) {
        return this.libraryService.updateInteraction(
            id,
            user.userId,
            updateInteractionDto.status,
        );
    }

    @Delete(':id')
    async deleteInteraction(
        @CurrentUser() user: any,
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.libraryService.deleteInteraction(id, user.userId);
    }
}
