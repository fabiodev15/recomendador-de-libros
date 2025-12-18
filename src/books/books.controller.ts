import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { BooksService } from './books.service';
import { SearchBooksDto } from './dto/search-books.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('books')
@UseGuards(JwtAuthGuard)
export class BooksController {
    constructor(private readonly booksService: BooksService) { }

    @Get('search')
    async searchBooks(@Query() searchDto: SearchBooksDto) {
        return this.booksService.searchBooks(
            searchDto.q,
            searchDto.maxResults,
            searchDto.startIndex,
        );
    }

    @Get(':googleId')
    async getBookById(@Param('googleId') googleId: string) {
        return this.booksService.getBookByGoogleId(googleId);
    }
}
