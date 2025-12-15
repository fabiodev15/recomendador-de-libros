import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { Book } from './entities/book.entity';
import { GoogleBooksResponseDto, GoogleBookDto } from './dto/google-books.dto';

@Injectable()
export class BooksService {
    private readonly GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';

    constructor(
        private readonly httpService: HttpService,
        @InjectRepository(Book)
        private booksRepository: Repository<Book>,
    ) { }

    async searchBooks(query: string, maxResults: number = 10, startIndex: number = 0) {
        try {
            const url = `${this.GOOGLE_BOOKS_API}?q=${encodeURIComponent(query)}&maxResults=${maxResults}&startIndex=${startIndex}`;

            const response = await firstValueFrom(
                this.httpService.get<GoogleBooksResponseDto>(url)
            );

            return response.data;
        } catch (error) {
            throw new HttpException(
                'Error fetching books from Google Books API',
                HttpStatus.BAD_GATEWAY,
            );
        }
    }

    async getBookById(googleId: string) {
        // First check if book exists in local database
        const cachedBook = await this.booksRepository.findOne({
            where: { google_id: googleId },
        });

        if (cachedBook) {
            return cachedBook;
        }

        // If not in cache, fetch from Google Books API
        try {
            const url = `${this.GOOGLE_BOOKS_API}/${googleId}`;
            const response = await firstValueFrom(
                this.httpService.get<GoogleBookDto>(url)
            );

            const bookData = response.data;

            // Save to database for caching
            const book = await this.saveBook(bookData);
            return book;
        } catch (error) {
            throw new HttpException(
                'Book not found',
                HttpStatus.NOT_FOUND,
            );
        }
    }

    async saveBook(googleBookData: GoogleBookDto): Promise<Book> {
        const { id, volumeInfo } = googleBookData;

        // Check if book already exists
        let book = await this.booksRepository.findOne({
            where: { google_id: id },
        });

        if (book) {
            return book;
        }

        // Create new book entry
        book = this.booksRepository.create({
            google_id: id,
            title: volumeInfo.title,
            author: volumeInfo.authors?.join(', ') || 'Unknown',
            cover_url: volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail,
        });

        return this.booksRepository.save(book);
    }
}
