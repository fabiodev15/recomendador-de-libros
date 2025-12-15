import { IsString, IsEnum } from 'class-validator';
import { InteractionStatus } from '../entities/interaction.entity';

export class CreateInteractionDto {
    @IsString()
    googleBookId: string;

    @IsEnum(InteractionStatus)
    status: InteractionStatus;
}
