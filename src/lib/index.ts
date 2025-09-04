// Client-safe exports that can be imported anywhere

// Form client state and enhancements
export { ClientFormState } from './form/client.svelte.js';
export {
  enhanceActionForm,
  enhanceRemoteFunctionForm
} from './form/client.svelte.js';

// Form types
export type {
  ServerFormState,
  FormErrors,
  FormSuccess,
  ZFormObject,
  ZFormPaths,
  ZDotPaths
} from './form/types.js';

// Form utilities (client-safe ones)
export {
  uniqueId,
  formPath,
  validate,
  removeFiles,
  readFormData,
  cloneFormData,
  getFormDataArrayLength
} from './form/utils.js';

// Constants
export { ENHANCED_FLAG } from './form/constants.js';

// Message service
export { AppMessageService } from './message/app-message.svelte.js';

// Message types
export type {
  ApplicationMessageData,
  ApplicationMessageConfig,
  AppMessageService as TAppMessageService
} from './message/app-message.shared.js';

// Svelte components
export { default as AppMessage } from './message/AppMessage.svelte';
