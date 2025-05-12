"use client";
import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { Trash2, X, Check } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

enum CampaignStatus {
  READY = "Ready",
  COMPLETED = "Completed",
  FAILED = "Failed",
}

type CampaignLog = {
  id: string;
  deliveryTime: string;
  notes?: string;
  count: number;
  audience: JSON;
  campaign: {
    name: string;
    message: string;
    status: CampaignStatus;
  };
  batch: {
    batchName: string;
  };
  user: {
    name: string | null;
    email: string;
  };
};

const Page = () => {
  const [isMounted, setIsMounted] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [campaignLogs, setCampaignLogs] = useState<CampaignLog[]>([]);

  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(
    null
  );
  const [noteDraft, setNoteDraft] = useState("");
  const [messageDraft, setMessageDraft] = useState("");
  const [currentlyEditingNote, setCurrentlyEditingNote] = useState(false);
  const [currentlyEditingMessage, setCurrentlyEditingMessage] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!session && isMounted) {
      router.push("/");
    }
  }, [session, isMounted, router]);

  const getAllCampaigns = async () => {
    try {
      const response = await fetch("/api/campaign/getAll", {
        method: "GET",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setCampaignLogs(data.logs);
    } catch (err) {
      console.log("Something went wrong", err);
      alert("Something went wrong while fetching.");
    }
  };
  useEffect(() => {
    getAllCampaigns();
  }, []);

  const handleNoteEditClick = (id: string, currentNote: string = "") => {
    setCurrentlyEditingNote(true);
    setEditingCampaignId(id);
    setNoteDraft(currentNote);
  };

  const handleMessageEditClick = (id: string, currentNote: string = "") => {
    setCurrentlyEditingMessage(true);
    setEditingCampaignId(id);
    setMessageDraft(currentNote);
  };

  const handleNoteCancel = () => {
    setEditingCampaignId(null);
    setNoteDraft("");
    setCurrentlyEditingNote(false);
  };

  const handleMessageCancel = () => {
    setEditingCampaignId(null);
    setMessageDraft("");
    setCurrentlyEditingMessage(false);
  };

  const handleNoteEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/campaign/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newNote: noteDraft }),
      });
      if (!res.ok) throw new Error("Failed to update notes");

      // Update the local state after successful patch
      setCampaignLogs((prevLogs) =>
        prevLogs.map((log) =>
          log.id === id ? { ...log, notes: noteDraft } : log
        )
      );
      setEditingCampaignId(null);
      setNoteDraft("");
      setCurrentlyEditingNote(false);
    } catch (error) {
      console.error("Edit error:", error);
      alert("Failed to save the note.");
    }
  };

  const handleMessageEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/campaign/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newMessage: messageDraft }),
      });
      if (!res.ok) throw new Error("Failed to update message");

      // Update the local state after successful patch
      setCampaignLogs((prev) =>
        prev.map((log) =>
          log.id === id
            ? { ...log, campaign: { ...log.campaign, message: messageDraft } }
            : log
        )
      );
      setEditingCampaignId(null);
      setMessageDraft("");
      setCurrentlyEditingMessage(false);
    } catch (error) {
      console.error("Edit error:", error);
      alert("Failed to save the note.");
    }
  };

  const handleNoteSave = (id: string) => {
    setCampaignLogs((prev) =>
      prev.map((log) => (log.id === id ? { ...log, notes: noteDraft } : log))
    );
    handleNoteEdit(editingCampaignId as string);
    setEditingCampaignId(null);
    setNoteDraft("");
  };

  const handleMessageSave = (id: string) => {
    setCampaignLogs((prevLogs) =>
      prevLogs.map((log) =>
        log.id === id
          ? { ...log, campaign: { ...log.campaign, message: messageDraft } }
          : log
      )
    );
    handleMessageEdit(editingCampaignId as string);
    setEditingCampaignId(null);
    setMessageDraft("");
  };

  const handleDeleteCampaign = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this batch?"
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/campaign/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete campaign");
      setCampaignLogs((prev) => prev.filter((campaign) => campaign.id !== id));
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleInitiate = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to initiate this campaign?"
    );
    if (!confirmed) return;

    try {
      // First create delivery logs
      const logsResponse = await fetch(`/api/campaign/${id}/initiate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!logsResponse.ok) {
        throw new Error("Failed to create delivery logs");
      }

      // If POST was successful, update status to COMPLETED
      const statusResponse = await fetch(`/api/campaign/${id}/initiate`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: CampaignStatus.COMPLETED }),
      });

      if (!statusResponse.ok) {
        throw new Error("Failed to update campaign status");
      }

      router.push(`/delivery-receipt/${id}`);
    } catch (error) {
      console.error("Campaign initiation failed:", error);

      // If any error occurs, update status to FAILED
      try {
        await fetch(`/api/campaign/${id}/initiate`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: CampaignStatus.FAILED }),
        });
      } catch (patchError) {
        console.error("Failed to update status to FAILED:", patchError);
      }

      alert(
        `Initiation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  if (!isMounted || status === "loading") {
    return <Loading />;
  }

  return (
    <div className="px-4 sm:px-8 md:px-16 lg:px-20">
      <div>
        <div className="text-xl text-blue-600 font-bold mb-4 mt-6 flex justify-center items-center w-full text-center">
          Your Campaigns
        </div>
        <div className="text-sm flex justify-end items-center w-full px-3 pb-4">
          <span
            onClick={() => router.push("/")}
            className="font-bold cursor-pointer hover:text-blue-600 duration-200 transition-all"
          >
            Back
          </span>
        </div>
        {campaignLogs.length === 0 ? (
          <p>No logs found.</p>
        ) : (
          <ul className="space-y-4">
            {campaignLogs.map((log) => (
              <li
                key={log.id}
                className="p-4 border rounded shadow-md/10 hover:shadow-md/15 transition-all duration-300 flex flex-col gap-4"
              >
                <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-0 sm:items-center max-sm:items-start">
                  <div className="font-bold text-xl flex flex-wrap items-center gap-2">
                    {log.campaign.name}{" "}
                    <span className="text-gray-400 text-sm font-semibold">
                      ({new Date(log.deliveryTime).toLocaleString()})
                    </span>
                  </div>
                  <div
                    className={`${
                      log.campaign.status === "Ready"
                        ? "text-blue-600"
                        : log.campaign.status === "Completed"
                        ? "text-green-600"
                        : "text-red-600"
                    } font-bold tracking-tight text-sm sm:text-base text-right`}
                  >
                    {log.campaign.status.toUpperCase()}
                  </div>
                  {/* <div>{JSON.stringify(log.audience)}</div> */}
                </div>

                <div className="flex flex-col justify-between gap-4 w-full">
                  <div className="flex-1 space-y-1">
                    <div>
                      <span className="font-semibold">Batch:</span>{" "}
                      {log.batch.batchName}
                    </div>
                    <div>
                      <span className="font-semibold">By:</span>{" "}
                      {log.user.name ?? "Unnamed"} ({log.user.email})
                    </div>
                    <div>
                      <span className="font-semibold">Audience Size:</span>{" "}
                      {log.count}{" "}
                    </div>
                    <div className="flex gap-1 justify-center items-center">
                      <div className="font-semibold">Message:</div>
                      {editingCampaignId === log.id &&
                      currentlyEditingMessage ? (
                        <div className="flex items-center gap-2 mt-1 w-full">
                          <input
                            value={messageDraft}
                            onChange={(e) => setMessageDraft(e.target.value)}
                            className="border rounded px-2 py-1 text-sm w-full"
                          />
                          <Check
                            className="text-green-600 cursor-pointer hover:scale-110 transition"
                            onClick={() => handleMessageSave(log.id)}
                          />
                          <X
                            className="text-red-600 cursor-pointer hover:scale-110 transition"
                            onClick={handleMessageCancel}
                          />
                        </div>
                      ) : (
                        <div className="w-full break-all">
                          {log.campaign.message || (
                            <span className="text-gray-400 font-semibold">
                              No messages
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col justify-between">
                    <div className="mt-2 text-sm text-gray-700 font-medium w-full">
                      {editingCampaignId === log.id && currentlyEditingNote ? (
                        <div className="flex items-center gap-2 mt-1 w-full">
                          <input
                            value={noteDraft}
                            onChange={(e) => setNoteDraft(e.target.value)}
                            className="border rounded px-2 py-1 text-sm w-full"
                          />
                          <Check
                            className="text-green-600 cursor-pointer hover:scale-110 transition"
                            onClick={() => handleNoteSave(log.id)}
                          />
                          <X
                            className="text-red-600 cursor-pointer hover:scale-110 transition"
                            onClick={handleNoteCancel}
                          />
                        </div>
                      ) : (
                        <div className="w-full text-gray-500 font-semibold break-all">
                          {log.notes || (
                            <span className="text-gray-400 font-semibold">
                              No notes
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex-grow" />
                    <div className="flex justify-end gap-2 mt-4">
                      {editingCampaignId !== log.id && (
                        <div className="flex justify-center items-center gap-2">
                          <Button
                            onClick={() =>
                              handleNoteEditClick(log.id, log.notes || "")
                            }
                            className="cursor-pointer bg-green-700/90 hover:bg-green-700 transition-all duration-300 rounded-full px-4 py-0 text-sm"
                          >
                            Edit note
                          </Button>
                          <Button
                            onClick={() =>
                              handleMessageEditClick(
                                log.id,
                                log.campaign.message || ""
                              )
                            }
                            className="cursor-pointer bg-green-700/90 hover:bg-green-700 transition-all duration-300 rounded-full px-4 py-0 text-sm"
                          >
                            Edit message
                          </Button>
                        </div>
                      )}
                      {log.campaign.status === CampaignStatus.READY ? (
                        <Button
                          onClick={() => handleInitiate(log.id)}
                          className="cursor-pointer bg-blue-600 hover:bg-blue-700 transition-all duration-300 rounded-full px-4 py-0 text-sm"
                        >
                          Initiate
                        </Button>
                      ) : (
                        <Button
                          onClick={() =>
                            router.push(`/delivery-receipt/${log.id}`)
                          }
                          className="cursor-pointer bg-blue-600 hover:bg-blue-700 transition-all duration-300 rounded-full px-4 py-0 text-sm"
                        >
                          View Logs
                        </Button>
                      )}
                      <Button
                        onClick={() => handleDeleteCampaign(log.id)}
                        className="cursor-pointer bg-red-700/90 hover:bg-red-700 transition-all duration-300 rounded-full px-4 py-0 text-sm"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div
          onClick={() => router.push("/dashboard")}
          className="flex w-full justify-end items-center pt-8 pb-4 text-sm font-bold px-3 "
        >
          <span className="cursor-pointer hover:text-green-700 duration-300 transition-all">
            Create More
          </span>
        </div>
      </div>
    </div>
  );
};

export default Page;
