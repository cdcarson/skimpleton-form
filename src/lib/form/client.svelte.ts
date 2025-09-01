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
import { formPath, uniqueId, validate } from './utils.js';

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
  let manualErrors: FormErrors<S> = $state(
    initialState ? initialState.errors : {}
  );
  // Success state - handle both types
  let success = $state(initialState ? initialState.success : undefined);

  // Track initial field values for auto-touch detection
  let initialFieldValues: Record<string, unknown> = {};

  // Force touched state: 'all' | 'none' | null (null means auto-detect)
  let forceTouched: 'all' | 'none' | null = $state(null);

  // Track field values when manual errors are set
  let errorFieldValues: Record<string, unknown> = $state({});

  // Initialize initial field values for touch detection
  const initializeFieldValues = (currentData: z.infer<S>) => {
    const allPaths = getAllFieldPaths(schema);
    initialFieldValues = {};
    for (const path of allPaths) {
      const pathParts = path.split('.');
      let value: unknown = currentData;
      for (const part of pathParts) {
        value = (value as Record<string, unknown>)?.[part];
      }
      initialFieldValues[path] = value;
    }
  };

  // Helper to get all field paths from schema
  const getAllFieldPaths = (schema: S): string[] => {
    const paths: string[] = [];
    const shape = schema.shape;

    for (const key in shape) {
      const field = shape[key];
      // Check if it's a nested object
      if (field && typeof field === 'object' && '_def' in field) {
        const def = (field as unknown as { _def: { typeName: string } })._def;
        if (def.typeName === 'ZodObject') {
          // Nested object - get sub-paths
          const subShape = (
            field as unknown as { shape: Record<string, unknown> }
          ).shape;
          for (const subKey in subShape) {
            const subField = subShape[subKey];
            if (
              subField &&
              typeof subField === 'object' &&
              '_def' in subField
            ) {
              const subDef = (
                subField as unknown as { _def: { typeName: string } }
              )._def;
              if (subDef.typeName === 'ZodObject') {
                // Double nested
                const subSubShape = (
                  subField as unknown as { shape: Record<string, unknown> }
                ).shape;
                for (const subSubKey in subSubShape) {
                  paths.push(`${key}.${subKey}.${subSubKey}`);
                }
              } else {
                paths.push(`${key}.${subKey}`);
              }
            } else {
              paths.push(`${key}.${subKey}`);
            }
          }
        } else if (def.typeName === 'ZodArray') {
          // Array - we'll track the array itself
          paths.push(key);
        } else {
          // Primitive field
          paths.push(key);
        }
      } else {
        paths.push(key);
      }
    }

    return paths;
  };

  // Initialize on creation
  initializeFieldValues(data);

  // If we have initial errors, track the field values
  if (initialState && initialState.errors) {
    for (const key in initialState.errors) {
      const pathParts = (key as string).split('.');
      let currentValue: unknown = data;
      for (const part of pathParts) {
        currentValue = (currentValue as Record<string, unknown>)?.[part];
      }
      errorFieldValues[key] = currentValue;
    }
  }

  const errors: FormErrors<S> = $derived.by(() => {
    const validationErrors = validate(schema, data);

    // Filter manual errors based on whether their field values have changed
    const filteredManualErrors: FormErrors<S> = {};
    for (const key in manualErrors) {
      const pathParts = (key as string).split('.');
      let currentValue: unknown = data;

      for (const part of pathParts) {
        currentValue = (currentValue as Record<string, unknown>)?.[part];
      }

      // Only keep the error if the value hasn't changed since the error was set
      if (
        errorFieldValues[key] !== undefined &&
        currentValue === errorFieldValues[key]
      ) {
        filteredManualErrors[key as keyof FormErrors<S>] =
          manualErrors[key as keyof FormErrors<S>];
      }
    }

    return {
      ...validationErrors,
      ...filteredManualErrors
    };
  });

  const valid = $derived(Object.keys(errors).length === 0);

  // Auto-derive touched state
  const touched: FormTouched<S> = $derived.by(() => {
    if (forceTouched === 'none') {
      return {};
    }

    if (forceTouched === 'all') {
      const allTouched: FormTouched<S> = {};
      const paths = getAllFieldPaths(schema);
      for (const path of paths) {
        allTouched[path as keyof FormTouched<S>] = true;
      }
      return allTouched;
    }

    // Auto-detect changed fields
    const autoTouched: FormTouched<S> = {};
    const currentPaths = getAllFieldPaths(schema);

    for (const path of currentPaths) {
      const pathParts = path.split('.');
      let currentValue: unknown = data;
      const initialValue: unknown = initialFieldValues[path];

      for (const part of pathParts) {
        currentValue = (currentValue as Record<string, unknown>)?.[part];
      }

      // Mark as touched if value has changed from initial
      if (currentValue !== initialValue) {
        autoTouched[path as keyof FormTouched<S>] = true;
      }
    }

    // Also mark fields with manual errors as touched
    for (const key in manualErrors) {
      if (manualErrors[key as keyof FormErrors<S>]) {
        autoTouched[key as keyof FormTouched<S>] = true;
      }
    }

    return autoTouched;
  });

  const shownErrors: FormErrors<S> = $derived.by(() => {
    const result: FormErrors<S> = {};
    // Check all touched fields, not just fields with errors
    for (const key in touched) {
      if (
        touched[key as keyof FormTouched<S>] &&
        errors[key as keyof FormErrors<S>]
      ) {
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
    setErrors: (errors: FormErrors<S>) => {
      // Store current field values for the errors being set
      errorFieldValues = {};
      for (const key in errors) {
        const pathParts = (key as string).split('.');
        let currentValue: unknown = data;
        for (const part of pathParts) {
          currentValue = (currentValue as Record<string, unknown>)?.[part];
        }
        errorFieldValues[key] = currentValue;
      }
      manualErrors = errors;
      // Reset forceTouched to allow auto-detection of only fields with errors
      forceTouched = null;
    },
    get success() {
      return success;
    },
    set success(value) {
      success = value;
    },
    touchAll: () => {
      forceTouched = 'all';
    },
    untouchAll: () => {
      forceTouched = 'none';
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

  return state as unknown as IsRedirectForm extends true
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
