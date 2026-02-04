import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DevicesTable } from './devices-table';

describe('DevicesTable', () => {
  let component: DevicesTable;
  let fixture: ComponentFixture<DevicesTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DevicesTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DevicesTable);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
