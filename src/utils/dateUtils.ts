// Create a new utility file for date formatting
export const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    
    // Format: "Mar 14, 2024, 08:03 AM"
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).replace(',', '').replace(/,([^\s])/, ', $1'); // Fix spacing after year
}; 