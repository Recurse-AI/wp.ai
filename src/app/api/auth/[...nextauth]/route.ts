import NextAuth, { NextAuthOptions, DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import WordPressProvider from "next-auth/providers/wordpress";

// export const runtime = 'nodejs'; 

export const runtime = 'edge';

export interface GoogleProfile {
  email: string;
  email_verified: boolean;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  locale: string;
  sub: string;
}

export interface ExtendedSession extends DefaultSession {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    provider?: string;
  } & DefaultSession["user"];
  accessToken?: string;
  googleProfile?: GoogleProfile;
  expires: string;
}

export interface ExtendedToken extends JWT {
  id: string;
  email: string;
  image: string;
  name: string;
  provider?: string;
  accessToken?: string;
  googleProfile?: GoogleProfile;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
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
      console.log('NextAuth SignIn Callback:', {
        user,
        account,
        profile,
        email,
        credentials
      });
      
      if (account?.provider === "google") {
        try {
          return true;
        } catch (error) {
          console.error("Error in signIn callback:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account, profile }): Promise<ExtendedToken> {
      console.log('NextAuth JWT Callback:', {
        token,
        user,
        account,
        profile
      });
      
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.image = user.image;
        token.name = user.name;

        if (account) {
          token.accessToken = account.access_token;
          token.provider = account.provider;
          token.googleProfile = account.provider === "google" ? profile as GoogleProfile : undefined;
        }
      }
      return token as ExtendedToken;
    },
    async session({ session, token }): Promise<ExtendedSession> {
      console.log('NextAuth Session Callback:', {
        session,
        token
      });
      
      const extendedSession = session as ExtendedSession;
      const extendedToken = token as ExtendedToken;
      
      if (extendedSession?.user) {
        extendedSession.user.id = extendedToken.id;
        extendedSession.user.email = extendedToken.email;
        extendedSession.user.image = extendedToken.image;
        extendedSession.user.name = extendedToken.name;
        extendedSession.user.provider = extendedToken.provider;
        extendedSession.accessToken = extendedToken.accessToken;
        
        if (extendedToken.provider === "google" && extendedToken.googleProfile) {
          extendedSession.googleProfile = extendedToken.googleProfile;
        }
      }
      return extendedSession;
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