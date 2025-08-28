import { fail, redirect, type RequestEvent } from '@sveltejs/kit';
import type {
  NonRedirectingFormState,
  NonRedirectingRemoteFunctionHandler,
  NonRedirectingActionHandler,
  RedirectingFormState,
  RedirectingRemoteFunctionHandler,
  RedirectingActionHandler,
  ZFormObject,
  NonRedirectingFormSuccessParam,
  NonRedirectingFormSuccess
} from './types.js';
import {
  createFormStateFromFormData,
  getFormAllTouched,
  isFetchRequest
} from './utils.js';
import { setFlashMessage } from '$lib/message/flash-message.server.js';
import { StatusCodes } from 'http-status-codes';

const createRemoteFunctionHandler = <
  S extends ZFormObject,
  IsRedirectForm extends boolean,
  Success extends Record<string, unknown> | undefined = undefined
>(
  schema: S,
  formData: FormData,
  event: IsRedirectForm extends true ? RequestEvent : undefined
): IsRedirectForm extends true
  ? RedirectingRemoteFunctionHandler<S>
  : NonRedirectingRemoteFunctionHandler<S, Success> => {
  const state = {
    ...createFormStateFromFormData(schema, formData),
    submitted: true
  };

  const failFn = (newErrors?: Record<string, string>) => {
    const errors = newErrors || state.errors;

    return {
      data: state.data,
      errors,
      touched: getFormAllTouched(schema, state.data),
      valid: false,
      submitted: true
    };
  };

  // Build handler based on form type
  if (event) {
    // Redirecting version with redirect method
    const redirectFn = (successData: {
      message: string;
      location: string;
    }): RedirectingFormState<S> => {
      // For non-fetch requests, set flash message and throw redirect
      if (!isFetchRequest(event.request)) {
        setFlashMessage(event, {
          type: 'success',
          message: successData.message
        });

        throw redirect(StatusCodes.SEE_OTHER, successData.location);
      }

      // For fetch requests, return success state with redirect info
      return {
        data: state.data,
        errors: {},
        touched: {},
        valid: true,
        submitted: true,
        success: {
          ...successData,
          isRedirect: true
        }
      };
    };

    return {
      ...state,
      fail: failFn,
      redirect: redirectFn
    } as IsRedirectForm extends true
      ? RedirectingRemoteFunctionHandler<S>
      : NonRedirectingRemoteFunctionHandler<S, Success>;
  } else {
    // Non-redirecting version with succeed method
    const succeedFn = (
      successData: NonRedirectingFormSuccessParam<Success>
    ): NonRedirectingFormState<S, Success> => {
      return {
        data: state.data,
        errors: {},
        touched: {},
        valid: true,
        submitted: true,
        success: {
          ...successData,
          isRedirect: false
        } as NonRedirectingFormSuccess<Success>
      };
    };

    return {
      ...state,
      fail: failFn,
      succeed: succeedFn
    } as IsRedirectForm extends true
      ? RedirectingRemoteFunctionHandler<S>
      : NonRedirectingRemoteFunctionHandler<S, Success>;
  }
};

export const createRedirectingRemoteFunctionHandler = <S extends ZFormObject>(
  schema: S,
  formData: FormData,
  event: RequestEvent
): RedirectingRemoteFunctionHandler<S> => {
  return createRemoteFunctionHandler<S, true>(schema, formData, event);
};

export const createNonRedirectingRemoteFunctionHandler = <
  S extends ZFormObject,
  Success extends Record<string, unknown> | undefined = undefined
>(
  schema: S,
  formData: FormData
): NonRedirectingRemoteFunctionHandler<S, Success> => {
  return createRemoteFunctionHandler<S, false, Success>(
    schema,
    formData,
    undefined
  );
};

const createActionHandler = <
  S extends ZFormObject,
  IsRedirectForm extends boolean,
  Success extends Record<string, unknown> | undefined = undefined
>(
  schema: S,
  event: RequestEvent,
  formData: FormData,
  isRedirectForm: IsRedirectForm
): IsRedirectForm extends true
  ? RedirectingActionHandler<S>
  : NonRedirectingActionHandler<S, Success> => {
  const state = {
    ...createFormStateFromFormData(schema, formData),
    submitted: true
  };

  const failFn = (
    newErrors?: Record<string, string>,
    status: StatusCodes = StatusCodes.BAD_REQUEST
  ) => {
    const errors = newErrors || state.errors;

    return fail(status, {
      data: state.data,
      errors,
      touched: getFormAllTouched(schema, state.data),
      valid: false,
      submitted: true
    });
  };

  // Build handler based on form type
  if (isRedirectForm) {
    // Redirecting version with redirect method
    const redirectFn = (
      successData: {
        message: string;
        location: string;
      },
      status: StatusCodes = StatusCodes.SEE_OTHER
    ): RedirectingFormState<S> => {
      // For non-fetch requests, set flash message and throw redirect
      if (!isFetchRequest(event.request)) {
        setFlashMessage(event, {
          type: 'success',
          message: successData.message
        });
        throw redirect(status, successData.location);
      }

      // For fetch requests, return success state with redirect info
      return {
        data: state.data,
        errors: {},
        touched: {},
        valid: true,
        submitted: true,
        success: {
          ...successData,
          isRedirect: true
        }
      };
    };

    return {
      ...state,
      fail: failFn,
      redirect: redirectFn
    } as IsRedirectForm extends true
      ? RedirectingActionHandler<S>
      : NonRedirectingActionHandler<S, Success>;
  } else {
    // Non-redirecting version with succeed method
    const succeedFn = (
      successData: NonRedirectingFormSuccessParam<Success>
    ): NonRedirectingFormState<S, Success> => {
      return {
        data: state.data,
        errors: {},
        touched: {},
        valid: true,
        submitted: true,
        success: {
          ...successData,
          isRedirect: false
        } as NonRedirectingFormSuccess<Success>
      };
    };

    return {
      ...state,
      fail: failFn,
      succeed: succeedFn
    } as IsRedirectForm extends true
      ? RedirectingActionHandler<S>
      : NonRedirectingActionHandler<S, Success>;
  }
};

export const createRedirectingActionHandler = <S extends ZFormObject>(
  schema: S,
  event: RequestEvent,
  formData: FormData
): RedirectingActionHandler<S> => {
  return createActionHandler<S, true>(schema, event, formData, true);
};

export const createNonRedirectingActionHandler = <
  S extends ZFormObject,
  Success extends Record<string, unknown> | undefined = undefined
>(
  schema: S,
  event: RequestEvent,
  formData: FormData
): NonRedirectingActionHandler<S, Success> => {
  return createActionHandler<S, false, Success>(schema, event, formData, false);
};
