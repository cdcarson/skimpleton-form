import type z from 'zod';
import type {
  ZFormObject,
  RedirectingFormState,
  FormErrors,
  FormTouched,
  ZFormPaths,
  RedirectingFormClientState,
  NonRedirectingFormState,
  NonRedirectingFormClientState
} from './types.js';
import { getFormAllTouched, formPath, uniqueId, validate } from './utils.js';

const createState = <
  S extends ZFormObject,
  IsRedirectForm extends boolean,
  Success extends Record<string, unknown> | undefined = undefined
>(
  schema: S,
  defaultData: z.infer<S>,
  initialState: IsRedirectForm extends true
    ? RedirectingFormState<S> | null
    : NonRedirectingFormState<S, Success> | null
): IsRedirectForm extends true
  ? RedirectingFormClientState<S>
  : NonRedirectingFormClientState<S, Success> => {
  const baseId = uniqueId();
  let submitting = $state(false);
  let submitted = $state(initialState ? initialState.submitted : false);
  let data: z.infer<S> = $state(initialState ? initialState.data : defaultData);
  let externalErrors: FormErrors<S> = $state(
    initialState ? initialState.errors : {}
  );
  let touched: FormTouched<S> = $state({});

  // Success state - handle both types
  let success = $state(initialState ? initialState.success : undefined);

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

  const shownErrors: FormErrors<S> = $derived.by(() => {
    const result: FormErrors<S> = {};
    for (const key in errors) {
      if (touched[key as keyof FormTouched<S>]) {
        result[key as keyof FormErrors<S>] = errors[key as keyof FormErrors<S>];
      }
    }
    return result;
  });

  const state = {
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
    get success() {
      return success;
    },
    set success(value) {
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

  return state as IsRedirectForm extends true
    ? RedirectingFormClientState<S>
    : NonRedirectingFormClientState<S, Success>;
};

export const createRedirectingFormClientState = <S extends ZFormObject>(
  schema: S,
  defaultData: z.infer<S>,
  initialState: RedirectingFormState<S> | null
): RedirectingFormClientState<S> => {
  return createState<S, true>(schema, defaultData, initialState);
};

export const createNonRedirectingFormClientState = <
  S extends ZFormObject,
  Success extends Record<string, unknown> | undefined = undefined
>(
  schema: S,
  defaultData: z.infer<S>,
  initialState: NonRedirectingFormState<S, Success> | null
): NonRedirectingFormClientState<S, Success> => {
  return createState<S, false, Success>(schema, defaultData, initialState);
};
