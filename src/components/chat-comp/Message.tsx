import React from 'react'

type MessageType = {
    id: string;
    text: string;
    createdAt: Date;
  };

const Message = ({message}:{message: MessageType}) => {
  return (
    <div>Message</div>
  )
}

export default Message