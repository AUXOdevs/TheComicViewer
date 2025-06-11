// src/scripts/generate-comic-data.ts

import { v4 as uuidv4 } from 'uuid'; // Para generar UUIDs
import * as fs from 'fs';
import * as path from 'path';

// Interfaces que representan la estructura de los datos que se generarán para el seeder
interface GeneratedTitle {
  title_id: string;
  name: string;
  description: string;
  author: string;
  type: 'comic' | 'manga';
  status: string;
  publication_date: string; // ISO 8601 string
  image_url: string;
  category: string;
  genres: string[]; // Nombres de los géneros para sembrar TitleGenre
  chapters: GeneratedChapter[];
}

interface GeneratedChapter {
  chapter_id: string;
  name: string;
  release_date: string; // ISO 8601 string
  pages: string[]; // Array de URLs de imágenes
  chapter_number: number;
}

const AUTHORS = [
  'Frank Miller',
  'Mark Millar',
  'Geoff Johns',
  'Grant Morrison',
  'Scott Snyder',
  'Charles Soule',
  'Jonathan Hickman',
  'Matt Fraction',
  'Brian K. Vaughan',
  'Eiichiro Oda',
  'Masashi Kishimoto',
  'Tite Kubo',
  'Akira Toriyama',
  'Kohei Horikoshi',
  'Hajime Isayama',
  'Koyoharu Gotouge',
  'Gege Akutami',
  'Kentaro Miura',
  'Naoki Urasawa',
  'Takehiko Inoue',
  'Sui Ishida',
  'Kugane Maruyama',
  'Aneko Yusagi',
  'Yuu Kamiya',
  'Tappei Nagatsuki',
  'Yūki Tabata',
  'Yoshihiro Togashi',
];

const GENRES = [
  'Action',
  'Adventure',
  'Fantasy',
  'Sci-Fi',
  'Romance',
  'Comedy',
  'Drama',
  'Thriller',
  'Horror',
  'Mystery',
  'Slice of Life',
  'Sports',
  'Supernatural',
  'Martial Arts',
  'Historical',
  'Psychological',
  'Mecha',
  'Isekai',
  'Harem',
  'School',
  'Post-apocalyptic',
  'Crime',
  'Magic',
  'Mythology',
  'Espionage',
  'Political',
  'Dark Fantasy',
];

const COMIC_CATEGORIES = [
  'DC',
  'Marvel',
  'Image',
  'Dark Horse',
  'IDW',
  'Indie',
];
const MANGA_CATEGORIES = [
  'Shonen',
  'Shojo',
  'Seinen',
  'Josei',
  'Kodomomuke',
  'Isekai',
  'Slice of Life',
  'Webtoon',
  'Manhwa',
  'Manhua',
];

const STATUSES = ['Ongoing', 'Completed', 'Hiatus', 'Canceled'];

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomDate(start: Date, end: Date): string {
  const date = new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
  return date.toISOString(); // Formato ISO 8601
}

function generateData(numTitles: number = 100): GeneratedTitle[] {
  const titles: GeneratedTitle[] = [];
  const today = new Date();
  const tenYearsAgo = new Date(
    today.getFullYear() - 10,
    today.getMonth(),
    today.getDate(),
  );
  const oneYearAgo = new Date(
    today.getFullYear() - 1,
    today.getMonth(),
    today.getDate(),
  );

  for (let i = 0; i < numTitles; i++) {
    const titleType = Math.random() < 0.6 ? 'manga' : 'comic'; // Más mangas para variar
    const titleName = `${titleType === 'comic' ? 'Comic' : 'Manga'} Title ${i + 1}`;
    const description = `This is a compelling ${titleType} about ${Math.random() < 0.5 ? 'heroes fighting villains' : 'a journey of self-discovery'}. It explores themes of ${['friendship', 'justice', 'revenge', 'love', 'survival'][getRandomInt(0, 4)]}.`;
    const author = AUTHORS[getRandomInt(0, AUTHORS.length - 1)];
    const status = STATUSES[getRandomInt(0, STATUSES.length - 1)];
    const publicationDate = getRandomDate(tenYearsAgo, today);
    const category =
      titleType === 'comic'
        ? COMIC_CATEGORIES[getRandomInt(0, COMIC_CATEGORIES.length - 1)]
        : MANGA_CATEGORIES[getRandomInt(0, MANGA_CATEGORIES.length - 1)];

    const title: GeneratedTitle = {
      title_id: uuidv4(),
      name: titleName,
      description: description,
      author: author,
      type: titleType,
      status: status,
      publication_date: publicationDate,
      image_url: `https://placehold.co/400x600/aabbcc/ffffff?text=${titleName.replace(/ /g, '+')}`,
      category: category,
      genres: Array.from(
        new Set(
          Array.from(
            { length: getRandomInt(1, 3) },
            () => GENRES[getRandomInt(0, GENRES.length - 1)],
          ),
        ),
      ), // 1 to 3 unique genres
      chapters: [],
    };

    const numChapters = getRandomInt(10, 50); // 10 to 50 chapters per title
    for (let j = 0; j < numChapters; j++) {
      const chapterName = `Chapter ${j + 1}: The ${['Beginning', 'Unraveling', 'Climax', 'Resolution', 'Challenge', 'Confrontation'][getRandomInt(0, 5)]}`;
      const releaseDate = getRandomDate(oneYearAgo, today);

      const numPagesInChapter = getRandomInt(15, 40); // 15 to 40 pages per chapter
      const pages: string[] = Array.from(
        { length: numPagesInChapter },
        (_, p) =>
          `https://placehold.co/800x1200/cccccc/333333?text=${titleName.replace(/ /g, '+')}+Chap+${j + 1}+Page+${p + 1}`,
      );

      const chapter: GeneratedChapter = {
        chapter_id: uuidv4(),
        name: chapterName,
        release_date: releaseDate,
        pages: pages,
        chapter_number: j + 1,
      };
      title.chapters.push(chapter);
    }
    titles.push(title);
  }
  return titles;
}

const outputPath = path.join(process.cwd(), 'initial_comic_data.json');
const data = generateData(100);

fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
console.log(`Generated ${data.length} titles and saved to ${outputPath}`);
