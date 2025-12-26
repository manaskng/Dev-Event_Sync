import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import connectDB from "@/lib/mongodb";
import User from "@/database/user.model";
import { compare } from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        await connectDB();
        
        const user = await User.findOne({ email: credentials?.email });

        if (!user) {
          throw new Error("User not found.");
        }

        // Verify Password
        if (user.password) {
            const isPasswordValid = await compare(credentials?.password as string, user.password);
            if (!isPasswordValid) throw new Error("Invalid password.");
        }

        return { id: user._id.toString(), name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    // This adds the user ID and Role to the session object so you can use it in the frontend
    async session({ session, token }) {
      if (token?.sub && session.user) {
        session.user.id = token.sub; 
        // session.user.role = token.role; 
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
  },
  pages: {
    signIn: "/login", \
  },
});