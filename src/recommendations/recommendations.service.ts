import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { BooksService } from '../books/books.service';
import { LibraryService } from '../library/library.service';

@Injectable()
export class RecommendationsService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private booksService: BooksService,
        private libraryService: LibraryService,
    ) { }

    async getRecommendations(userId: number, limit: number = 10) {
        // 1. Get user with preferences
        const user = await this.usersRepository.findOne({
            where: { id: userId },
            relations: ['preferences'],
        });

        if (!user) {
            throw new Error('User not found');
        }

        // 2. Get user's library to exclude already added books
        const userLibrary = await this.libraryService.getUserInteractions(userId);
        const userBookIds = userLibrary.map(interaction => interaction.book.google_id);

        const recommendations = [];
        const seenBookIds = new Set(userBookIds);

        // 3. Search based on favorite genres
        if (user.preferences?.favorite_genres && user.preferences.favorite_genres.length > 0) {
            for (const genre of user.preferences.favorite_genres.slice(0, 3)) {
                try {
                    const genreBooks = await this.booksService.searchBooks(
                        `subject:${genre}`,
                        5,
                        0
                    );

                    if (genreBooks.items) {
                        for (const book of genreBooks.items) {
                            if (!seenBookIds.has(book.id) && recommendations.length < limit) {
                                recommendations.push({
                                    ...book,
                                    recommendationReason: `Based on your interest in ${genre}`
                                });
                                seenBookIds.add(book.id);
                            }
                        }
                    }
                } catch (error) {
                    // Continue if search fails
                }
            }
        }

        // 4. Search based on favorite authors
        if (user.preferences?.favorite_authors && user.preferences.favorite_authors.length > 0 && recommendations.length < limit) {
            for (const author of user.preferences.favorite_authors.slice(0, 2)) {
                try {
                    const authorBooks = await this.booksService.searchBooks(
                        `inauthor:${author}`,
                        5,
                        0
                    );

                    if (authorBooks.items) {
                        for (const book of authorBooks.items) {
                            if (!seenBookIds.has(book.id) && recommendations.length < limit) {
                                recommendations.push({
                                    ...book,
                                    recommendationReason: `Books by ${author}`
                                });
                                seenBookIds.add(book.id);
                            }
                        }
                    }
                } catch (error) {
                    // Continue if search fails
                }
            }
        }

        // 5. If still need more recommendations, add popular books
        if (recommendations.length < limit) {
            try {
                const popularBooks = await this.booksService.searchBooks(
                    'bestseller',
                    limit - recommendations.length,
                    0
                );

                if (popularBooks.items) {
                    for (const book of popularBooks.items) {
                        if (!seenBookIds.has(book.id) && recommendations.length < limit) {
                            recommendations.push({
                                ...book,
                                recommendationReason: 'Popular choice'
                            });
                            seenBookIds.add(book.id);
                        }
                    }
                }
            } catch (error) {
                // Continue if search fails
            }
        }

        return {
            total: recommendations.length,
            recommendations: recommendations.slice(0, limit)
        };
    }
}
