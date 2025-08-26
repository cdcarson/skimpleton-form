// Shared types and utilities
export type {
  ApplicationMessageData,
  AppMessageService,
  ApplicationMessageConfig
} from './app-message.shared.js';
export { validateApplicationMessage } from './app-message.shared.js';

// Server-side flash message functionality
export { setFlashMessage, getFlashMessage } from './flash-message.server.js';

// Client-side Svelte components and stores
export { default as AppMessage } from './AppMessage.svelte';
export { AppMessageService as ApplicationMessageService } from './app-message.svelte.js';
