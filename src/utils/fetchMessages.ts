/* eslint-disable @typescript-eslint/no-explicit-any */
export const fetchMessages = async (id: string, setMessages: any, setError: any) => {
    if (!id) return;
  
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_CHAT_API_URL}/get-all-message?id=${id}`, {
        method: "GET",
        credentials: "include",
      });
  
      if (!response.ok) throw new Error("Failed to fetch messages");
  
      const data = await response.json();
      console.log("data : ",data);
      setMessages(data.length ? data : []);
  
      if (data.length > 0) {
        localStorage.setItem("lastMessageId", data[data.length - 1].message_id);
      }
    } catch (error) {
      console.error("❌ Error fetching messages:", error);
      setError(true);
    }
  };
  