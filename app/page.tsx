"use client";
import { useSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Loading from "@/components/Loading";
import { FcGoogle } from "react-icons/fc";

const Home = () => {
  const [isMounted, setIsMounted] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (session?.user) {
      router.push("/dashboard");
    }
  }, [session, router]);

  // useEffect(() => {
  //   if (!session && isMounted) {
  //     router.push("/");
  //   }
  // }, [session, isMounted, router]);

  if (!isMounted || status === "loading") {
    return <Loading />;
  }

  return (
    <main className="size-full h-[80vh] flex justify-center items-center">
      <div className="bg-white py-10 px-8 rounded-xl shadow-md w-full max-w-sm text-center">
        <div className="text-2xl font-bold mb-7">
          Welcome to <span className="text-blue-600">Mini-CRM</span>
        </div>
        <button
          onClick={() => signIn("google")}
          className="cursor-pointer flex items-center justify-center gap-3 w-full py-3 px-4 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition"
        >
          <FcGoogle size={24} />
          <span className="font-medium text-gray-700 ">
            Sign in with Google
          </span>
        </button>
      </div>
    </main>
  );
};

export default Home;
