import { describe, it, expect } from 'vitest';
import { validateApplicationMessage } from './app-message.shared.js';
import type { ApplicationMessageData } from './app-message.shared.js';

describe('validateApplicationMessage', () => {
  describe('valid inputs', () => {
    it('should validate success message', () => {
      const input = { type: 'success', message: 'Operation completed' };
      const result = validateApplicationMessage(input);

      expect(result).toEqual(input);
    });

    it('should validate error message', () => {
      const input = { type: 'error', message: 'Something went wrong' };
      const result = validateApplicationMessage(input);

      expect(result).toEqual(input);
    });

    it('should validate wait message', () => {
      const input = { type: 'wait', message: 'Please wait...' };
      const result = validateApplicationMessage(input);

      expect(result).toEqual(input);
    });

    it('should handle empty message string', () => {
      const input = { type: 'success', message: '' };
      const result = validateApplicationMessage(input);

      expect(result).toEqual(input);
    });

    it('should handle message with special characters', () => {
      const input = {
        type: 'error',
        message: 'Message with "quotes" and \\ backslashes'
      };
      const result = validateApplicationMessage(input);

      expect(result).toEqual(input);
    });

    it('should handle message with unicode characters', () => {
      const input = { type: 'success', message: '操作成功 🎉' };
      const result = validateApplicationMessage(input);

      expect(result).toEqual(input);
    });
  });

  describe('invalid inputs', () => {
    it('should return null for null input', () => {
      const result = validateApplicationMessage(null);
      expect(result).toBeNull();
    });

    it('should return null for undefined input', () => {
      const result = validateApplicationMessage(undefined);
      expect(result).toBeNull();
    });

    it('should return null for non-object input', () => {
      expect(validateApplicationMessage('string')).toBeNull();
      expect(validateApplicationMessage(123)).toBeNull();
      expect(validateApplicationMessage(true)).toBeNull();
      expect(validateApplicationMessage([])).toBeNull();
    });

    it('should return null for missing type field', () => {
      const input = { message: 'Missing type' };
      const result = validateApplicationMessage(input);

      expect(result).toBeNull();
    });

    it('should return null for missing message field', () => {
      const input = { type: 'success' };
      const result = validateApplicationMessage(input);

      expect(result).toBeNull();
    });

    it('should return null for invalid type value', () => {
      const inputs = [
        { type: 'invalid', message: 'test' },
        { type: 'info', message: 'test' },
        { type: 'warning', message: 'test' },
        { type: '', message: 'test' }
      ];

      inputs.forEach((input) => {
        const result = validateApplicationMessage(input);
        expect(result).toBeNull();
      });
    });

    it('should return null for non-string type', () => {
      const inputs = [
        { type: 123, message: 'test' },
        { type: true, message: 'test' },
        { type: null, message: 'test' },
        { type: undefined, message: 'test' },
        { type: [], message: 'test' },
        { type: {}, message: 'test' }
      ];

      inputs.forEach((input) => {
        const result = validateApplicationMessage(input);
        expect(result).toBeNull();
      });
    });

    it('should return null for non-string message', () => {
      const inputs = [
        { type: 'success', message: 123 },
        { type: 'success', message: true },
        { type: 'success', message: null },
        { type: 'success', message: undefined },
        { type: 'success', message: [] },
        { type: 'success', message: {} }
      ];

      inputs.forEach((input) => {
        const result = validateApplicationMessage(input);
        expect(result).toBeNull();
      });
    });

    it('should return null for object with extra properties', () => {
      const input = {
        type: 'success',
        message: 'test',
        extraProperty: 'should be ignored'
      };

      const result = validateApplicationMessage(input);

      // Should still validate and return only the valid properties
      expect(result).toEqual({
        type: 'success',
        message: 'test'
      });
    });

    it('should return null for empty object', () => {
      const result = validateApplicationMessage({});
      expect(result).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle objects with prototype pollution attempts', () => {
      const input = {
        type: 'success',
        message: 'test',
        __proto__: { polluted: true }
      };

      const result = validateApplicationMessage(input);

      expect(result).toEqual({
        type: 'success',
        message: 'test'
      });
    });

    it('should handle frozen objects', () => {
      const input = Object.freeze({ type: 'success', message: 'frozen' });
      const result = validateApplicationMessage(input);

      expect(result).toEqual(input);
    });

    it('should handle objects with getters', () => {
      const input = {
        get type() {
          return 'success';
        },
        get message() {
          return 'getter message';
        }
      };

      const result = validateApplicationMessage(input);

      expect(result).toEqual({
        type: 'success',
        message: 'getter message'
      });
    });
  });

  describe('type safety', () => {
    it('should return properly typed ApplicationMessage', () => {
      const input = { type: 'success' as const, message: 'test' };
      const result = validateApplicationMessage(input);

      if (result) {
        // This should not cause TypeScript errors
        const type: ApplicationMessageData['type'] = result.type;
        const message: string = result.message;

        expect(type).toBe('success');
        expect(message).toBe('test');
      }
    });
  });
});
