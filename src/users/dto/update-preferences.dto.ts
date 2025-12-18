import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdatePreferencesDto {
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    favorite_genres?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    favorite_authors?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    favorite_books?: string[];
}
