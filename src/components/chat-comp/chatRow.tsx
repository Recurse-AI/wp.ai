import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { BiSolidTrashAlt } from "react-icons/bi";
import { IoChatboxOutline } from "react-icons/io5";

const ChatRow = ({ id, name, lastMessage }: { id: string; name: string; lastMessage: string }) => {
  const pathName = usePathname();
  const router = useRouter();
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!pathName) {
      return;
    }
    setActive(pathName.includes(id));
  }, [pathName, id]);

  const handleRemoveChat = () => {
    console.log(`Chat ${id} removed`);
    router.push(`/`);
  };

  return (
    <Link
      href={`/chat/${id}`}
      className={`flex items-center justify-center gap-2 p-2.5 rounded-md
          hover:bg-white/10 ease-in ${
            active ? "bg-white/30" : "bg-transparent"
          }`}
    >
      <IoChatboxOutline />
      <div className="hidden md:inline-flex flex-1">
        <p className="truncate text-sm font-medium tracking-wide">{name}</p>
        {/* <p className="truncate text-xs text-gray-400 ml-2">{lastMessage}</p> */}
      </div>
      <BiSolidTrashAlt
        onClick={(e) => {
          e.preventDefault();
          handleRemoveChat();
        }}
        className="text-white/50 hover:text-red-700 duration-300 ease-in-out cursor-pointer"
      />
    </Link>
  );
};

export default ChatRow;
