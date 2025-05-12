"use client";
import Loading from "@/components/Loading";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

type DeliveryLog = {
  id: string;
  customerName: string;
  message: string;
  status: string;
  createdAt: string;
};

const Page = () => {
  const [logs, setLogs] = useState<DeliveryLog[]>([]);
  const { data: session, status } = useSession();
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { id } = useParams();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!session && isMounted) {
      router.push("/");
    }
  }, [session, isMounted, router]);

  useEffect(() => {
    const fetchLogs = async () => {
      const res = await fetch(`/api/deliveryLogs/${id}`);
      const data = await res.json();
      setLogs(data);
    };

    fetchLogs();
  }, [id]);

  if (!isMounted || status === "loading") {
    return <Loading />;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-2 mx-2">Delivery Logs</h1>
      <div className="text-sm flex justify-end items-center w-full px-3 pb-4">
        <span
          onClick={() => router.push("/campaigns")}
          className="font-bold cursor-pointer hover:text-blue-600 duration-200 transition-all"
        >
          Back
        </span>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {logs.map((log) => (
          <div
            key={log.id}
            className="border rounded-lg p-4 shadow-md bg-white space-y-2"
          >
            <div className="flex items-baseline justify-between flex-1 gap-2">
              <div className="font-semibold">{log.customerName}</div>
              <div
                className={`text-sm font-semibold text-white px-2 rounded-lg ${
                  log.status === "Sent" ? "bg-green-700/90" : "bg-red-600"
                }`}
              >
                {log.status.toUpperCase()}
              </div>
            </div>

            <div className="text-sm text-gray-600">Message: {log.message}</div>
            <div className="text-xs text-gray-400">
              {new Date(log.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Page;
