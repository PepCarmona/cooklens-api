export function getTimeFromString(string: string): number {
	//P0DT0H30M
	const indexOfHours = string.indexOf('T') + 1;
	const indexOfMinutes = string.indexOf('H') + 1;

	const hoursString = string.substring(indexOfHours, indexOfMinutes - 1);
	const minutesString = string.substring(indexOfMinutes, string.length - 1);

	const hours = parseInt(hoursString);
	const minutes = parseInt(minutesString);

	return hours * 60 + minutes;
}
