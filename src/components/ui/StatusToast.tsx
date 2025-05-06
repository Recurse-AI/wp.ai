'use client'

import { useState, useEffect } from 'react'
import { FiLoader, FiClock, FiCheckCircle, FiAlertCircle, FiX } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

// Status types
export type StatusType = 'PENDING' | 'IN_QUEUE' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'LOADING'

interface StatusToastProps {
  message: string
  status: StatusType
  onClose?: () => void
  duration?: number
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left' | 'top-center' | 'bottom-center'
}

// Standalone component for use within other components
export const StatusToastComponent = ({ 
  status, 
  message, 
  onClose,
  position = 'top-right'
}: StatusToastProps) => {
  // Define different toast styles based on status
  let icon = <FiLoader className="h-5 w-5 text-primary-600 animate-spin" />
  let defaultMessage = "Processing your request..."
  let bgColor = "bg-primary-100 border-primary-600"
  let textColor = "text-primary-800"

  // Override defaults based on status
  if (status === 'LOADING') {
    icon = <FiLoader className="h-5 w-5 text-primary-600 animate-spin" />
    defaultMessage = "Loading..."
    bgColor = "bg-primary-100 border-primary-600"
    textColor = "text-primary-800"
  } else if (status === 'PENDING' || status === 'IN_QUEUE') {
    icon = <FiClock className="h-5 w-5 text-amber-600" />
    defaultMessage = "Your request is in queue and will be processed soon"
    bgColor = "bg-amber-100 border-amber-600"
    textColor = "text-amber-800"
  } else if (status === 'COMPLETED') {
    icon = <FiCheckCircle className="h-5 w-5 text-green-600" />
    defaultMessage = "Processing complete!"
    bgColor = "bg-green-100 border-green-600"
    textColor = "text-green-800"
  } else if (status === 'FAILED') {
    icon = <FiAlertCircle className="h-5 w-5 text-red-600" />
    defaultMessage = "Processing failed. Please try again"
    bgColor = "bg-red-100 border-red-600"
    textColor = "text-red-800"
  }

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'bottom-right': 'bottom-16 right-4',
    'top-left': 'top-4 left-4',
    'bottom-left': 'bottom-16 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-16 left-1/2 transform -translate-x-1/2',
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`fixed ${positionClasses[position]} z-50 ${bgColor} border-l-4 shadow-lg rounded-md p-4 max-w-sm`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {icon}
        </div>
        <div className="ml-3 mr-8">
          <p className={`text-sm font-medium ${textColor}`}>{message || defaultMessage}</p>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
          >
            <FiX className="h-4 w-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

// Error notification component
export const ErrorToastComponent = ({ message, onClose, position = 'top-right' }: {
  message: string,
  onClose?: () => void,
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left' | 'top-center' | 'bottom-center'
}) => {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'bottom-right': 'bottom-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-16 left-1/2 transform -translate-x-1/2',
  }
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`fixed ${positionClasses[position]} z-50 bg-red-100 border-l-4 border-red-600 shadow-lg rounded-md p-4 max-w-sm`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <FiAlertCircle className="h-5 w-5 text-red-600" />
        </div>
        <div className="ml-3 mr-8">
          <p className="text-sm font-medium text-red-800">{message}</p>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="absolute top-2 right-2 text-red-600 hover:text-red-800"
          >
            <FiX className="h-4 w-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

// Helper function to show a status toast notification using react-hot-toast
export const showStatusToast = (
  status: StatusType,
  message?: string,
  duration = 4000,
  position: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left' | 'top-center' | 'bottom-center' = 'top-right'
) => {
  // Determine the default message based on status
  let defaultMessage = "Processing your request..."
  
  if (status === 'LOADING') {
    defaultMessage = "Loading..."
    duration = 5000
  } else if (status === 'PENDING' || status === 'IN_QUEUE') {
    defaultMessage = "Your request is in queue and will be processed soon"
    duration = 5000
  } else if (status === 'PROCESSING') {
    defaultMessage = "Processing your request..."
    duration = 5000
  } else if (status === 'COMPLETED') {
    defaultMessage = "Processing complete!"
    duration = 4000
  } else if (status === 'FAILED') {
    defaultMessage = "Processing failed. Please try again"
    duration = 6000
  }

  return toast.custom(
    (t) => (
      <StatusToastComponent
        status={status}
        message={message || defaultMessage}
        onClose={() => toast.dismiss(t.id)}
        position={position}
      />
    ),
    { duration }
  )
}

// Helper function to show an error toast
export const showErrorToast = (
  message: string,
  duration = 6000,
  position: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left' | 'top-center' | 'bottom-center' = 'top-right'
) => {
  return toast.custom(
    (t) => (
      <ErrorToastComponent
        message={message}
        onClose={() => toast.dismiss(t.id)}
        position={position}
      />
    ),
    { duration }
  )
}

// This hook lets you manually control showing/hiding a status toast
export const useStatusToast = (initialStatus?: StatusType, initialMessage?: string) => {
  const [isVisible, setIsVisible] = useState(false)
  const [status, setStatus] = useState<StatusType>(initialStatus || 'LOADING')
  const [message, setMessage] = useState(initialMessage || '')
  const [toastId, setToastId] = useState<string | null>(null)
  
  useEffect(() => {
    // If the toast is visible, update or create it
    if (isVisible) {
      // If we already have a toast ID, dismiss it first
      if (toastId) {
        toast.dismiss(toastId)
      }
      
      // Create a new toast
      const id = toast.custom(
        (t) => (
          <StatusToastComponent
            status={status}
            message={message}
            onClose={() => {
              setIsVisible(false)
              toast.dismiss(t.id)
            }}
            position="top-right"
          />
        ),
        {
          duration: status === 'FAILED' ? 6000 : status === 'COMPLETED' ? 4000 : 5000,
        }
      ) as string
      
      setToastId(id)
    } else if (toastId) {
      // If not visible and we have a toast ID, dismiss it
      toast.dismiss(toastId)
      setToastId(null)
    }
  }, [isVisible, status, message])
  
  // Show the toast
  const showToast = (newStatus: StatusType, newMessage?: string) => {
    setStatus(newStatus)
    if (newMessage) setMessage(newMessage)
    setIsVisible(true)
  }
  
  // Hide the toast
  const hideToast = () => {
    setIsVisible(false)
  }
  
  // Update the toast
  const updateToast = (newStatus: StatusType, newMessage?: string) => {
    setStatus(newStatus)
    if (newMessage) setMessage(newMessage)
    if (!isVisible) setIsVisible(true)
  }
  
  return { showToast, hideToast, updateToast, status, message, isVisible }
}

// Default export for backward compatibility
export default {
  StatusToastComponent,
  ErrorToastComponent,
  showStatusToast,
  showErrorToast,
  useStatusToast
} 