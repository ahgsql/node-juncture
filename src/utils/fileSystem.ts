import fs from "fs";
import path from "path";
import trash from 'trash';

/**
 * Belirtilen bir klasördeki dosyaların listesini döndürür.
 * @param folderPath - Dosyaların listeleneceği klasörün yolu.
 * @returns Klasördeki dosyaların yollarını içeren bir string dizisi.
 */
export function getFilesInFolder(folderPath: string): string[] {
    return fs
        .readdirSync(folderPath)
        .map((file) => path.join(folderPath, file));
}

/**
 * Belirtilen yolda bir klasör oluşturur.
 * @param folderPath - Oluşturulacak klasörün yolu.
 */
export function createFolder(folderPath: string): void {
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }
}

/**
 * Bir dosya veya klasörü yeni bir konuma taşır.
 * @param sourcePath - Taşınacak dosya veya klasörün yolu.
 * @param destinationPath - Hedef yol.
 */
export function movePath(sourcePath: string, destinationPath: string): void {
    try {
        fs.renameSync(sourcePath, destinationPath);
    } catch (error) {
        console.error(`Hata: ${sourcePath} taşınamadı -> ${destinationPath}`, error);
        throw error;
    }
}

/**
 * Belirtilen bir dosya veya klasörü sistemin çöp kutusuna taşır.
 * @param path - Silinecek dosya veya klasörün yolu (veya yolları).
 */
export async function deletePath(path: string | readonly string[]): Promise<void> {
    await trash(path);
}
