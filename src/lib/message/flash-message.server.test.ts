import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setFlashMessage, getFlashMessage } from './flash-message.server.js';
import type { ApplicationMessageData } from './app-message.shared.js';
import type { RequestEvent } from '@sveltejs/kit';

type MockRequestEvent = RequestEvent & {
  cookies: {
    set: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    getAll: ReturnType<typeof vi.fn>;
    serialize: ReturnType<typeof vi.fn>;
  };
};

// Mock RequestEvent with cookies
const createMockRequestEvent = (): MockRequestEvent => {
  const cookieStore = new Map<string, string>();
  const mockCookies = {
    set: vi.fn((name: string, value: string) => {
      cookieStore.set(name, value);
    }),
    get: vi.fn((name: string) => {
      return cookieStore.get(name);
    }),
    delete: vi.fn((name: string) => {
      cookieStore.delete(name);
    }),
    getAll: vi.fn(() => []),
    serialize: vi.fn()
  };

  return {
    cookies: mockCookies,
    fetch: vi.fn(),
    getClientAddress: vi.fn(),
    locals: {},
    params: {},
    platform: undefined,
    request: {} as Request,
    route: { id: null },
    setHeaders: vi.fn(),
    url: new URL('http://localhost'),
    isDataRequest: false,
    isSubRequest: false,
    isRemoteRequest: false
  } as unknown as MockRequestEvent;
};

describe('flash-message.server', () => {
  let mockEvent: MockRequestEvent;
  let testMessage: ApplicationMessageData;

  beforeEach(() => {
    mockEvent = createMockRequestEvent();
    testMessage = {
      type: 'success',
      message: 'Test message'
    };
  });

  describe('setFlashMessage', () => {
    it('should set flash message cookie with correct value', () => {
      setFlashMessage(mockEvent, testMessage);

      expect(mockEvent.cookies.set).toHaveBeenCalledWith(
        'skimpleton-flash-message',
        JSON.stringify(testMessage),
        {
          path: '/',
          maxAge: 300, // 5 minutes
          httpOnly: true,
          secure: true,
          sameSite: 'lax'
        }
      );
    });

    it('should serialize success message correctly', () => {
      const successMessage: ApplicationMessageData = {
        type: 'success',
        message: 'Operation completed successfully'
      };

      setFlashMessage(mockEvent, successMessage);

      expect(mockEvent.cookies.set).toHaveBeenCalledWith(
        'skimpleton-flash-message',
        '{"type":"success","message":"Operation completed successfully"}',
        expect.any(Object)
      );
    });

    it('should serialize error message correctly', () => {
      const errorMessage: ApplicationMessageData = {
        type: 'error',
        message: 'Something went wrong'
      };

      setFlashMessage(mockEvent, errorMessage);

      expect(mockEvent.cookies.set).toHaveBeenCalledWith(
        'skimpleton-flash-message',
        '{"type":"error","message":"Something went wrong"}',
        expect.any(Object)
      );
    });

    it('should serialize wait message correctly', () => {
      const waitMessage: ApplicationMessageData = {
        type: 'wait',
        message: 'Please wait...'
      };

      setFlashMessage(mockEvent, waitMessage);

      expect(mockEvent.cookies.set).toHaveBeenCalledWith(
        'skimpleton-flash-message',
        '{"type":"wait","message":"Please wait..."}',
        expect.any(Object)
      );
    });

    it('should handle messages with special characters', () => {
      const specialMessage: ApplicationMessageData = {
        type: 'success',
        message: 'Message with "quotes" and \\ backslashes'
      };

      setFlashMessage(mockEvent, specialMessage);

      const expectedSerialized = JSON.stringify(specialMessage);
      expect(mockEvent.cookies.set).toHaveBeenCalledWith(
        'skimpleton-flash-message',
        expectedSerialized,
        expect.any(Object)
      );
    });
  });

  describe('getFlashMessage', () => {
    it('should return null when no flash message cookie exists', () => {
      const result = getFlashMessage(mockEvent);

      expect(result).toBeNull();
      expect(mockEvent.cookies.get).toHaveBeenCalledWith(
        'skimpleton-flash-message'
      );
    });

    it('should return deserialized message when cookie exists', () => {
      // Set up mock to return serialized message
      const serializedMessage = JSON.stringify(testMessage);
      mockEvent.cookies.get.mockReturnValue(serializedMessage);

      const result = getFlashMessage(mockEvent);

      expect(result).toEqual(testMessage);
      expect(mockEvent.cookies.get).toHaveBeenCalledWith(
        'skimpleton-flash-message'
      );
    });

    it('should delete cookie after reading', () => {
      const serializedMessage = JSON.stringify(testMessage);
      mockEvent.cookies.get.mockReturnValue(serializedMessage);

      getFlashMessage(mockEvent);

      expect(mockEvent.cookies.delete).toHaveBeenCalledWith(
        'skimpleton-flash-message',
        {
          path: '/'
        }
      );
    });

    it('should return null for invalid JSON', () => {
      mockEvent.cookies.get.mockReturnValue('invalid-json');

      const result = getFlashMessage(mockEvent);

      expect(result).toBeNull();
      expect(mockEvent.cookies.delete).toHaveBeenCalledWith(
        'skimpleton-flash-message',
        {
          path: '/'
        }
      );
    });

    it('should handle empty string cookie value', () => {
      mockEvent.cookies.get.mockReturnValue('');

      const result = getFlashMessage(mockEvent);

      expect(result).toBeNull();
      expect(mockEvent.cookies.delete).not.toHaveBeenCalled();
    });

    it('should handle undefined cookie value', () => {
      mockEvent.cookies.get.mockReturnValue(undefined);

      const result = getFlashMessage(mockEvent);

      expect(result).toBeNull();
      expect(mockEvent.cookies.delete).not.toHaveBeenCalled();
    });

    it('should deserialize all message types correctly', () => {
      const messages: ApplicationMessageData[] = [
        { type: 'success', message: 'Success message' },
        { type: 'error', message: 'Error message' },
        { type: 'wait', message: 'Wait message' }
      ];

      messages.forEach((message) => {
        // Reset mocks for each iteration
        mockEvent = createMockRequestEvent();
        mockEvent.cookies.get.mockReturnValue(JSON.stringify(message));

        const result = getFlashMessage(mockEvent);

        expect(result).toEqual(message);
      });
    });

    it('should handle malformed JSON gracefully', () => {
      const malformedJson = '{"type":"success","message":';
      mockEvent.cookies.get.mockReturnValue(malformedJson);

      const result = getFlashMessage(mockEvent);

      expect(result).toBeNull();
      expect(mockEvent.cookies.delete).toHaveBeenCalledWith(
        'skimpleton-flash-message',
        {
          path: '/'
        }
      );
    });

    it('should handle JSON that parses but is not a valid ApplicationMessage', () => {
      const invalidMessage = '{"invalid":"structure"}';
      mockEvent.cookies.get.mockReturnValue(invalidMessage);

      const result = getFlashMessage(mockEvent);

      expect(result).toBeNull();
      expect(mockEvent.cookies.delete).toHaveBeenCalled();
    });
  });

  describe('integration', () => {
    it('should allow setting and getting the same message', () => {
      // First set the message
      setFlashMessage(mockEvent, testMessage);

      // Extract the serialized value that was set
      const setCall = mockEvent.cookies.set.mock.calls[0];
      const serializedValue = setCall[1];

      // Reset the mock event and set up get to return the serialized value
      mockEvent = createMockRequestEvent();
      mockEvent.cookies.get.mockReturnValue(serializedValue);

      // Get the message
      const result = getFlashMessage(mockEvent);

      expect(result).toEqual(testMessage);
    });

    it('should handle round-trip for all message types', () => {
      const messages: ApplicationMessageData[] = [
        { type: 'success', message: 'Operation successful' },
        { type: 'error', message: 'An error occurred' },
        { type: 'wait', message: 'Processing...' }
      ];

      messages.forEach((originalMessage) => {
        // Set the message
        setFlashMessage(mockEvent, originalMessage);

        // Get the serialized value
        const setCall =
          mockEvent.cookies.set.mock.calls[
            mockEvent.cookies.set.mock.calls.length - 1
          ];
        const serializedValue = setCall[1];

        // Create new mock event for getting
        const getEvent: MockRequestEvent = createMockRequestEvent();
        getEvent.cookies.get.mockReturnValue(serializedValue);

        // Get the message
        const retrievedMessage = getFlashMessage(getEvent);

        expect(retrievedMessage).toEqual(originalMessage);
      });
    });
  });
});
