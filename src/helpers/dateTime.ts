export function getTimeFromString(string: string | null): number {
    if (string === null) {
        return 0;
    }
    const hourIndex = string.indexOf('hr');
    const minuteIndex = string.indexOf('min');
    
    let hours = 0;
    let minutes = 0;

    if (hourIndex > -1) {
        hours = parseInt(string.substring(0, hourIndex).replace(/\D/g, ''));
    }

    if (minuteIndex > -1) {
        minutes = parseInt(string.substring(hourIndex, minuteIndex).replace(/\D/g, ''));
    }

    return hours * 60 + minutes;
}