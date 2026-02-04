import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DevicesTableRow } from './devices-table-row';

describe('DevicesTableRow', () => {
  let component: DevicesTableRow;
  let fixture: ComponentFixture<DevicesTableRow>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DevicesTableRow]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DevicesTableRow);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
