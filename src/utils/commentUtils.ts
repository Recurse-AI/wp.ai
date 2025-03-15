export const getTotalCommentCount = (issue: any) => {
    if (!issue.comments) return 0;
    
    return issue.comments.reduce((total: number, comment: any) => {
        // Count the comment itself
        let count = 1;
        // Add the count of replies if they exist
        if (comment.replies && Array.isArray(comment.replies)) {
            count += comment.replies.length;
        }
        return total + count;
    }, 0);
}; 