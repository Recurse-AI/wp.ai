export const formatText = (text) => {
    if (!text) return '';

    // Remove markdown syntax while preserving content
    let formattedText = text
        // Remove code blocks with their content
        .replace(/```[\s\S]*?```/g, '')
        // Remove inline code
        .replace(/`[^`]*`/g, '')
        // Remove bold/italic markers but keep text
        .replace(/\*\*([^*]*)\*\*/g, '$1')
        .replace(/\*([^*]*)\*/g, '$1')
        .replace(/_([^_]*)_/g, '$1')
        // Remove links but keep text
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        // Remove list markers
        .replace(/^[\s]*[-*+][\s]+/gm, '')
        .replace(/^[\s]*\d+\.[\s]+/gm, '')
        // Remove headers
        .replace(/^#{1,6}\s+/gm, '')
        // Clean up extra whitespace
        .replace(/\n\s*\n/g, '\n')
        .trim();

    return formattedText;
}; 