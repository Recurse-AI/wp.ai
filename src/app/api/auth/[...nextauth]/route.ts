import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import WordPressProvider from "next-auth/providers/wordpress";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          access_type: "offline",
          prompt: "select_account"
        }
      }
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
              code: params.code,
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
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      if (account?.provider === "google") {
        try {
          // Instead of automatic API call, store the data in token
          return true;
        } catch (error) {
          console.error("Error in signIn callback:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.image = user.image;
        token.name = user.name;

        if (account) {
          token.accessToken = account.access_token;
          token.provider = account.provider;
          token.googleProfile = account.provider === "google" ? profile : null;
        }
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
        session.accessToken = token.accessToken as string;
        
        // Only call your API when explicitly requested
        if (token.provider === "google" && token.googleProfile) {
          // The API call will be handled in the signin page component
          session.googleProfile = token.googleProfile;
        }
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Always redirect to signin page after OAuth callback
      if (url.includes("/api/auth/callback")) {
        return `${baseUrl}/signin`;
      }
      // Allow relative URLs
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      // Allow same origin URLs
      if (url.startsWith(baseUrl)) {
        return url;
      }
      return baseUrl;
    },
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };