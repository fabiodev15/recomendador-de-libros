import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Book } from '../../books/entities/book.entity';

export enum InteractionStatus {
    INTERESTED = 'INTERESTED',
    NOT_INTERESTED = 'NOT_INTERESTED',
    READ = 'READ',
}

@Entity()
export class Interaction {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Book)
    @JoinColumn({ name: 'book_id' })
    book: Book;

    @Column({
        type: 'enum',
        enum: InteractionStatus,
    })
    status: InteractionStatus;
}
