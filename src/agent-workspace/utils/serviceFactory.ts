import { agentAPI } from './apiService';
import { websocketService } from './websocketService';

// Define a function to get the API service
export const getApiService = () => {
  return agentAPI;
};

// Define a function to get the socket service
export const getSocketService = () => {
  return websocketService;
};

