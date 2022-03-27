export function sanitizeWhiteSpaces(string: string): string {
	return string
		.replace(/\n|\t/g, '')
		.replace(/^ | $/g, '')
		.replace(/  +/g, ' ');
}

export function findFirstSequenceOfNumbers(value: string | number): number {
	return typeof value === 'number'
		? value
		: Number(
				value
					.replace(/[A-Z|a-z]/g, '')
					.replace(/ +/, '')
					.replace(/ +/g, '-')
					.split('-')[0]
		  );
}
