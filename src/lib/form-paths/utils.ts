import type { ZParentObject, FormPaths } from './types.js';

/**
 * Processes a path (either array or dot-notated string) and returns both formats.
 * This is the main function for working with form paths.
 *
 * Example:
 * ```ts
 * const schema = z.object({
 *   profile: z.object({ name: z.string() }),
 *   tags: z.array(z.string())
 * });
 *
 * formPath(schema, 'profile.name');
 * // { formName: 'profile.name', path: ['profile', 'name'] }
 *
 * formPath(schema, ['tags', 0]);
 * // { formName: 'tags.0', path: ['tags', 0] }
 * ```
 */
export const formPath = <Schema extends ZParentObject>(
	schema: Schema,
	path: FormPaths<Schema>
): {
	formName: string;
	path: (string | number)[];
} => {
	let formName: string;
	let pathArray: (string | number)[];

	if (typeof path === 'string') {
		// Path is already in dot notation
		formName = path;
		// Convert to array, parsing numeric segments
		pathArray = path.split('.').map((segment) => {
			const num = Number(segment);
			return Number.isNaN(num) ? segment : num;
		});
	} else if (Array.isArray(path)) {
		// Path is in array format
		pathArray = [...path]; // Create a copy
		// Convert to dot notation
		formName = path.map((segment) => String(segment)).join('.');
	} else {
		throw new Error(`Invalid path format: ${JSON.stringify(path)}`);
	}

	// Validate path against schema
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const validatePath = (currentShape: any, segments: (string | number)[], depth: number = 0) => {
		if (depth > 2) {
			throw new Error(`Invalid path: Maximum depth of 3 levels exceeded`);
		}

		if (segments.length === 0) {
			return;
		}

		const [currentSegment, ...remainingSegments] = segments;

		// First segment must be a string key in the shape
		if (depth === 0) {
			if (typeof currentSegment !== 'string' || !(currentSegment in currentShape)) {
				throw new Error(`Invalid path: "${currentSegment}" does not exist in schema`);
			}
			const field = currentShape[currentSegment];
			if (remainingSegments.length > 0) {
				validatePath(field, remainingSegments, depth + 1);
			}
			return;
		}

		// Handle nested validation
		if (typeof currentSegment === 'number') {
			// Array access
			if (!('element' in currentShape)) {
				throw new Error(`Invalid path: Cannot index into non-array at depth ${depth}`);
			}
			if (remainingSegments.length > 0) {
				// If array contains objects, validate remaining path against element shape
				if ('shape' in currentShape.element) {
					validatePath(currentShape.element, remainingSegments, depth + 1);
				} else {
					throw new Error(`Invalid path: Array elements are not objects at depth ${depth}`);
				}
			}
		} else if (typeof currentSegment === 'string') {
			// Object property access
			if (!('shape' in currentShape)) {
				throw new Error(`Invalid path: Not an object at depth ${depth}`);
			}
			if (!(currentSegment in currentShape.shape)) {
				throw new Error(`Invalid path: "${currentSegment}" does not exist at depth ${depth}`);
			}
			const field = currentShape.shape[currentSegment];
			if (remainingSegments.length > 0) {
				validatePath(field, remainingSegments, depth + 1);
			}
		} else {
			throw new Error(`Invalid path segment type at depth ${depth}`);
		}
	};

	validatePath(schema.shape, pathArray, 0);

	return { formName, path: pathArray };
};
