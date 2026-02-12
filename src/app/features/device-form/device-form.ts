import { Component, input, output, signal, effect } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { form, FormField, required, min } from '@angular/forms/signals';
import { FormFieldError } from '../../components/form-field-error/form-field-error';
import { Device, DeviceFormData } from '../../services/devices-api';

export type DeviceType = Device['type'];

export const DEVICE_TYPES: DeviceType[] = [
  'smartphone',
  'tablet',
  'laptop',
  'desktop',
  'wearable',
  'other',
];

@Component({
  selector: 'app-device-form',
  imports: [FormField, FormFieldError, TitleCasePipe],
  template: `
    <form (submit)="onSubmit($event)">
      <div class="form-row">
        <div class="form-group">
          <label for="manufacturer"
            >Manufacturer
            <input id="manufacturer" [formField]="deviceForm.manufacturer" />
          </label>
          <app-form-field-error [fieldState]="deviceForm.manufacturer()"></app-form-field-error>
        </div>

        <div class="form-group">
          <label for="name"
            >Device Name
            <input id="name" [formField]="deviceForm.name" />
          </label>
          <app-form-field-error [fieldState]="deviceForm.name()"></app-form-field-error>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="type"
            >Type
            <select id="type" [formField]="deviceForm.type">
              @for (type of deviceTypes; track type) {
                <option [value]="type">{{ type | titlecase }}</option>
              }
            </select>
          </label>
          <app-form-field-error [fieldState]="deviceForm.type()"></app-form-field-error>
        </div>

        <div class="form-group">
          <label for="releaseDate"
            >Release Date
            <input id="releaseDate" type="date" [formField]="deviceForm.releaseDate" />
          </label>
          <app-form-field-error [fieldState]="deviceForm.releaseDate()"></app-form-field-error>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="screenSize"
            >Screen Size (mm)
            <input id="screenSize" type="number" step="0.1" [formField]="deviceForm.screenSize" />
          </label>
          <app-form-field-error [fieldState]="deviceForm.screenSize()"></app-form-field-error>
        </div>

        <div class="form-group">
          <label for="screenCornerRadius"
            >Corner Radius (px)
            <input
              id="screenCornerRadius"
              type="number"
              [formField]="deviceForm.screenCornerRadius"
            />
          </label>
          <app-form-field-error
            [fieldState]="deviceForm.screenCornerRadius()"
          ></app-form-field-error>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="screenPixelWidth"
            >Screen Width (px)
            <input id="screenPixelWidth" type="number" [formField]="deviceForm.screenPixelWidth" />
          </label>
          <app-form-field-error [fieldState]="deviceForm.screenPixelWidth()"></app-form-field-error>
        </div>

        <div class="form-group">
          <label for="screenPixelHeight"
            >Screen Height (px)
            <input
              id="screenPixelHeight"
              type="number"
              [formField]="deviceForm.screenPixelHeight"
            />
          </label>
          <app-form-field-error
            [fieldState]="deviceForm.screenPixelHeight()"
          ></app-form-field-error>
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="btn-secondary" (click)="onCancelClick()">Cancel</button>
        <button type="submit" [disabled]="deviceForm().invalid()">
          {{ mode() === 'create' ? 'Submit' : 'Save Changes' }}
        </button>
      </div>
    </form>
  `,
  styleUrl: './device-form.css',
})
export class DeviceForm {
  /** Device to edit, if in edit mode */
  device = input<Device | null>(null);

  /** Form mode - determines button text and behavior */
  mode = input<'create' | 'edit'>('create');

  /** Emitted when form is submitted with valid data */
  formSubmit = output<DeviceFormData>();

  /** Emitted when cancel is clicked */
  cancel = output<void>();

  protected deviceTypes = DEVICE_TYPES;

  protected deviceModel = signal<DeviceFormData>({
    manufacturer: '',
    name: '',
    type: 'smartphone',
    releaseDate: '',
    screenSize: 0,
    screenPixelHeight: 0,
    screenPixelWidth: 0,
    screenCornerRadius: 0,
    isDraft: true,
  });

  protected deviceForm = form(this.deviceModel, (fieldPath) => {
    required(fieldPath.manufacturer, { message: 'Manufacturer is required' });
    required(fieldPath.name, { message: 'Device name is required' });
    required(fieldPath.type, { message: 'Type is required' });
    required(fieldPath.releaseDate, { message: 'Release date is required' });
    required(fieldPath.screenSize, { message: 'Screen size is required' });
    min(fieldPath.screenSize, 1, { message: 'Screen size must be greater than 0' });
    required(fieldPath.screenPixelWidth, { message: 'Screen width is required' });
    min(fieldPath.screenPixelWidth, 1, { message: 'Screen width must be greater than 0' });
    required(fieldPath.screenPixelHeight, { message: 'Screen height is required' });
    min(fieldPath.screenPixelHeight, 1, { message: 'Screen height must be greater than 0' });
    required(fieldPath.screenCornerRadius, { message: 'Corner radius is required' });
    min(fieldPath.screenCornerRadius, 0, { message: 'Corner radius cannot be negative' });
  });

  constructor() {
    // Initialize form with device data when device input changes
    effect(() => {
      const deviceToEdit = this.device();
      if (deviceToEdit) {
        this.deviceModel.set({
          manufacturer: deviceToEdit.manufacturer,
          name: deviceToEdit.name,
          type: deviceToEdit.type,
          releaseDate: deviceToEdit.releaseDate,
          screenSize: deviceToEdit.screenSize,
          screenPixelHeight: deviceToEdit.screenPixelHeight,
          screenPixelWidth: deviceToEdit.screenPixelWidth,
          screenCornerRadius: deviceToEdit.screenCornerRadius,
          isDraft: deviceToEdit.isDraft,
        });
      }
    });
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.deviceForm().valid()) {
      this.formSubmit.emit(this.deviceModel());
    }
  }

  onCancelClick() {
    this.cancel.emit();
  }
}
