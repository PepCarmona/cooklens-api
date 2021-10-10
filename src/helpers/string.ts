export function sanitizeWhiteSpaces(string: string): string {
    return string.replace(/\n|\t/g, '').replace(/^ | $/g, '').replace(/  +/g, ' ');
}