import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    async create(createUserDto: any): Promise<User> {
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

        const newUser = this.usersRepository.create({
            ...createUserDto,
            password: hashedPassword,
        } as User);

        return this.usersRepository.save(newUser);
    }

    async findByEmail(email: string): Promise<User | undefined> {
        const user = await this.usersRepository.findOne({ where: { email } });
        return user || undefined;
    }

    async updatePreferences(userId: number, preferences: { favorite_genres?: string[], favorite_authors?: string[], favorite_books?: string[] }) {
        const user = await this.usersRepository.findOne({
            where: { id: userId },
            relations: ['preferences'],
        });

        if (!user) {
            throw new Error('User not found');
        }

        if (!user.preferences) {
            user.preferences = this.usersRepository.manager.create('UserPreferences', {
                favorite_genres: preferences.favorite_genres || [],
                favorite_authors: preferences.favorite_authors || [],
                favorite_books: preferences.favorite_books || [],
            });
        } else {
            if (preferences.favorite_genres) {
                user.preferences.favorite_genres = preferences.favorite_genres;
            }
            if (preferences.favorite_authors) {
                user.preferences.favorite_authors = preferences.favorite_authors;
            }
            if (preferences.favorite_books) {
                user.preferences.favorite_books = preferences.favorite_books;
            }
        }

        await this.usersRepository.manager.save(user.preferences);
        return user;
    }
}
