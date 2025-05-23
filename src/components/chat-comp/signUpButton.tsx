import React from "react";
import {useRouter} from 'next/navigation'

const SignUp = () => {
    const router = useRouter()
    const signup = async () => {
        router.push('/signup')
      }
  return (
    <button
      className="hover:text-white font-semibold tracking-wide px-3 py-2 duration-300"
      onClick={signup}
    >
      Sign Up
    </button>
  );
};

export default SignUp;