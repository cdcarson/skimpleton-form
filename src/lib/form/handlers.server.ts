import {
  fail,
  redirect,
  type ActionFailure,
  type RequestEvent
} from '@sveltejs/kit';
import type {
  FormErrors,
  FormSuccess,
  ServerFormState,
  ZFormObject
} from './types.js';
import type z from 'zod';
import {
  isFetchRequest,
  readFormData,
  validate,
  cloneFormData,
  removeFiles
} from './utils.js';
import { setFlashMessage } from '$lib/message/flash-message.server.js';
import { ENHANCED_FLAG } from './constants.js';

export class BaseServerFormHandler<S extends ZFormObject> {
  public readonly schema: S;
  public readonly formData: FormData;
  public readonly event: RequestEvent;
  public readonly data: z.infer<S>;
  public readonly errors: FormErrors<S>;
  public readonly valid: boolean;
  public readonly enhancedFlagSet: boolean;
  constructor(schema: S, formData: FormData, event: RequestEvent) {
    this.schema = schema;
    this.formData = cloneFormData(formData);
    this.event = event;
    this.enhancedFlagSet = this.formData.get(ENHANCED_FLAG) === ENHANCED_FLAG;
    this.formData.delete(ENHANCED_FLAG);
    this.data = readFormData(schema, this.formData) as z.infer<S>;
    this.errors = validate(schema, this.data);
    this.valid = Object.keys(this.errors).length === 0;
  }
  public succeed<Success extends { message: string } = { message: string }>(
    successData: Omit<FormSuccess<false, Success>, 'isRedirect'>
  ): ServerFormState<S, false, Success> {
    return {
      data: removeFiles(this.data),
      errors: {},
      valid: true,
      success: {
        ...successData,
        isRedirect: false
      } as FormSuccess<false, Success>
    };
  }
  public redirect(
    successData: Omit<FormSuccess<true>, 'isRedirect'>,
    status: number = 303 // SEE_OTHER
  ): ServerFormState<S, true> {
    // For non-fetch requests, set flash message and throw redirect
    if (!isFetchRequest(this.event.request) && !this.enhancedFlagSet) {
      setFlashMessage(this.event, {
        type: 'success',
        message: successData.message
      });
      throw redirect(status, successData.location);
    }

    // For fetch requests, return success state with redirect info

    return {
      data: removeFiles(this.data),
      errors: {},
      valid: true,
      success: { ...successData, isRedirect: true }
    };
  }
}

export class RemoteFunctionHandler<
  S extends ZFormObject
> extends BaseServerFormHandler<S> {
  public fail(newErrors?: FormErrors<S>): ServerFormState<S> {
    return {
      data: removeFiles(this.data),
      errors: newErrors || this.errors,
      valid: false
    };
  }
}

export class ActionHandler<
  S extends ZFormObject
> extends BaseServerFormHandler<S> {
  public fail(
    newErrors?: FormErrors<S>,
    status: number = 400 // BAD_REQUEST
  ): ActionFailure<ServerFormState<S>> {
    return fail(status, {
      data: removeFiles(this.data),
      errors: newErrors || this.errors,
      valid: false,
      submitted: true
    });
  }
}
