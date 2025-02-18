import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { Link } from "lucide-react";
import { IoHome } from "react-icons/io5";
import NewChat from "./newChat";
import ChatRow from "./chatRow";

const Sidebar = () => {
  // const session = useSession();
  // console.log(session?.status);

  const session = {
    user: {
      email: "test@example.com",
      name: "Test User",
      image:
        "https://media.istockphoto.com/id/2149530993/photo/digital-human-head-concept-for-ai-metaverse-and-facial-recognition-technology.jpg?s=1024x1024&w=is&k=20&c=Ob0ACggwWuFDFRgIc-SM5bLWjNbIyoREeulmLN8dhLs=", // Mock user avatar
      id: "user_12345", // Mock user ID
    },
  };

  console.log(session);

  // Static chat data instead of Firestore
  const staticChats = [
    { id: "1", name: "Chat with GPT", lastMessage: "Hello! How can I help?" },
    {
      id: "2",
      name: "Work Discussion",
      lastMessage: "Let's schedule a meeting.",
    },
    { id: "3", name: "Random Thoughts", lastMessage: "Did you know about AI?" },
  ];
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  
  return (
    <div className="text-3xl text-indigo-600 m-2">
      <div className=" flex items-center justify-center w-full tracking-wide text-3xl px-2">
        <NewChat />
      </div>
      <div>
        {/* <div className="hidden md:inline-flex mt-4">Models</div> */}
        <div>
          {session?.user ? (
            <>
              <p className="text-base font-semibold mt-4">Chat History</p>
              <div className="mt-4 overflow-y-scroll h-[80%]">
                {staticChats.length ? (
                  staticChats.map((chat) => (
                    <ChatRow
                      key={chat.id}
                      id={chat.id}
                      name={chat.name}
                      lastMessage={chat.lastMessage}
                      openDropdown={openDropdown}
                      setOpenDropdown={setOpenDropdown}
                    />
                  ))
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      No chats found.
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-sm font-semibold text-center mt-10">
              <p>Please Sign in to view History.</p>
              <Link
                href={"/signIn"}
                className="text-x5 hover:text-white duration-300
                mt-2 underline decoration-[1px]"
              >
                Sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
