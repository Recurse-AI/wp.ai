"use client";
import React, { useEffect, useState } from "react";

const ProcessingMessage = () => {
  const messages = ["Chat Processing...", "Model Evaluating...", "Loading..."];
  const [currentMessage, setCurrentMessage] = useState(messages[0]);
  let index = 0;

  useEffect(() => {
    const interval = setInterval(() => {
      index = (index + 1) % messages.length;
      setCurrentMessage(messages[index]);
    }, 1500); // Change message every 1.5 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <div className="text-center text-gray-300 text-sm mt-3 bg-gray-800 p-2 rounded-lg">
      {currentMessage}
    </div>
  );
};

export default ProcessingMessage;
