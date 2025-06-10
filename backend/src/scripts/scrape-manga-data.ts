import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch'; // Usamos node-fetch para compatibilidad, puedes probar con 'fetch' directamente si usas Node 18+
import * as cheerio from 'cheerio';

interface ScrapedChapter {
  name: string;
  release_date: string; // Formato YYYY-MM-DD
  pages: string[]; // Array de URLs de imágenes (serán placeholders)
  chapter_number: number;
}

interface ScrapedTitle {
  name: string;
  description: string;
  author: string;
  type: 'manga' | 'comic'; // Asumimos 'manga' para Manga Plus
  status: string; // 'Ongoing' o 'Completed'
  publication_date: string; // Formato YYYY-MM-DD
  image_url: string;
  category: string; // Una categoría simple (ej. 'Shonen', 'Seinen', 'Manga')
  genres: string[]; // Géneros asociados
  chapters: ScrapedChapter[];
}

const BASE_URL = 'https://mangaplus.shueisha.co.jp';
const ONGOING_LIST_URL = `${BASE_URL}/manga_list/ongoing`;
const OUTPUT_FILE_PATH = path.join(process.cwd(), 'scraped_manga_data.json');

async function scrapeMangaData() {
  const titles: ScrapedTitle[] = [];
  const processedTitles = new Set<string>(); // Para evitar duplicados si la página lista un manga varias veces

  try {
    console.log(
      `[SCRAPER] Obteniendo lista de mangas en curso de: ${ONGOING_LIST_URL}`,
    );
    const response = await fetch(ONGOING_LIST_URL);
    if (!response.ok) {
      throw new Error(
        `[SCRAPER] Fallo al obtener ${ONGOING_LIST_URL}: ${response.statusText}`,
      );
    }
    const html = await response.text();
    const $ = cheerio.load(html);

    // Selector para cada elemento de título en la lista principal
    const titleElements = $('.AllTitle-module_allTitle_1CIUC');

    for (const el of titleElements) {
      const titleName = $(el)
        .find('.AllTitle-module_title_20PzS')
        .text()
        .trim();

      if (processedTitles.has(titleName)) {
        console.log(`[SCRAPER] Saltando título duplicado: "${titleName}"`);
        continue;
      }
      processedTitles.add(titleName);

      const author = $(el).find('.AllTitle-module_author_2rV8i').text().trim();
      const relativeLink = $(el).attr('href');
      const imageUrl =
        $(el).find('.AllTitle-module_image_JIEI9').attr('data-src') ||
        $(el).find('.AllTitle-module_image_JIEI9').attr('src');
      const languages = $(el)
        .find('.AllTitle-module_lang_2Gl1c span')
        .map((_, span) => $(span).attr('title'))
        .get();

      if (!titleName || !relativeLink) {
        console.warn(
          `[SCRAPER] Saltando elemento por falta de título o enlace: ${$(el).html()}`,
        );
        continue;
      }

      const fullTitleUrl = `${BASE_URL}${relativeLink}`;
      console.log(
        `[SCRAPER]  Procesando detalles para: "${titleName}" de ${fullTitleUrl}`,
      );

      let description = 'Descripción no disponible.';
      let publicationDate = new Date().toISOString().split('T')[0]; // Fecha actual por defecto
      let status = 'Ongoing'; // Por defecto para la lista de "ongoing"
      let categories: string[] = ['Manga']; // Categoría base
      let genres: string[] = ['Shonen']; // Género predeterminado, pueden mejorar si se parsean más
      const scrapedChapters: ScrapedChapter[] = [];

      try {
        const detailResponse = await fetch(fullTitleUrl);
        if (!detailResponse.ok) {
          console.warn(
            `[SCRAPER]    Fallo al obtener la página de detalles para "${titleName}": ${detailResponse.statusText}`,
          );
        } else {
          const detailHtml = await detailResponse.text();
          const $$ = cheerio.load(detailHtml);

          // Extraer descripción (basado en selectores comunes en páginas de detalles de Manga Plus)
          const descriptionElement = $$(
            '.TitleDetail-module_description_1vS8O p',
          ).first();
          if (descriptionElement.length) {
            description = descriptionElement.text().trim();
          } else {
            // Intenta de otra meta descripción como fallback
            const fallbackDesc = $$('meta[name="description"]').attr('content');
            if (fallbackDesc) {
              description = fallbackDesc;
            }
          }

          // Extraer el estado del manga (ej. "Ongoing", "Completed")
          const statusElement = $$('.TitleDetail-module_status_3Jj5Y')
            .text()
            .trim(); // Selector de ejemplo
          if (statusElement) {
            status = statusElement.includes('Completed')
              ? 'Completed'
              : 'Ongoing';
          }

          // Extraer fecha de publicación si disponible (suele estar en el mismo bloque del status o description)
          // Esto es muy dependiente de la estructura. Default a la fecha actual si no se encuentra.
          const releaseDateElement = $$(
            '.TitleDetail-module_metaData_2xO4M p:contains("Release Date")',
          )
            .text()
            .trim(); // Selector de ejemplo
          if (releaseDateElement) {
            const dateMatch = releaseDateElement.match(/\d{4}-\d{2}-\d{2}/);
            if (dateMatch) {
              publicationDate = dateMatch[0];
            }
          }

          // Extraer capítulos de la página de detalles
          const chapterElements = $$('.ChapterListItem-module_container_1wX3a');
          chapterElements.each((i, chapEl) => {
            const chapterTitle = $$(chapEl)
              .find('.ChapterListItem-module_title_1lK8Y')
              .text()
              .trim();
            const chapterNumberText = $$(chapEl)
              .find('.ChapterListItem-module_chapterNumber_2g8J6')
              .text()
              .trim();
            const chapterNumberMatch = chapterNumberText.match(/(\d+)$/); // Extrae el número al final
            const chapterNumber = chapterNumberMatch
              ? parseInt(chapterNumberMatch[1], 10)
              : i + 1;

            // Generar URLs de páginas dummy (placeholders)
            const dummyPages: string[] = [];
            for (let p = 1; p <= 5; p++) {
              // 5 páginas dummy por capítulo
              dummyPages.push(
                `https://placehold.co/800x1200/cccccc/333333?text=${titleName.replace(/ /g, '+')}+C${chapterNumber}+P${p}`,
              );
            }

            scrapedChapters.push({
              name: chapterTitle || `Capítulo ${chapterNumber}`,
              release_date: publicationDate, // O la fecha específica del capítulo si se puede extraer
              pages: dummyPages,
              chapter_number: chapterNumber,
            });
          });

          // Ordenar capítulos por número de capítulo
          scrapedChapters.sort((a, b) => a.chapter_number - b.chapter_number);
        }
      } catch (detailError) {
        console.error(
          `[SCRAPER]    Error al procesar página de detalles para "${titleName}":`,
          detailError.message,
        );
      }

      titles.push({
        name: titleName,
        description: description,
        author: author,
        type: 'manga',
        status: status,
        publication_date: publicationDate,
        image_url:
          imageUrl ||
          'https://placehold.co/400x600/000000/ffffff?text=No+Image',
        category: categories[0],
        genres: genres, // Para simplificar, estamos usando una lista de géneros predeterminada
        chapters: scrapedChapters,
      });

      // Añadir un pequeño retraso para evitar sobrecargar el servidor de Manga Plus
      await new Promise((resolve) => setTimeout(resolve, 500)); // 500ms de retraso
    }

    // Escribir los datos en un archivo JSON
    fs.writeFileSync(OUTPUT_FILE_PATH, JSON.stringify(titles, null, 2), 'utf8');
    console.log(
      `[SCRAPER] Se extrajeron ${titles.length} títulos y se guardaron en ${OUTPUT_FILE_PATH}`,
    );
  } catch (error) {
    console.error(
      '[SCRAPER] Error durante el proceso de extracción:',
      error.message,
    );
  }
}

scrapeMangaData();
