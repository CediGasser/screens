import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DevicesTable } from './devices-table';
import { inputBinding, signal } from '@angular/core';

describe('DevicesTable', () => {
  let component: DevicesTable;
  let fixture: ComponentFixture<DevicesTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DevicesTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DevicesTable, {
      bindings: [
        inputBinding('devices', signal([])),
      ]
    });
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
