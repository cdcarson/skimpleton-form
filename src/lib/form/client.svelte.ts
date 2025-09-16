import type z from 'zod';
import type {
  ServerFormState,
  FormErrors,
  ZDotPaths,
  ZFormObject,
  ZFormPaths
} from './types.js';
import { formPath, uniqueId, validate } from './utils.js';
import type { RemoteForm, SubmitFunction } from '@sveltejs/kit';
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
  get touchedKeys(): ZDotPaths<S>[] {
    return this._touchedKeys;
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
  touchAll(): void {
    // Mark all fields as touched by getting all possible field paths from calculated errors
    this._touchedKeys = Object.keys(this._calculatedErrors) as ZDotPaths<S>[];
  }
  untouchAll(): void {
    this._touchedKeys = [];
  }
}

type EnhanceOptions = {
  onSuccess?: (result: ServerFormState<ZFormObject>) => void | Promise<void>;
  waitMessage?: string;
  errorMessage?: string | ((errors: FormErrors<ZFormObject>) => string);
};

export const enhanceRemoteFunctionForm = <Schema extends ZFormObject>(
  formFunction: RemoteForm<ServerFormState<Schema>>,
  formState: ClientFormState<Schema>,
  options: EnhanceOptions = {}
) => {
  const msg = AppMessageService.get();
  const result = $derived(formFunction.result);
  return formFunction.enhance(async ({ submit, data: formData, form }) => {
    if (!formState.valid) {
      formState.touchAll();
      msg.error(getErrorToastMessage(formState.errors, options.errorMessage));
      return;
    }
    msg.wait(options.waitMessage || 'Please wait...');
    formState.submitting = true;
    formData.set(ENHANCED_FLAG, ENHANCED_FLAG);
    await submit();
    if (!result) {
      if (dev) {
        console.log('Missing result in remote function form');
      }
      msg.clear();
      formState.submitting = false;
      return;
    }
    if (result.success) {
      form.reset();
      if (result.success.isRedirect && result.success.location) {
        await goto(result.success.location);
      }
      if (options.onSuccess) {
        await options.onSuccess(result);
      }
      msg.success(result.success.message);
      formState.submitting = false;
      return;
    }
    formState.errors = result.errors;
    scrollToFirstError(form);
    msg.error(getErrorToastMessage(formState.errors, options.errorMessage));
    formState.submitting = false;
    return;
  });
};

export const enhanceActionForm = <Schema extends ZFormObject>(
  formState: ClientFormState<Schema>,
  options: EnhanceOptions = {}
): SubmitFunction<ServerFormState<Schema>, ServerFormState<Schema>> => {
  const msg = AppMessageService.get();
  const fn: SubmitFunction<
    ServerFormState<Schema>,
    ServerFormState<Schema>
  > = async (input) => {
    if (!formState.valid) {
      formState.touchAll();
      msg.error(getErrorToastMessage(formState.errors, options.errorMessage));
      input.cancel();
      scrollToFirstError(input.formElement);
      return;
    }
    formState.submitting = true;
    msg.wait(options.waitMessage || 'Please wait...');
    return async (r) => {
      if (
        'error' === r.result.type ||
        'redirect' === r.result.type ||
        !r.result.data
      ) {
        msg.clear();
        formState.submitting = false;
        return;
      }
      const data = r.result.data;
      if (r.result.type === 'failure') {
        formState.data = data.data;
        formState.errors = data.errors;
        msg.error(getErrorToastMessage(formState.errors, options.errorMessage));
        scrollToFirstError(input.formElement);
        formState.submitting = false;
        return;
      }

      if (r.result.type === 'success' && data.success) {
        formState.data = data.data;

        if (data.success.isRedirect === true) {
          await goto(data.success.location);
        }
        if (options.onSuccess) {
          await options.onSuccess(data);
        }
        msg.success(data.success.message);
        formState.submitting = false;
        return;
      }
      msg.clear();
      formState.submitting = false;
      await r.update();
    };
  };
  return fn;
};

const getErrorToastMessage = (
  errors: FormErrors<ZFormObject>,
  option?: string | ((errors: FormErrors<ZFormObject>) => string)
): string => {
  if (typeof option === 'function') {
    return option(errors);
  }
  if (typeof option === 'string' && option.length > 0) {
    return option;
  }
  return `Please correct the error${Object.keys(errors).length > 1 ? 's' : ''}.`;
};
const scrollToFirstError = (formElement: HTMLFormElement) => {
  const errorElement = formElement.querySelector('[data-error]');
  if (errorElement) {
    errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};
