import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Interaction, InteractionStatus } from './entities/interaction.entity';
import { BooksService } from '../books/books.service';

@Injectable()
export class LibraryService {
    constructor(
        @InjectRepository(Interaction)
        private interactionRepository: Repository<Interaction>,
        private booksService: BooksService,
    ) { }

    async addInteraction(userId: number, googleBookId: string, status: InteractionStatus) {
        // First, get or create the book
        const book = await this.booksService.getBookByGoogleId(googleBookId);

        // Check if interaction already exists
        const existingInteraction = await this.interactionRepository.findOne({
            where: {
                user: { id: userId },
                book: { id: book.id },
            },
        });

        if (existingInteraction) {
            // Update existing interaction
            existingInteraction.status = status;
            return this.interactionRepository.save(existingInteraction);
        }

        // Create new interaction
        const interaction = this.interactionRepository.create({
            user: { id: userId },
            book: { id: book.id },
            status,
        });

        return this.interactionRepository.save(interaction);
    }

    async getUserInteractions(userId: number, status?: InteractionStatus) {
        const query = this.interactionRepository
            .createQueryBuilder('interaction')
            .leftJoinAndSelect('interaction.book', 'book')
            .leftJoinAndSelect('interaction.user', 'user')
            .where('user.id = :userId', { userId });

        if (status) {
            query.andWhere('interaction.status = :status', { status });
        }

        return query.getMany();
    }

    async updateInteraction(interactionId: number, userId: number, status: InteractionStatus) {
        const interaction = await this.interactionRepository.findOne({
            where: { id: interactionId },
            relations: ['user'],
        });

        if (!interaction) {
            throw new NotFoundException('Interaction not found');
        }

        if (interaction.user.id !== userId) {
            throw new ForbiddenException('You can only update your own interactions');
        }

        interaction.status = status;
        return this.interactionRepository.save(interaction);
    }

    async deleteInteraction(interactionId: number, userId: number) {
        const interaction = await this.interactionRepository.findOne({
            where: { id: interactionId },
            relations: ['user'],
        });

        if (!interaction) {
            throw new NotFoundException('Interaction not found');
        }

        if (interaction.user.id !== userId) {
            throw new ForbiddenException('You can only delete your own interactions');
        }

        await this.interactionRepository.remove(interaction);
        return { message: 'Interaction deleted successfully' };
    }
}
