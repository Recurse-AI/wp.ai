// Service factory to create and manage service instances
import { agentAPI } from './apiService';
import { websocketService } from './websocketService';

// Get API service instance (singleton)
export function getApiService() {
  return agentAPI;
}

// Get WebSocket service instance (singleton)
export function getSocketService() {
  return websocketService;
}

