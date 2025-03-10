// Create a new utility file for date formatting
export const formatDate = (dateString) => {
    try {
        // Parse ISO 8601 date string
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return 'Date not available';
        }

        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'UTC' // Since the API returns UTC dates
        };
        
        return date.toLocaleString('en-US', options);
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Date not available';
    }
}; 