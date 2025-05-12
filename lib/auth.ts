// lib/auth.ts
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prismaClient } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      httpOptions: {
        timeout: 10000,
      },
    }),
  ],
  // secret: process.env.NEXTAUTH_SECRET,
  // session: {
  //   strategy: "jwt",
  // },
  callbacks: {
    async signIn({ user }) {
      try {
        const existingUser = await prismaClient.user.findUnique({
          where: { email: user.email! },
        });

        if (!existingUser) {
          await prismaClient.user.create({
            data: {
              email: user.email!,
              name: user.name ?? "",
            },
          });
        }

        return true;
      } catch (error) {
        console.error("Error signing in user:", error);
        return false;
      }
    },
  },
};

// // lib/auth.ts
// import { NextAuthOptions } from "next-auth";
// import GoogleProvider from "next-auth/providers/google";
// import { prismaClient } from "@/lib/db";

// declare module "next-auth" {
//   interface Session {
//     user: {
//       id: string;
//       name?: string | null;
//       email?: string | null;
//       image?: string | null;
//     };
//   }
// }

// export const authOptions: NextAuthOptions = {
//   providers: [
//     GoogleProvider({
//       clientId: process.env.GOOGLE_CLIENT_ID ?? "",
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
//       httpOptions: {
//         timeout: 10000,
//       },
//     }),
//   ],
//   secret: process.env.NEXTAUTH_SECRET,
//   session: {
//     strategy: "jwt",
//   },
//   callbacks: {
//     async signIn({ user }) {
//       try {
//         const existingUser = await prismaClient.user.findUnique({
//           where: { email: user.email! },
//         });

//         if (!existingUser) {
//           await prismaClient.user.create({
//             data: {
//               email: user.email!,
//               name: user.name ?? "",
//             },
//           });
//         }

//         return true;
//       } catch (error) {
//         console.error("Error signing in user:", error);
//         return false;
//       }
//     },

//     async jwt({ token, user }) {
//       // Only runs on first sign-in
//       if (user?.email) {
//         const dbUser = await prismaClient.user.findUnique({
//           where: { email: user.email },
//         });

//         if (dbUser) {
//           token.id = dbUser.id; // Custom user ID from your DB
//         }
//       }
//       return token;
//     },

//     async session({ session, token }) {
//       if (session.user && token.id) {
//         session.user.id = token.id as string;
//       }
//       return session;
//     },
//   },
// };
