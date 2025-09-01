import type { RemoteForm } from '@sveltejs/kit';
import type { ZFormObject, RedirectingFormState } from './types.js';
import type { ClientFormState } from './client-form-state.svelte.js';
import { ENHANCED_FLAG } from './constants.js';

type RedirectingFormFunction<Schema extends ZFormObject> = RemoteForm<
  RedirectingFormState<Schema>
>;

export const enhanceRedirectingRemoteFunctionForm = <
  Schema extends ZFormObject
>(
  formFunction: RedirectingFormFunction<Schema>,
  state: ClientFormState<Schema>
) => {
  return formFunction.enhance(async ({ submit, data: formData }) => {
    formData.set(ENHANCED_FLAG, ENHANCED_FLAG);
    await submit();
  });
};
