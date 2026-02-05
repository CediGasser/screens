import { TestBed } from '@angular/core/testing';
import { FormFieldError } from './form-field-error';
import { signal } from '@angular/core';
import { FieldState } from '@angular/forms/signals';


describe('FormFieldError', () => {
  it('should create', async () => {
    const { component } = await setup();

    expect(component).toBeTruthy();
  });

  it('should display error message when field is invalid and touched', async () => {
    const { fixture } = await setup({ fieldState: mockFieldState({ invalid: true, touched: true, errors: [{ message: 'This field is required' }] }) });
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.error-message')?.textContent?.trim()).toEqual('This field is required');
  });

  it('should not display error message when field is valid', async () => {
    const { fixture } = await setup({fieldState: mockFieldState({ invalid: false, touched: true, errors: null })});

    expect(fixture.nativeElement.querySelector('.error-message')).toBeNull();
  });

  it('should not display error message when field is not touched', async () => {
    const { fixture } = await setup({ fieldState: mockFieldState({ invalid: true, touched: false, errors: [{ message: 'This field is required' }] }) });

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.error-message')).toBeNull();
  });
});

const defaultProps = {
  fieldState: mockFieldState({
    invalid: true,
    touched: true,
    errors: [{ message: 'This field is required' }],
  }),
};

async function setup(props: Partial<typeof defaultProps> = {}) {
  const propsWithDefaults = { ...defaultProps, ...props };
  await TestBed.configureTestingModule({
    imports: [FormFieldError],
  })
  .compileComponents();

  const fixture = TestBed.createComponent(FormFieldError);

  fixture.componentRef.setInput('fieldState', propsWithDefaults.fieldState);
  const component = fixture.componentInstance;
  fixture.detectChanges();

  return { fixture, component }
}

function mockFieldState<T>(opts?: {
  invalid?: boolean;
  touched?: boolean;
  errors?: {message: string}[] | null;
}): FieldState<T> {
  return {
    invalid: signal(opts?.invalid ?? false),
    touched: signal(opts?.touched ?? false),
    errors: signal(opts?.errors ?? []),
  } as unknown as FieldState<T>;
}
