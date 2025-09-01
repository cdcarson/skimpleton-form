import type z from 'zod';
import type {
  BaseFormState,
  FormErrors,
  ZDotPaths,
  ZFormObject,
  ZFormPaths
} from './types.js';
import { formPath, uniqueId, validate } from './utils.js';

export class ClientFormState<S extends ZFormObject> {
  private _formId: string;
  private _data: z.infer<S>;
  private _touchedKeys: ZDotPaths<S>[];
  private _errors: FormErrors<S>;
  private _externalErrors: FormErrors<S>;
  private _calculatedErrors: FormErrors<S>;
  private _shownErrors: FormErrors<S>;
  private _valid: boolean;
  constructor(
    public readonly schema: S,
    defaultData: z.infer<S>,
    initialState?: BaseFormState<S>
  ) {
    this._formId = uniqueId();
    this._data = $state(initialState?.data ?? defaultData);
    this._touchedKeys = $state(
      initialState ? (Object.keys(initialState.errors) as ZDotPaths<S>[]) : []
    );
    this._externalErrors = $state(initialState?.errors ?? {});
    this._calculatedErrors = $derived(validate(this.schema, this._data));
    this._errors = $derived({
      ...this._calculatedErrors,
      ...this._externalErrors
    });

    this._valid = $derived(Object.keys(this._errors).length === 0);
    this._shownErrors = $derived.by(() => {
      const result: FormErrors<S> = {};
      for (const key in this._errors) {
        if (this._touchedKeys.includes(key as ZDotPaths<S>)) {
          result[key as keyof FormErrors<S>] =
            this._errors[key as keyof FormErrors<S>];
        }
      }
      return result;
    });
  }
  get data(): z.infer<S> {
    return this._data;
  }
  set data(data: z.infer<S>) {
    this._data = data;
  }
  get errors(): FormErrors<S> {
    return this._errors;
  }
  set errors(errors: FormErrors<S>) {
    this._externalErrors = errors;
    this._touchedKeys = Object.keys(errors) as ZDotPaths<S>[];
  }
  get valid(): boolean {
    return this._valid;
  }
  get shownErrors(): FormErrors<S> {
    return this._shownErrors;
  }

  controlName(path: ZFormPaths<S>): string {
    const { formName } = formPath(this.schema, path);
    return formName;
  }
  controlId(path: ZFormPaths<S>): string {
    const { formName } = formPath(this.schema, path);
    return `${this._formId}-${formName}`;
  }
  touch(path: ZFormPaths<S>): void {
    const { formName } = formPath(this.schema, path);
    this._touchedKeys.push(formName as ZDotPaths<S>);
    delete this._externalErrors[formName as keyof FormErrors<S>];
  }
  untouchAll(): void {
    this._touchedKeys = [];
  }
}
