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

    private normalizeGenre(genre: string): string {
        const genreMap: { [key: string]: string } = {
            'ficción': 'fiction',
            'fiction': 'fiction',
            'misterio': 'mystery',
            'mystery': 'mystery',
            'ciencia ficción': 'science fiction',
            'science fiction': 'science fiction',
            'fantasía': 'fantasy',
            'fantasy': 'fantasy',
            'romance': 'romance',
            'thriller': 'thriller',
            'biografía': 'biography',
            'biography': 'biography',
            'historia': 'history',
            'history': 'history',
            'autoayuda': 'self-help',
            'self-help': 'self-help',
            'negocios': 'business',
            'business': 'business',
            'poesía': 'poetry',
            'poetry': 'poetry',
            'terror': 'horror',
            'horror': 'horror',
            'aventura': 'adventure',
            'adventure': 'adventure',
            'filosofía': 'philosophy',
            'philosophy': 'philosophy',
            'ciencia': 'science',
            'science': 'science'
        };

        return genreMap[genre.toLowerCase()] || genre.toLowerCase();
    }

    // Check if book is recent (prefer books from last 15 years)
    private isRecentBook(book: any): boolean {
        const volumeInfo = book.volumeInfo || {};
        const publishedDate = volumeInfo.publishedDate;

        if (!publishedDate) {
            return false; // Prefer books with known publication dates
        }

        const year = parseInt(publishedDate.split('-')[0]);
        const currentYear = new Date().getFullYear();

        // Prefer books from 2010 onwards (last ~15 years)
        return year >= 2010 && year <= currentYear;
    }

    // Aggressive quality and popularity filtering
    private isQualityBook(book: any): boolean {
        const volumeInfo = book.volumeInfo || {};
        const title = volumeInfo.title || '';
        const titleLower = title.toLowerCase();

        // Must have title and authors
        if (!volumeInfo.title || !volumeInfo.authors || volumeInfo.authors.length === 0) {
            return false;
        }

        // Filter out obvious non-books by title keywords
        const badKeywords = [
            'journal', 'magazine', 'almanac', 'yearbook', 'digest', 'bulletin',
            'newsletter', 'catalog', 'directory', 'guide to periodical',
            'index', 'bibliography', 'abstract', 'proceedings', 'report',
            'bestsellers,', 'library journal', 'reader\'s guide', 'who shaped',
            'how i found', 'how to stop'
        ];

        for (const keyword of badKeywords) {
            if (titleLower.includes(keyword)) {
                return false;
            }
        }

        // Must have description
        if (!volumeInfo.description) {
            return false;
        }

        // Must have reasonable page count
        if (!volumeInfo.pageCount || volumeInfo.pageCount < 80) {
            return false;
        }

        // Must have ISBN
        if (!volumeInfo.industryIdentifiers || volumeInfo.industryIdentifiers.length === 0) {
            return false;
        }

        // POPULARITY FILTER: Prefer books with ratings but be lenient
        // Many good books don't have many ratings in Google Books API
        // So we'll prefer books with ratings but not require a high count
        const hasRatings = volumeInfo.ratingsCount && volumeInfo.ratingsCount > 0;
        const hasGoodRating = !volumeInfo.averageRating || volumeInfo.averageRating >= 3.0;

        // If it has ratings, check they're decent
        if (hasRatings && !hasGoodRating) {
            return false;
        }

        return true;
    }

    // More lenient filter for favorite authors - we trust user's taste
    private isQualityAuthorBook(book: any): boolean {
        const volumeInfo = book.volumeInfo || {};
        const title = volumeInfo.title || '';
        const titleLower = title.toLowerCase();

        // Must have title and authors
        if (!volumeInfo.title || !volumeInfo.authors || volumeInfo.authors.length === 0) {
            console.log(`Skipping book "${title}" by author due to missing title or authors.`);
            return false;
        }

        // Only filter out obvious non-books
        const badKeywords = ['journal', 'magazine', 'almanac', 'yearbook', 'digest', 'bulletin'];
        for (const keyword of badKeywords) {
            if (titleLower.includes(keyword)) {
                console.log(`Skipping book "${title}" by author due to bad keyword: ${keyword}.`);
                return false;
            }
        }

        // More lenient: just need description OR page count
        if (!volumeInfo.description && !volumeInfo.pageCount) {
            console.log(`Skipping book "${title}" by author due to missing description and page count.`);
            return false;
        }

        // Lower page requirement for favorite authors
        if (volumeInfo.pageCount && volumeInfo.pageCount < 30) {
            console.log(`Skipping book "${title}" by author due to low page count: ${volumeInfo.pageCount}.`);
            return false;
        }

        return true;
    }

    async getRecommendations(userId: number, limit: number = 10) {
        const user = await this.usersRepository.findOne({
            where: { id: userId },
            relations: ['preferences'],
        });

        if (!user) {
            throw new Error('User not found');
        }

        const userLibrary = await this.libraryService.getUserInteractions(userId);
        const userBookIds = userLibrary.map(interaction => interaction.book.google_id);

        const recommendations: any[] = [];
        const seenBookIds = new Set(userBookIds);

        const addBooks = (books: any[], reason: string) => {
            if (books && books.length > 0) {
                // Separate recent and older books
                const recentBooks: any[] = [];
                const olderBooks: any[] = [];

                for (const book of books) {
                    if (this.isQualityBook(book) && !seenBookIds.has(book.id)) {
                        if (this.isRecentBook(book)) {
                            recentBooks.push(book);
                        } else {
                            olderBooks.push(book);
                        }
                    }
                }

                // Add recent books first (priority)
                for (const book of recentBooks) {
                    if (recommendations.length < limit * 4) {
                        recommendations.push({ ...book, recommendationReason: reason });
                        seenBookIds.add(book.id);
                    }
                }

                // Then add older books if needed
                for (const book of olderBooks) {
                    if (recommendations.length < limit * 4) {
                        recommendations.push({ ...book, recommendationReason: reason });
                        seenBookIds.add(book.id);
                    }
                }
            }
        };

        // Special function for author books with more lenient filter
        const addAuthorBooks = (books: any[], reason: string) => {
            if (books && books.length > 0) {
                console.log(`Processing ${books.length} books from favorite author...`);
                let added = 0;

                // Separate recent and older books
                const recentBooks: any[] = [];
                const olderBooks: any[] = [];

                for (const book of books) {
                    if (this.isQualityAuthorBook(book) && !seenBookIds.has(book.id)) {
                        if (this.isRecentBook(book)) {
                            recentBooks.push(book);
                        } else {
                            olderBooks.push(book);
                        }
                    }
                }

                // Add recent books first (priority)
                for (const book of recentBooks) {
                    if (recommendations.length < limit * 4) {
                        recommendations.push({ ...book, recommendationReason: reason });
                        seenBookIds.add(book.id);
                        added++;
                        console.log(`Added recent book: "${book.volumeInfo?.title}" (${book.volumeInfo?.publishedDate})`);
                    }
                }

                // Then add older books if needed
                for (const book of olderBooks) {
                    if (recommendations.length < limit * 4) {
                        recommendations.push({ ...book, recommendationReason: reason });
                        seenBookIds.add(book.id);
                        added++;
                        console.log(`Added older book: "${book.volumeInfo?.title}" (${book.volumeInfo?.publishedDate})`);
                    }
                }

                console.log(`Added ${added} books from favorite author (${recentBooks.length} recent, ${olderBooks.length} older).`);
            }
        };

        // 1. PRIORITY: Search by favorite authors FIRST (most important)
        if (user.preferences?.favorite_authors && user.preferences.favorite_authors.length > 0) {
            for (const author of user.preferences.favorite_authors) {
                try {
                    console.log(`Searching for books by favorite author: ${author}`);
                    const offset = Math.floor(Math.random() * 5);

                    // Search in both English and Spanish
                    const queries = [
                        `inauthor:"${author}"`,
                        `inauthor:"${author}" language:es`,
                        `inauthor:"${author}" language:en`
                    ];

                    for (const query of queries) {
                        const result = await this.booksService.searchBooks(query, 30, offset);
                        console.log(`Found ${result.items?.length || 0} books for query: ${query}`);
                        addAuthorBooks(result.items || [], `Libros de ${author}`);
                    }
                } catch (error) {
                    console.error(`Error searching for author: ${author}`, error);
                }
            }
        }

        // 2. Search by favorite books
        if (user.preferences?.favorite_books && user.preferences.favorite_books.length > 0) {
            for (const bookTitle of user.preferences.favorite_books) {
                try {
                    const offset = Math.floor(Math.random() * 8);

                    // Search in both languages
                    const queries = [
                        `intitle:${bookTitle}`,
                        `intitle:${bookTitle} language:es`,
                        `intitle:${bookTitle} language:en`
                    ];

                    for (const query of queries) {
                        const result = await this.booksService.searchBooks(query, 15, offset);
                        addBooks(result.items || [], `Similar a "${bookTitle}"`);
                    }
                } catch (error) {
                    console.error(`Error searching for book: ${bookTitle}`, error);
                }
            }
        }

        // 3. Search by favorite genres (lower priority)
        if (user.preferences?.favorite_genres && user.preferences.favorite_genres.length > 0 && recommendations.length < limit) {
            for (const genre of user.preferences.favorite_genres) {
                try {
                    const normalizedGenre = this.normalizeGenre(genre);
                    const offset = Math.floor(Math.random() * 15);

                    // Search in both languages
                    const queries = [
                        `subject:${normalizedGenre} language:es`,
                        `subject:${normalizedGenre} language:en`,
                        `subject:${normalizedGenre}`
                    ];

                    for (const query of queries) {
                        const result = await this.booksService.searchBooks(query, 15, offset);
                        addBooks(result.items || [], `Libros de ${genre}`);
                    }
                } catch (error) {
                    console.error(`Error searching for genre: ${genre}`, error);
                }
            }
        }

        // 4. Fallback: bestsellers in main genre
        if (recommendations.length < limit) {
            try {
                const genre = user.preferences?.favorite_genres?.[0]
                    ? this.normalizeGenre(user.preferences.favorite_genres[0])
                    : 'fiction';

                const offset = Math.floor(Math.random() * 20);
                const result = await this.booksService.searchBooks(`subject:${genre}`, 40, offset);
                addBooks(result.items || [], 'Recomendado para ti');
            } catch (error) {
                console.error('Error in fallback search', error);
            }
        }

        // Sort by popularity (ratings count) before shuffling
        const sortedByPopularity = recommendations.sort((a, b) => {
            const ratingsA = a.volumeInfo?.ratingsCount || 0;
            const ratingsB = b.volumeInfo?.ratingsCount || 0;
            return ratingsB - ratingsA;
        });

        // Take top popular books and shuffle them
        const topBooks = sortedByPopularity.slice(0, limit * 2);
        const shuffled = topBooks.sort(() => Math.random() - 0.5).slice(0, limit);

        console.log(`Returning ${shuffled.length} popular recommendations for user ${userId}`);

        return {
            total: shuffled.length,
            recommendations: shuffled
        };
    }
}
