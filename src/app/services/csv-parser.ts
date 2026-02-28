import { Injectable } from '@angular/core';
import Papa, { ParseError } from 'papaparse';

export interface CsvParserOptions {
  delimiter?: string;
  skipEmptyLines?: boolean | 'greedy';
  trimHeaders?: boolean;
  trimValues?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class CsvParser {
  parseFileToJson<T extends Record<string, unknown> = Record<string, string>>(
    file: File,
    options: CsvParserOptions = {},
  ): Promise<T[]> {
    if (!(file instanceof File)) {
      return Promise.reject(new Error('A valid CSV file must be provided'));
    }

    const config = this.buildConfig(options);

    return new Promise<T[]>((resolve, reject) => {
      Papa.parse<T>(file, {
        header: true,
        skipEmptyLines: config.skipEmptyLines,
        delimiter: config.delimiter,
        transformHeader: config.trimHeaders ? (header) => header.trim() : undefined,
        transform: config.trimValues ? (value) => value.trim() : undefined,
        complete: (result) => {
          if (result.errors.length > 0) {
            reject(this.toParseError(result.errors));
            return;
          }

          const rows = result.data.filter((row) => this.hasAnyValue(row));
          resolve(rows);
        },
        error: (error) => {
          reject(new Error(`Failed to parse CSV file: ${error.message}`));
        },
      });
    });
  }

  private hasAnyValue(row: Record<string, unknown>) {
    return Object.values(row).some((value) => {
      if (typeof value === 'string') {
        return value.trim().length > 0;
      }
      return value != null;
    });
  }

  private toParseError(errors: ParseError[]) {
    const details = errors
      .slice(0, 3)
      .map((error) => {
        const rowInfo = typeof error.row === 'number' ? `row ${error.row + 1}` : 'unknown row';
        return `${rowInfo}: ${error.message}`;
      })
      .join('; ');

    return new Error(`CSV parsing failed: ${details}`);
  }

  private buildConfig(options: CsvParserOptions): Required<CsvParserOptions> {
    return {
      delimiter: options.delimiter ?? ',',
      skipEmptyLines: options.skipEmptyLines ?? 'greedy',
      trimHeaders: options.trimHeaders ?? true,
      trimValues: options.trimValues ?? true,
    };
  }
}
