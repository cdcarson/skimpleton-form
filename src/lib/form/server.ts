import {
  fail,
  redirect,
  type ActionFailure,
  type RequestEvent
} from '@sveltejs/kit';
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
  isFetchRequest,
  removeFiles
} from './utils.js';
import { setFlashMessage } from '$lib/message/flash-message.server.js';
import { StatusCodes } from 'http-status-codes';

export const createRedirectingRemoteFunctionHandler = <S extends ZFormObject>(
  schema: S,
  formData: FormData,
  event: RequestEvent
): RedirectingRemoteFunctionHandler<S> => {
  const state = {
    ...createFormStateFromFormData(schema, formData),
    submitted: true
  };

  const failFn = (
    newErrors?: Record<string, string>
  ): RedirectingFormState<S> => {
    const errors = newErrors || state.errors;

    return {
      data: removeFiles(state.data),
      errors,
      touched: getFormAllTouched(schema, state.data),
      valid: false,
      submitted: true
    };
  };

  const redirectFn = (successData: {
    message: string;
    location: string;
  }): RedirectingFormState<S> => {
    const isFetch = isFetchRequest(event.request);
    console.log('isFetch', isFetch);
    // For non-fetch requests, set flash message and throw redirect
    // if (!isFetch) {
    //   setFlashMessage(event, {
    //     type: 'success',
    //     message: successData.message
    //   });

    //   throw redirect(StatusCodes.SEE_OTHER, successData.location);
    // }

    // For fetch requests, return success state with redirect info
    return {
      data: removeFiles(state.data),
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
  };
};

export const createNonRedirectingRemoteFunctionHandler = <
  S extends ZFormObject,
  Success extends Record<string, unknown> | undefined = undefined
>(
  schema: S,
  formData: FormData
): NonRedirectingRemoteFunctionHandler<S, Success> => {
  const state = {
    ...createFormStateFromFormData(schema, formData),
    submitted: true
  };

  const failFn = (
    newErrors?: Record<string, string>
  ): NonRedirectingFormState<S, Success> => {
    const errors = newErrors || state.errors;

    return {
      data: removeFiles(state.data),
      errors,
      touched: getFormAllTouched(schema, state.data),
      valid: false,
      submitted: true
    };
  };
  const succeedFn = (
    successData: NonRedirectingFormSuccessParam<Success>
  ): NonRedirectingFormState<S, Success> => {
    return {
      data: removeFiles(state.data),
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
  };
};

export const createRedirectingActionHandler = <S extends ZFormObject>(
  schema: S,
  event: RequestEvent,
  formData: FormData
): RedirectingActionHandler<S> => {
  const state = {
    ...createFormStateFromFormData(schema, formData),
    submitted: true
  };

  const failFn = (
    newErrors?: Record<string, string>,
    status: StatusCodes = StatusCodes.BAD_REQUEST
  ): ActionFailure<RedirectingFormState<S>> => {
    const errors = newErrors || state.errors;

    return fail(status, {
      data: removeFiles(state.data),
      errors,
      touched: getFormAllTouched(schema, state.data),
      valid: false,
      submitted: true
    });
  };

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
      data: removeFiles(state.data),
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
  };
};

export const createNonRedirectingActionHandler = <
  S extends ZFormObject,
  Success extends Record<string, unknown> | undefined = undefined
>(
  schema: S,
  _event: RequestEvent,
  formData: FormData
): NonRedirectingActionHandler<S, Success> => {
  const state = {
    ...createFormStateFromFormData(schema, formData),
    submitted: true
  };

  const failFn = (
    newErrors?: Record<string, string>,
    status: StatusCodes = StatusCodes.BAD_REQUEST
  ): ActionFailure<NonRedirectingFormState<S, Success>> => {
    const errors = newErrors || state.errors;

    return fail(status, {
      data: removeFiles(state.data),
      errors,
      touched: getFormAllTouched(schema, state.data),
      valid: false,
      submitted: true
    });
  };

  const succeedFn = (
    successData: NonRedirectingFormSuccessParam<Success>
  ): NonRedirectingFormState<S, Success> => {
    return {
      data: removeFiles(state.data),
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
  };
};
