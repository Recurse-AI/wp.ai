import axios from 'axios';

export const getWordPressBaseUrl = (userId: string) => {
  return `/wp-api/${userId}`;
};

export const getPostsForUser = async (userId: string) => {
  try {
    const response = await axios.get(`${getWordPressBaseUrl(userId)}/wp/v2/posts`);
    return response.data;
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}; 