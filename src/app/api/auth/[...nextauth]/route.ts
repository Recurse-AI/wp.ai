import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import WordPressProvider from "next-auth/providers/wordpress";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    WordPressProvider({
      clientId: process.env.WORDPRESS_CLIENT_ID!,
      clientSecret: process.env.WORDPRESS_CLIENT_SECRET!,
      authorization: {
        url: "https://public-api.wordpress.com/oauth2/authorize",
        params: {
          client_id: process.env.WORDPRESS_CLIENT_ID!,
          response_type: "code",
          scope: "auth",
          redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/wordpress`,
        },
      },
      token: {
        url: "https://public-api.wordpress.com/oauth2/token",
        async request({ params }) {
          const response = await fetch("https://public-api.wordpress.com/oauth2/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              grant_type: "authorization_code",
              client_id: process.env.WORDPRESS_CLIENT_ID!,
              client_secret: process.env.WORDPRESS_CLIENT_SECRET!,
              redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/wordpress`,
              code: params.code, // Authorization code returned from WordPress
            }),
          });

          if (!response.ok) {
            throw new Error(`WordPress Token Exchange Failed: ${await response.text()}`);
          }

          return { tokens: await response.json() };
        },
      },
      userinfo: "https://public-api.wordpress.com/rest/v1.1/me",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.image = user.image;
        token.name = user.name;

        if (profile && account?.provider === "google") {
          token.name = `${(profile as any).given_name} ${(profile as any).family_name}`;
        }
        token.provider = account?.provider || "manual";
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.image = token.image as string;
        session.user.name = token.name as string;
        session.user.provider = token.provider as string;
      }

      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };