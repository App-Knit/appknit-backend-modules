/**
 * @desc This module performs the time to millis conversion
 * @author gaurav sharma
 * @since Monday, July 30, 2018 2:10 PM
 */

/**
 * Converts the minutes into millis
 * @param {number} minutes -> number of minutes to convert to minutes
 */
const minutesToMillis = minutes => minutes * 60000;

/**
 * Convert hours to millis
 * @param {number} hours -> number of hours to convert into millis
 */
const hoursToMillis = hours => minutesToMillis(hours * 60);

/**
 * convert days to millis
 * @param {number} days -> number of days to convert to millis
 */
const daysToMillis = days => hoursToMillis(days * 24);

/**
 * returns the timestamp in Day Month Year, Hours:Minutes format.
 * @param {Number} timestamp
 */
const formatTimestamp = (timestamp) => {
	const date = new Date(timestamp).toString();
	const splits = date.split(' ');
	const timeSplits = splits[4].split(':');
	const day = splits[2];
	const month = splits[1];
	const year = splits[3];
	const hours = timeSplits[0];
	const minutes = timeSplits[1];

	return `${day} ${month} ${year}, ${hours}:${minutes}`;
};

const monthName = month => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month];

export default {
	minutesToMillis,
	hoursToMillis,
	daysToMillis,
	formatTimestamp,
	monthName,
};
