export function getTimeFromMetadataString(string: string): number {
	//P0DT0H30M | PT20M
	if (!string.includes('H')) {
		const indexOfMinutes = string.indexOf('T') + 1;

		const minutesString = string.substring(indexOfMinutes, string.length - 1);

		return parseInt(minutesString);
	}

	const indexOfHours = string.indexOf('T') + 1;
	const indexOfMinutes = string.indexOf('H') + 1;

	const hoursString = string.substring(indexOfHours, indexOfMinutes - 1);
	const minutesString = string.substring(indexOfMinutes, string.length - 1);

	const hours = parseInt(hoursString);
	const minutes = parseInt(minutesString);

	return hours * 60 + minutes;
}
