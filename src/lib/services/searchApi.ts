import apiClient from './apiClient';

export interface SearchResult {
  title: string;
  snippet: string;
  url: string;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
}

export const searchWeb = async (query: string, numResults: number = 10): Promise<SearchResponse> => {
  try {
    const response = await apiClient.post(
      '/api/search/search/',
      {
        query,
        num_results: numResults
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error performing search:', error);
    throw error;
  }
}; 