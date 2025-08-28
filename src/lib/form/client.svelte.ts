import type z from 'zod';
import type {
  ZFormObject,
  RedirectingFormState,
  FormErrors,
  FormTouched,
  ZFormPaths,
  RedirectingFormClientState,
  NonRedirectingFormState,
  NonRedirectingFormClientState,
  NonRedirectingFormSuccess
} from './types.js';
import { getFormAllTouched, formPath, uniqueId, validate } from './utils.js';

export const createRedirectingFormClientState = <S extends ZFormObject>(
  schema: S,
  defaultData: z.infer<S>,
  initialState: RedirectingFormState<S> | null
): RedirectingFormClientState<S> => {
  const baseId = uniqueId();
  let submitting = $state(false);
  let submitted = $state(initialState ? initialState.submitted : false);
  let data: z.infer<S> = $state(initialState ? initialState.data : defaultData);
  let externalErrors: FormErrors<S> = $state(
    initialState ? initialState.errors : {}
  );
  let success:
    | {
        isRedirect: true;
        location: string;
        message: string;
      }
    | undefined = $state(initialState ? initialState.success : undefined);
  const computedErrors: FormErrors<S> = $derived.by(() => {
    return validate(schema, data);
  });
  const errors: FormErrors<S> = $derived.by(() => {
    return {
      ...computedErrors,
      ...externalErrors
    };
  });

  const valid = $derived(Object.keys(errors).length === 0);
  let touched: FormTouched<S> = $state({});

  const shownErrors: FormErrors<S> = $derived.by(() => {
    const result: FormErrors<S> = {};
    for (const key in errors) {
      if (touched[key as keyof FormTouched<S>]) {
        result[key as keyof FormErrors<S>] = errors[key as keyof FormErrors<S>];
      }
    }
    return result;
  });

  const state: RedirectingFormClientState<S> = {
    get baseId(): string {
      return baseId;
    },
    get submitting(): boolean {
      return submitting;
    },
    set submitting(value: boolean) {
      submitting = value;
    },
    get submitted(): boolean {
      return submitted;
    },
    set submitted(value: boolean) {
      submitted = value;
    },
    get data(): z.infer<S> {
      return data;
    },
    set data(value: z.infer<S>) {
      data = value;
    },
    get errors(): FormErrors<S> {
      return errors;
    },
    get touched(): FormTouched<S> {
      return touched;
    },
    get valid(): boolean {
      return valid;
    },
    get shownErrors(): FormErrors<S> {
      return shownErrors;
    },
    get computedErrors(): FormErrors<S> {
      return computedErrors;
    },
    get externalErrors(): FormErrors<S> {
      return externalErrors;
    },
    set externalErrors(value: FormErrors<S>) {
      externalErrors = value;
    },
    get success():
      | {
          isRedirect: true;
          location: string;
          message: string;
        }
      | undefined {
      return success;
    },
    set success(
      value:
        | {
            isRedirect: true;
            location: string;
            message: string;
          }
        | undefined
    ) {
      success = value;
    },
    touch: (path: ZFormPaths<S>) => {
      const { formName } = formPath(schema, path);
      touched[formName as keyof FormTouched<S>] = true;
    },
    untouch: (path: ZFormPaths<S>) => {
      const { formName } = formPath(schema, path);
      delete touched[formName as keyof FormTouched<S>];
    },
    touchAll: () => {
      touched = getFormAllTouched(schema, data);
    },
    untouchAll: () => {
      touched = {};
    },
    controlName: (path: ZFormPaths<S>) => {
      const { formName } = formPath(schema, path);
      return formName;
    },
    controlId: (path: ZFormPaths<S>) => {
      const { formName } = formPath(schema, path);
      return `${baseId}-${formName}`;
    },
    controlDescriptionId: (path: ZFormPaths<S>) => {
      const { formName } = formPath(schema, path);
      return `${baseId}-${formName}-description`;
    }
  };
  return state;
};

export const createNonRedirectingFormClientState = <
  S extends ZFormObject,
  Success extends Record<string, unknown> | undefined = undefined
>(
  schema: S,
  defaultData: z.infer<S>,
  initialState: NonRedirectingFormState<S, Success> | null
): NonRedirectingFormClientState<S, Success> => {
  const baseId = uniqueId();
  let submitting = $state(false);
  let submitted = $state(initialState ? initialState.submitted : false);
  let data: z.infer<S> = $state(initialState ? initialState.data : defaultData);
  let externalErrors: FormErrors<S> = $state(
    initialState ? initialState.errors : {}
  );
  let success: NonRedirectingFormSuccess<Success> | undefined = $state(
    initialState ? initialState.success : undefined
  );
  const computedErrors: FormErrors<S> = $derived.by(() => {
    return validate(schema, data);
  });
  const errors: FormErrors<S> = $derived.by(() => {
    return {
      ...computedErrors,
      ...externalErrors
    };
  });

  const valid = $derived(Object.keys(errors).length === 0);
  let touched: FormTouched<S> = $state({});

  const shownErrors: FormErrors<S> = $derived.by(() => {
    const result: FormErrors<S> = {};
    for (const key in errors) {
      if (touched[key as keyof FormTouched<S>]) {
        result[key as keyof FormErrors<S>] = errors[key as keyof FormErrors<S>];
      }
    }
    return result;
  });

  const state: NonRedirectingFormClientState<S, Success> = {
    get baseId(): string {
      return baseId;
    },
    get submitting(): boolean {
      return submitting;
    },
    set submitting(value: boolean) {
      submitting = value;
    },
    get submitted(): boolean {
      return submitted;
    },
    set submitted(value: boolean) {
      submitted = value;
    },
    get data(): z.infer<S> {
      return data;
    },
    set data(value: z.infer<S>) {
      data = value;
    },
    get errors(): FormErrors<S> {
      return errors;
    },
    get touched(): FormTouched<S> {
      return touched;
    },
    get valid(): boolean {
      return valid;
    },
    get shownErrors(): FormErrors<S> {
      return shownErrors;
    },
    get computedErrors(): FormErrors<S> {
      return computedErrors;
    },
    get externalErrors(): FormErrors<S> {
      return externalErrors;
    },
    set externalErrors(value: FormErrors<S>) {
      externalErrors = value;
    },
    get success(): NonRedirectingFormSuccess<Success> | undefined {
      return success;
    },
    set success(value: NonRedirectingFormSuccess<Success> | undefined) {
      success = value;
    },
    touch: (path: ZFormPaths<S>) => {
      const { formName } = formPath(schema, path);
      touched[formName as keyof FormTouched<S>] = true;
    },
    untouch: (path: ZFormPaths<S>) => {
      const { formName } = formPath(schema, path);
      delete touched[formName as keyof FormTouched<S>];
    },
    touchAll: () => {
      touched = getFormAllTouched(schema, data);
    },
    untouchAll: () => {
      touched = {};
    },
    controlName: (path: ZFormPaths<S>) => {
      const { formName } = formPath(schema, path);
      return formName;
    },
    controlId: (path: ZFormPaths<S>) => {
      const { formName } = formPath(schema, path);
      return `${baseId}-${formName}`;
    },
    controlDescriptionId: (path: ZFormPaths<S>) => {
      const { formName } = formPath(schema, path);
      return `${baseId}-${formName}-description`;
    }
  };
  return state;
};
