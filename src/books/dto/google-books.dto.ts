export interface VolumeInfo {
    title: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    description?: string;
    pageCount?: number;
    categories?: string[];
    imageLinks?: {
        thumbnail?: string;
        smallThumbnail?: string;
    };
    language?: string;
    previewLink?: string;
    infoLink?: string;
}

export interface GoogleBookDto {
    id: string;
    volumeInfo: VolumeInfo;
}

export interface GoogleBooksResponseDto {
    kind: string;
    totalItems: number;
    items?: GoogleBookDto[];
}
