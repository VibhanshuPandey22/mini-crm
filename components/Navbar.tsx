"use client";
import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const Navbar = () => {
  const { data: session, status } = useSession();
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || status === "loading") {
    return;
  }

  return (
    <div>
      <div className="flex justify-between py-2 px-4">
        <div
          className="cursor-pointer font-bold hover:text-blue-600 transition-all duration-200"
          onClick={() => router.push("/")}
        >
          Mini-CRM
        </div>
        <div className="flex gap-2 items-center">
          {session?.user ? (
            <>
              <div className="flex items-center gap-2">
                <Image
                  className="rounded-full"
                  src={session.user.image || "/default-avatar.svg"}
                  alt="User profile"
                  height={30}
                  width={30}
                />
                <Button
                  className="cursor-pointer"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  Logout
                </Button>
              </div>
            </>
          ) : (
            <Button
              className="cursor-pointer"
              onClick={() => signIn(undefined, { callbackUrl: "/dashboard" })}
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
