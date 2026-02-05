import { TestBed } from '@angular/core/testing';
import { DevicesTableRow } from './devices-table-row';


describe('DevicesTableRow', () => {
  it('should show options when enableOptions is true', async () => {
    const { fixture } = await setup({ enableOptions: true });

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('td').length).toBe(9); // 8 data columns + 1 options column
  });

  it('should not show options when enableOptions is false', async () => {
    const { fixture } = await setup({ enableOptions: false });

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('td').length).toBe(8); // only 8 data columns
  });

  it('should contain correct pixel density calculation', async () => {
    const { fixture } = await setup();

    const compiled = fixture.nativeElement as HTMLElement;
    const pixelDensityCell = compiled.querySelectorAll('td')[6]; // 7th column is pixel density
    const expectedPixelDensity = MOCK_DEVICES[0].screenPixelWidth / MOCK_DEVICES[0].screenSize;
    expect(pixelDensityCell.textContent?.trim()).toBe(expectedPixelDensity.toFixed(2));
  });

  it('should display device information correctly', async () => {
    const { fixture } = await setup();

    const compiled = fixture.nativeElement as HTMLElement;
    const cells = compiled.querySelectorAll('td');
    expect(cells[0].textContent?.trim()).toBe(MOCK_DEVICES[0].manufacturer);
    expect(cells[1].textContent?.trim()).toBe(MOCK_DEVICES[0].name);
    expect(cells[2].textContent?.trim()).toBe(MOCK_DEVICES[0].type);
    expect(cells[3].textContent?.trim()).toBe(new Date(MOCK_DEVICES[0].releaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
    expect(cells[4].textContent?.trim()).toBe(MOCK_DEVICES[0].screenSize.toString());
    expect(cells[5].textContent?.trim()).toBe(`${MOCK_DEVICES[0].screenPixelWidth}x${MOCK_DEVICES[0].screenPixelHeight}`);
    expect(cells[7].textContent?.trim()).toBe(MOCK_DEVICES[0].screenCornerRadius.toString());
  });
});

const MOCK_DEVICES = [
  {
    id: 'device-001',
    manufacturer: 'Apple',
    name: 'iPhone 14 Pro',
    type: 'smartphone',
    releaseDate: '2022-09-16',
    screenSize: 147,
    screenPixelHeight: 2556,
    screenPixelWidth: 1179,
    screenCornerRadius: 20,
    isDraft: false,
  },
  {
    id: 'device-002',
    manufacturer: 'Samsung',
    name: 'Galaxy S22 Ultra',
    type: 'smartphone',
    releaseDate: '2022-02-25',
    screenSize: 163,
    screenPixelHeight: 3088,
    screenPixelWidth: 1440,
    screenCornerRadius: 15,
    isDraft: false,
  },
  {
    id: 'device-003',
    manufacturer: 'Google',
    name: 'Pixel 6',
    type: 'smartphone',
    releaseDate: '2021-10-28',
    screenSize: 158,
    screenPixelHeight: 2400,
    screenPixelWidth: 1080,
    screenCornerRadius: 16,
    isDraft: false,
  },
  {
    id: 'device-004',
    manufacturer: 'Microsoft',
    name: 'Surface Pro 8',
    type: 'tablet',
    releaseDate: '2021-10-05',
    screenSize: 287,
    screenPixelHeight: 2880,
    screenPixelWidth: 1920,
    screenCornerRadius: 12,
    isDraft: false,
  },
]

const defaultProps = {
  device: MOCK_DEVICES[0],
  enableOptions: true,
};

async function setup(props: Partial<typeof defaultProps> = {}) {
  const propsWithDefaults = { ...defaultProps, ...props };
  await TestBed.configureTestingModule({
    imports: [DevicesTableRow],
  })
  .compileComponents();

  const fixture = TestBed.createComponent(DevicesTableRow);

  fixture.componentRef.setInput('device', propsWithDefaults.device);
  fixture.componentRef.setInput('enableOptions', propsWithDefaults.enableOptions);
  const component = fixture.componentInstance;
  fixture.detectChanges();

  return { fixture, component }
}
