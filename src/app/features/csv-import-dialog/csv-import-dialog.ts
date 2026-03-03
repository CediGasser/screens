import { Component, ElementRef, output, signal, viewChild } from '@angular/core';
import { CsvDevicesValidator } from '../../services/csv-devices-validator';
import { CsvParser } from '../../services/csv-parser';
import { DeviceFormData, DevicesApi } from '../../services/devices-api';

@Component({
  selector: 'app-csv-import-dialog',
  template: `
    <dialog #dialog>
      <header>
        <h2>Import Suggested Devices from CSV</h2>
      </header>

      <div class="csv-import-content">
        <p>Required CSV headers (in this exact format):</p>
        <pre>{{ requiredCsvFormat }}</pre>

        <label>
          CSV file:
          <input type="file" accept=".csv,text/csv" (change)="onCsvFileSelected($event)" />
        </label>

        @if (csvImportErrors().length > 0) {
          <div class="errors">
            <strong>CSV errors</strong>
            <ul>
              @for (error of csvImportErrors(); track error) {
                <li>{{ error }}</li>
              }
            </ul>
          </div>
        }

        @if (validationErrors().length > 0) {
          <div class="errors">
            <strong>Validation errors</strong>
            <ul>
              @for (error of validationErrors(); track error) {
                <li>{{ error }}</li>
              }
            </ul>
          </div>
        }

        @if (csvImportSuccessMessage(); as successMessage) {
          <p class="csv-success">{{ successMessage }}</p>
        }
      </div>

      <div class="csv-import-actions">
        <button type="button" class="secondary" (click)="close()">Cancel</button>
        <button
          type="button"
          [disabled]="validatedData.length === 0 || csvImportInProgress()"
          (click)="importDevices()"
        >
          {{ csvImportInProgress() ? 'Importing...' : 'Import CSV' }}
        </button>
      </div>
    </dialog>
  `,
  styleUrl: './csv-import-dialog.css',
})
export class CsvImportDialog {
  importSuccess = output<number>();

  protected dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  protected selectedCsvFile = signal<File | null>(null);
  protected csvImportErrors = signal<string[]>([]);
  protected csvImportSuccessMessage = signal<string | null>(null);
  protected csvImportInProgress = signal(false);
  protected validationErrors = signal<string[]>([]);
  protected requiredCsvFormat =
    'manufacturer,name,type,releaseDate,screenSize,screenPixelWidth,screenPixelHeight,screenCornerRadius';
  protected validatedData: DeviceFormData[] = [];

  constructor(
    private devicesApi: DevicesApi,
    private csvParser: CsvParser,
    private csvDevicesValidator: CsvDevicesValidator,
  ) {}

  open() {
    this.selectedCsvFile.set(null);
    this.csvImportErrors.set([]);
    this.csvImportSuccessMessage.set(null);
    this.dialog().nativeElement.showModal();
  }

  close() {
    this.dialog().nativeElement.close();
  }

  async onCsvFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedCsvFile.set(file);
    this.validatedData = [];
    this.csvImportErrors.set([]);
    this.validationErrors.set([]);
    this.csvImportSuccessMessage.set(null);

    if (!file) {
      return;
    }

    try {
      const parsedRows = await this.csvParser.parseFileToJson(file);
      const validationResult = this.csvDevicesValidator.validate(parsedRows);

      if (validationResult.errors.length > 0) {
        this.validationErrors.set(validationResult.errors);
        return;
      }

      this.validatedData = validationResult.devices;
      this.csvImportSuccessMessage.set(
        `CSV validated. Ready to import ${this.validatedData.length} devices.`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown CSV parsing error';
      this.csvImportErrors.set([message]);
    }
  }

  importDevices() {
    if (this.validatedData.length === 0) {
      return;
    }

    this.csvImportInProgress.set(true);
    this.devicesApi.bulkCreateDevices(this.validatedData).subscribe({
      next: (createdDevices) => {
        this.csvImportSuccessMessage.set(`Successfully imported ${createdDevices.length} devices.`);
        this.importSuccess.emit(createdDevices.length);
        this.csvImportInProgress.set(false);
        this.close();
      },
      error: (error) => {
        this.csvImportErrors.set([`Failed to import devices: ${error.message}`]);
        this.csvImportInProgress.set(false);
      },
    });
  }
}
