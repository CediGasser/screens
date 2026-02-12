import { Component, ElementRef, output, signal, viewChild } from '@angular/core';
import { DeviceForm } from '../device-form/device-form';
import { Device, DeviceFormData, DevicesApi } from '../../services/devices-api';

export type DialogMode = 'create' | 'edit';

@Component({
  selector: 'app-device-form-dialog',
  imports: [DeviceForm],
  template: `
    <dialog #dialog (close)="onDialogClose()">
      <div class="dialog-content">
        <header>
          <h2>{{ mode() === 'create' ? 'Suggest a Device' : 'Edit Device' }}</h2>
        </header>
        <app-device-form
          [device]="deviceToEdit()"
          [mode]="mode()"
          (formSubmit)="onFormSubmit($event)"
          (cancel)="close()"
        />
      </div>
    </dialog>
  `,
  styleUrl: './device-form-dialog.css',
})
export class DeviceFormDialog {
  /** Emitted when a device is successfully created */
  deviceCreated = output<Device>();

  /** Emitted when a device is successfully updated */
  deviceUpdated = output<Device>();

  protected dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  protected mode = signal<DialogMode>('create');
  protected deviceToEdit = signal<Device | null>(null);

  private isDraft = true;

  constructor(private devicesApi: DevicesApi) {}

  /**
   * Open dialog in create mode for suggesting a new device (as draft)
   */
  openForCreate(isDraft = true) {
    this.mode.set('create');
    this.deviceToEdit.set(null);
    this.isDraft = isDraft;
    this.dialog().nativeElement.showModal();
  }

  /**
   * Open dialog in edit mode for editing an existing device
   */
  openForEdit(device: Device) {
    this.mode.set('edit');
    this.deviceToEdit.set(device);
    this.isDraft = device.isDraft;
    this.dialog().nativeElement.showModal();
  }

  /**
   * Close the dialog
   */
  close() {
    this.dialog().nativeElement.close();
  }

  protected onDialogClose() {
    // Reset state when dialog is closed
    this.deviceToEdit.set(null);
  }

  protected onFormSubmit(formData: DeviceFormData) {
    if (this.mode() === 'create') {
      this.createDevice({ ...formData, isDraft: this.isDraft });
    } else {
      this.updateDevice(formData);
    }
  }

  private createDevice(formData: DeviceFormData) {
    this.devicesApi.createDevice(formData).subscribe({
      next: (device) => {
        this.deviceCreated.emit(device);
        this.close();
      },
      error: (err) => {
        console.error('Failed to create device:', err);
      },
    });
  }

  private updateDevice(formData: DeviceFormData) {
    const device = this.deviceToEdit();
    if (!device) return;

    this.devicesApi.updateDevice(device.id, formData).subscribe({
      next: (updatedDevice) => {
        this.deviceUpdated.emit(updatedDevice);
        this.close();
      },
      error: (err) => {
        console.error('Failed to update device:', err);
      },
    });
  }
}
