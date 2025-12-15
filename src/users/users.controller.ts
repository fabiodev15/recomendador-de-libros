import { Controller, Patch, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Patch('preferences')
    async updatePreferences(
        @CurrentUser() user: any,
        @Body() updatePreferencesDto: UpdatePreferencesDto,
    ) {
        return this.usersService.updatePreferences(user.userId, updatePreferencesDto);
    }
}
