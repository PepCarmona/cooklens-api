export function tryJsonParse<T>(string: string): T {
	try {
		return JSON.parse(string);
	} catch {
		return tryJsonParse(string.slice(0, string.lastIndexOf('}')));
	}
}
