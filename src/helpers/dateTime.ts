import { integratedSite } from '../integration/sites';

export function getTimeFromString(string: string | null, site?: integratedSite): number {
    if (string === null) {
        return 0;
    }
        
    let hours = 0;
    let minutes = 0;

    
    const hourIndex = string.indexOf('hr');
    const minuteIndex = string.indexOf('min');

    if (hourIndex > -1) {
        hours = parseInt(string.substring(0, hourIndex).replace(/\D/g, ''));
    }

    if (minuteIndex > -1) {
        minutes = parseInt(string.substring(hourIndex, minuteIndex).replace(/\D/g, ''));
    }

    if (site?.name === 'delish') {
        hours = minutes.toString().length > 2
            ? parseInt(minutes.toString().slice(0, -2))
            : hours;
        minutes = parseInt(minutes.toString().slice(-2));
    }
    
    return hours * 60 + minutes;
}