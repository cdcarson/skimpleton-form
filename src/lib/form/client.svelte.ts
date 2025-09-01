import type z from 'zod';
import type {
  ServerFormState,
  FormErrors,
  ZDotPaths,
  ZFormObject,
  ZFormPaths
} from './types.js';
import { formPath, uniqueId, validate } from './utils.js';
import type { RemoteForm } from '@sveltejs/kit';
import { ENHANCED_FLAG } from './constants.js';
import { AppMessageService } from '$lib/message/app-message.svelte.js';
import { dev } from '$app/environment';
import { goto } from '$app/navigation';

export class ClientFormState<S extends ZFormObject> {
  private _formId: string;
  private _data: z.infer<S>;
  private _touchedKeys: ZDotPaths<S>[];
  private _errors: FormErrors<S>;
  private _externalErrors: FormErrors<S>;
  private _calculatedErrors: FormErrors<S>;
  private _shownErrors: FormErrors<S>;
  private _valid: boolean;
  private _submitting: boolean;
  constructor(
    public readonly schema: S,
    defaultData: z.infer<S>,
    initialState?: ServerFormState<S>
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
    this._submitting = $state(false);
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
  get submitting(): boolean {
    return this._submitting;
  }
  set submitting(value: boolean) {
    this._submitting = value;
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

export const enhanceRemoteFunctionForm = <Schema extends ZFormObject>(
  formFunction: RemoteForm<ServerFormState<Schema>>,
  formState: ClientFormState<Schema>,
  options: {
    onSuccess?: (result: ServerFormState<Schema>) => void|Promise<void>;
  } = {}
) => {
  const msg = AppMessageService.get();
  let result = $derived(formFunction.result);
  return formFunction.enhance(async ({ submit, data: formData }) => {
    if (!formState.valid) {
      msg.error('Please correct the error(s).');
      return;
    }
    formData.set(ENHANCED_FLAG, ENHANCED_FLAG);
    await submit();
    if (!result) {
      if (dev) {
        console.log('Missing result in remote function form');
      }
      msg.clear();
      return;
    }
    if (result.success) {
      if (result.success.isRedirect) {
        await goto(result.success.location);
        
      } 
      if (options.onSuccess) {
        await options.onSuccess(result);
      }
      msg.success(result.success.message);
      return;
    }
    formState.errors = result.errors;
    msg.error('Please correct the error(s).');
    return;
  });
};
