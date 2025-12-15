import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Book {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    google_id: string;

    @Column()
    title: string;

    @Column({ nullable: true })
    author: string;

    @Column({ nullable: true })
    cover_url: string;
}
