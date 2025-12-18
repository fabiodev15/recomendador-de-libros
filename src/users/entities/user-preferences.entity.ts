import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class UserPreferences {
    @PrimaryGeneratedColumn()
    id: number;

    @OneToOne(() => User, (user) => user.preferences)
    user: User;

    @Column('simple-array', { nullable: true })
    favorite_genres: string[];

    @Column('simple-array', { nullable: true })
    favorite_authors: string[];

    @Column('simple-array', { nullable: true })
    favorite_books: string[];
}
