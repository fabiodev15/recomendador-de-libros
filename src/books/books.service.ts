import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book } from './entities/book.entity';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class BooksService {
    private readonly OPEN_LIBRARY_API = 'https://openlibrary.org';

    constructor(
        private httpService: HttpService,
        @InjectRepository(Book)
        private booksRepository: Repository<Book>,
    ) { }

    async searchBooks(query: string, limit: number = 10, offset: number = 0) {
        try {
            // Open Library search endpoint
            const url = `${this.OPEN_LIBRARY_API}/search.json`;
            const params = {
                q: query,
                limit: limit,
                offset: offset,
                fields: 'key,title,author_name,cover_i,first_publish_year,isbn,number_of_pages_median,ratings_average,ratings_count,subject'
            };

            const response = await firstValueFrom(
                this.httpService.get(url, { params })
            );

            
            const transformedDocs = response.data.docs.map(doc => ({
                id: doc.key?.replace('/works/', '') || `ol-${Math.random()}`,
                volumeInfo: {
                    title: doc.title,
                    authors: doc.author_name || [],
                    description: `Published in ${doc.first_publish_year || 'unknown'}`,
                    imageLinks: {
                        thumbnail: doc.cover_i
                            ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
                            : null
                    },
                    pageCount: doc.number_of_pages_median || null,
                    averageRating: doc.ratings_average || null,
                    ratingsCount: doc.ratings_count || null,
                    industryIdentifiers: doc.isbn ? [{ type: 'ISBN', identifier: doc.isbn[0] }] : [],
                    categories: doc.subject?.slice(0, 3) || [],
                    infoLink: `https://openlibrary.org${doc.key}`
                }
            }));

            return {
                items: transformedDocs,
                totalItems: response.data.numFound
            };
        } catch (error) {
            console.error('Error searching Open Library:', error.message);
            return { items: [], totalItems: 0 };
        }
    }

    async getBookByGoogleId(googleId: string) {
        // Check if book exists in database
        const existingBook = await this.booksRepository.findOne({
            where: { google_id: googleId },
        });

        if (existingBook) {
            return existingBook;
        }

        // Fetch from Open Library
        try {
            const url = `${this.OPEN_LIBRARY_API}/works/${googleId}.json`;
            const response = await firstValueFrom(this.httpService.get(url));
            const data = response.data;

            // Transform and save
            const bookData: Partial<Book> = {
                google_id: googleId,
                title: data.title || 'Unknown',
                author: data.authors?.[0]?.author?.key || 'Unknown',
                cover_url: (data.covers?.[0]
                    ? `https://covers.openlibrary.org/b/id/${data.covers[0]}-L.jpg`
                    : null) || undefined
            };

            const book = this.booksRepository.create(bookData);
            return await this.booksRepository.save(book);
        } catch (error) {
            throw new HttpException('Book not found', HttpStatus.NOT_FOUND);
        }
    }

    async saveBook(googleId: string, title: string, author: string, coverUrl: string) {
        const existingBook = await this.booksRepository.findOne({
            where: { google_id: googleId },
        });

        if (existingBook) {
            return existingBook;
        }

        const bookData: Partial<Book> = {
            google_id: googleId,
            title,
            author,
            cover_url: coverUrl,
        };

        const book = this.booksRepository.create(bookData);
        return await this.booksRepository.save(book);
    }
}
