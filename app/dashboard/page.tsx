"use client";
import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, X, Check } from "lucide-react";

interface Batch {
  id: string;
  batchName: string;
  _count: {
    campaigns: number;
  };
}

const Dashboard = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [editingBatchName, setEditingBatchName] = useState<string>("");

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const res = await fetch("/api/batch");
        const data = await res.json();
        if (!res.ok) {
          throw new Error("Failed to fetch batches");
        }
        setBatches(data.batches);
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBatches();
  }, []);

  useEffect(() => {
    if (!session) router.push("/");
  }, [session, router]);

  if (loading || status === "loading") return <Loading />;
  if (!session || !session.user) return null;

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this batch?"
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/batch/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete batch");

      setBatches((prev) => prev.filter((batch) => batch.id !== id));
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/batch/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newBatchName: editingBatchName }),
      });
      if (!res.ok) throw new Error("Failed to update batch");

      setBatches((prev) =>
        prev.map((batch) =>
          batch.id === id ? { ...batch, batchName: editingBatchName } : batch
        )
      );
      setEditingBatchId(null);
      setEditingBatchName("");
    } catch (error) {
      console.error("Edit error:", error);
    }
  };

  return (
    <main className="size-full flex justify-center items-center w-screen py-10 px-22">
      <div className="space-y-4 w-full">
        <div className="flex justify-center items-center font-bold text-2xl">
          Welcome back,
          <span className="text-blue-600 ml-1">
            {session.user.name?.toUpperCase()}
          </span>
        </div>

        {batches.length === 0 ? (
          <div className="text-center font-medium text-gray-600 mb-8">
            No batches yet...
          </div>
        ) : (
          <div>
            <div className="text-center font-medium text-gray-600 mb-8">
              Total Batches: {batches.length}
            </div>

            {batches.map((batch) => (
              <div
                key={batch.id}
                className="shadow-md shadow-neutral-300/40 hover:shadow-neutral-300/80 transition-all duration-300 py-4 px-8 rounded-xl w-full flex justify-between items-center"
              >
                <div>
                  <div className="flex items-baseline font-bold text-xl">
                    {editingBatchId === batch.id ? (
                      <input
                        value={editingBatchName}
                        onChange={(e) => setEditingBatchName(e.target.value)}
                        className="bg-blue-100 text-sm px-2 py-1 rounded border mr-2"
                        type="text"
                      />
                    ) : (
                      <div
                        onClick={() => router.push("/campaigns")}
                        className="cursor-pointer underline underline-offset-3 decoration-transparent hover:decoration-black transition-all duration-300"
                      >
                        {batch.batchName}
                      </div>
                    )}

                    <div className="flex gap-2 ml-3 text-xs items-center">
                      {editingBatchId === batch.id ? (
                        <>
                          <X
                            className="cursor-pointer text-red-600 hover:text-red-700"
                            onClick={() => {
                              setEditingBatchId(null);
                              setEditingBatchName("");
                            }}
                            size={16}
                          />
                          <Check
                            className="cursor-pointer text-green-600 hover:text-green-700"
                            onClick={() => handleEdit(batch.id)}
                            size={16}
                          />
                        </>
                      ) : (
                        <Pencil
                          className="cursor-pointer text-green-700 hover:text-green-800"
                          onClick={() => {
                            setEditingBatchId(batch.id);
                            setEditingBatchName(batch.batchName);
                          }}
                          size={16}
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 mt-2 text-xs">
                    {/* <div>Total Entries ({batch._count.customerData})</div> */}
                    <div>Campaigns ({batch._count.campaigns})</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => router.push(`/new-campaign/${batch.id}`)}
                    className="bg-blue-700 hover:bg-green-700 text-white rounded-full text-xs cursor-pointer transition-all duration-300"
                  >
                    <Plus />
                  </Button>
                  <Button
                    onClick={() => handleDelete(batch.id)}
                    className="bg-red-700/90 hover:bg-red-700 text-white rounded-full text-xs cursor-pointer transition-all duration-300"
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default Dashboard;
