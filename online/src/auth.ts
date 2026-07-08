import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  adapter: DrizzleAdapter(db),
  providers: [
    Credentials({
      name: "Treinador",
      credentials: {
        username: { label: "Nome do Treinador", type: "text", placeholder: "Renato Gaúcho" },
      },
      async authorize(credentials) {
        if (!credentials?.username) return null;
        
        const username = credentials.username as string;
        
        // 1. Check if user exists
        let userResult = await db.select().from(users).where(eq(users.name, username)).limit(1);
        let user = userResult[0];

        // 2. If not, create a new user
        if (!user) {
          const inserted = await db.insert(users).values({
            name: username,
            email: `${username.toLowerCase().replace(/\\s+/g, '')}@firmafoot.local`, // Fake email required by schema
            role: username.toLowerCase() === 'admin' ? 'admin' : 'user',
          }).returning();
          user = inserted[0];
        }

        // Return user to NextAuth
        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        (session.user as any).role = token.role;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = (user as any).role;
      }
      return token;
    }
  }
});
