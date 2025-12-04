import { fs } from '@server/libs/file-system-manipulate';
import { Options as CsvParseOptions, parse } from 'csv-parse';

async function parseCsvFile(path: string, options?: CsvParseOptions): Promise<any[]> {
  return new Promise<(string | number)[]>((resolve, reject) => {
    const results: any[] = [];
    fs.createReadStream(path)
      .pipe(
        parse({
          skip_empty_lines: true, // Skip empty lines
          skip_records_with_empty_values: true,
          columns: true, // Automatically map rows to objects using headers
          ...options,
        }),
      )
      .on('data', (row) => {
        // maybe: Validate headers or process each row
        results.push(row);
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

export async function parseCsv(
  path: string,
  options?: CsvParseOptions,
): Promise<string[][]> {
  return parseCsvFile(path, {
    ...options,
    columns: false,
  });
}

export async function parseCsvToObjects<T>(
  path: string,
  options?: CsvParseOptions,
): Promise<T[]> {
  return parseCsvFile(path, { ...options, columns: true });
}

export async function getCsvHeaders(content: string[][] | object[]) {
  if (Array.isArray(content) && content.length > 0) {
    if (typeof content[0] === 'object') {
      return Object.keys(content[0]);
    } else {
      return content[0];
    }
  }
  return [];
}
