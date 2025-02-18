"use client";

import React from "react";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { FiChevronDown } from "react-icons/fi";
import { useRouter } from "next/navigation";
import SignUp from "./signUpButton";

const Header = ({ ml }: { ml: string }) => {
  // const { data: session, status } = useSession();
  const router = useRouter();

  const session = {
    user: {
      email: "test@example.com",
      name: "Test User",
      image: "https://media.istockphoto.com/id/2149530993/photo/digital-human-head-concept-for-ai-metaverse-and-facial-recognition-technology.jpg?s=1024x1024&w=is&k=20&c=Ob0ACggwWuFDFRgIc-SM5bLWjNbIyoREeulmLN8dhLs=", // Mock user avatar
      id: "user_12345", // Mock user ID
    },
  };

  console.log(session)

  // ✅ Prevent rendering when session is loading
  if (status === "loading") {
    return <div className="p-3 text-white">Loading...</div>;
  }


  return (
    <div
      className={`flex items-center justify-between m-2
    absolute w-full top-0 left-0 pl-3 pr-1 ${ml}`}
    >
      <button
        className="flex items-center gap-1 bg-[#212121]
        hover:bg-black font-semibold tracking-wide px-3 py-2 rounded-lg duration-300"
      >
        <div className="flex gap-1">
          WP.AI <FiChevronDown />
        </div>
      </button>

      <div className="flex text-base mr-10">
        {session?.user ? (
          <div className="flex flex-row gap-1 hover:opacity-80">
            <Image
              key={session.user.image} // ✅ Force re-render if image changes
              src={session.user.image || "/default-avatar.png"}
              alt="User Image"
              height={40}
              width={40}
              className="px-1 rounded-full object-cover"
            />
            <p className="flex font-semibold items-center justify-center">
              {session.user.name}
            </p>
          </div>
        ) : (
          <SignUp />
        )}
      </div>
    </div>
  );
};

export default Header;
