// Server-only exports - these can only be imported in server contexts (+page.server.ts, +layout.server.ts, *.server.ts files)

// Form handlers
export {
  BaseServerFormHandler,
  RemoteFunctionHandler,
  ActionHandler
} from './form/handlers.server.js';

// Flash message utilities
export {
  setFlashMessage,
  getFlashMessage
} from './message/flash-message.server.js';

// Re-export types that might be needed on the server
export type {
  ServerFormState,
  FormErrors,
  FormSuccess,
  ZFormObject,
  ZFormPaths,
  ZDotPaths
} from './form/types.js';

// Server-side utilities
export {
  isFetchRequest,
  validate,
  readFormData,
  removeFiles,
  cloneFormData,
  getFormDataArrayLength
} from './form/utils.js';

// Constants
export { ENHANCED_FLAG } from './form/constants.js';

// Re-export message types that might be used on server
export type {
  ApplicationMessageData,
  ApplicationMessageConfig
} from './message/app-message.shared.js';

export { validateApplicationMessage } from './message/app-message.shared.js';
