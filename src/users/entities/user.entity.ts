import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { UserPreferences } from './user-preferences.entity';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @Column({ nullable: true })
    name: string;

    @Column('json', { nullable: true })
    profile_data: Record<string, any>;

    @OneToOne(() => UserPreferences, (prefs) => prefs.user, { cascade: true })
    @JoinColumn()
    preferences: UserPreferences;
}
