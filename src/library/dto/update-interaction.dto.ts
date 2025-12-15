import { IsEnum } from 'class-validator';
import { InteractionStatus } from '../entities/interaction.entity';

export class UpdateInteractionDto {
    @IsEnum(InteractionStatus)
    status: InteractionStatus;
}
