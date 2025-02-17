"use client";

export const getUser = async (
  setIsLoggedIn: (value: boolean) => void,
  setUser: (user: any) => void,
  router: any, // ✅ Pass router from the component
  pathname: string // ✅ Pass pathname from the component
) => {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL}/get-user/`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // ✅ Ensures cookies are sent
    });

    if (res.status === 200) {
      const data = await res.json();
      console.log("User Data:", data);

      // ✅ Save full user data in localStorage
      localStorage.setItem("userData", JSON.stringify(data));
      setUser({ name: data.user.full_name, image: data.profile_pic });
      setIsLoggedIn(true);
      return true; // ✅ User is logged in
    } else {
      throw new Error("Unauthorized");
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    localStorage.removeItem("userData"); // ✅ Remove old data
    setIsLoggedIn(false);

    // ✅ Redirect only if the user is not on allowed public pages
    if (!["/signin", "/signup", "/about", "/pricing"].includes(pathname)) {
      router.push("/");
    }
    return false; // ✅ User is not logged in
  }
};
