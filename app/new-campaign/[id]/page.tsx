"use client";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Loading from "@/components/Loading";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Customer {
  id: string;
  userId: string;
  batchId: string;
  customerId: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  amountSpent: number;
  lastLoggedIn: string; // Can be Date type if needed
  lastOrderDate: string; // Can be Date type if needed
  createdAt: string; // Can be Date type if needed
}

type FieldType = "number" | "date" | "string";

const fieldOptions: { value: string; label: string; type: FieldType }[] = [
  { value: "amountSpent", label: "Amount Spent", type: "number" },
  { value: "lastLoggedIn", label: "Last Logged In", type: "date" },
  { value: "lastOrderDate", label: "Last Order Date", type: "date" },
  { value: "location", label: "Location", type: "string" },
  { value: "email", label: "Email", type: "string" },
  { value: "phone", label: "Phone", type: "string" },
];

const operatorsByType = {
  number: [">", "<", ">=", "<=", "=", "!="],
  date: [">", "<", ">=", "<=", "=", "!="],
  string: ["=", "!=", "contains", "not contains"],
};

type Rule = {
  field: string;
  operator: string;
  value: string;
};

const Page = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [rules, setRules] = useState<Rule[]>([
    {
      field: "Field",
      operator: "Operator",
      value: "Value",
    },
  ]);
  const [condition, setCondition] = useState<"AND" | "OR">("AND");
  const [count, setCount] = useState(0);
  const [flag, setFlag] = useState(false);
  const [openSaveDiv, setOpenSaveDiv] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [campaignMessage, setCampaignMessage] = useState("");
  const [matchedCustomers, setMatchedCustomers] = useState<Customer[]>([]);
  const { data: session, status } = useSession();
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

  if (!isMounted || status === "loading") {
    return <Loading />;
  }

  const handleAddRule = () => {
    setRules([...rules, { field: "", operator: "", value: "" }]);
  };
  const handleRemoveRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, key: keyof Rule, value: string) => {
    const updatedRules = [...rules];
    updatedRules[index][key] = value;

    if (key === "field") {
      updatedRules[index].operator = "";
      updatedRules[index].value = "";
    }

    setRules(updatedRules);
  };

  const handleApplyRules = async () => {
    const isARuleWrong = rules.some((rule) => {
      const fieldValid = fieldOptions.some((f) => f.value === rule.field);
      const type = fieldOptions.find((f) => f.value === rule.field)?.type;
      const operatorValid = type
        ? operatorsByType[type].includes(rule.operator)
        : false;
      const valueValid = rule.value.trim() !== "";

      return !(fieldValid && operatorValid && valueValid);
    });
    if (isARuleWrong) {
      alert("Please make sure all rules are complete");
      return;
    }

    try {
      const response = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rules,
          condition,
          batchId: id,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message);
      console.log(data);

      setCount(data.count);
      setMatchedCustomers(data.matchedCustomers);
      console.log(matchedCustomers);
      setFlag(true);
    } catch (err) {
      console.error(err);
      alert("Something went wrong while previewing.");
    }
  };

  const handleSaveCampaign = async () => {
    if (campaignName.trim() === "" || campaignMessage.trim() === "") {
      alert("Please input valid campaign name and message");
      return;
    }

    try {
      const response = await fetch("/api/campaign/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId: id,
          campaignName: campaignName,
          campaignMessage: campaignMessage,
          matchedCustomers: matchedCustomers,
          count: count,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      router.push("/campaigns");
    } catch (err) {
      console.error(err);
      alert("Something went wrong while saving.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center px-4">
      <div className="flex w-full max-w-5xl mt-10">
        <div className="w-full font-bold text-xl">Dynamic Rule Builder</div>
        <div className="text-sm flex justify-end items-center w-full px-3 pb-4">
          <span
            onClick={() => router.push("/dashboard")}
            className="font-bold cursor-pointer hover:text-blue-600 duration-200 transition-all"
          >
            Back
          </span>
        </div>
      </div>

      <div className="mt-4 w-full max-w-5xl bg-white p-6 rounded-lg shadow-md">
        <div className="space-y-4 p-4 w-full mx-auto">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <h2 className="text-xl font-bold text-gray-800">Audience Rules</h2>
            <select
              value={condition}
              onChange={(e) => (
                setFlag(false), setCondition(e.target.value as "AND" | "OR")
              )}
              className="w-full max-w-60 border-2 border-gray-200 rounded-lg px-4 py-2 text-base focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="AND">ALL conditions (AND)</option>
              <option value="OR">ANY condition (OR)</option>
            </select>
          </div>

          <div className="space-y-4">
            {rules.map((rule, index) => {
              const selectedField = fieldOptions.find(
                (f) => f.value === rule.field
              );
              const fieldType = selectedField?.type || "string";
              const operators = operatorsByType[fieldType];

              return (
                <div
                  key={index}
                  className="flex flex-col md:flex-row gap-2 items-start md:items-center"
                >
                  {/* Field Selector */}
                  <div className="w-full md:flex-1">
                    <select
                      value={rule.field}
                      onChange={(e) => (
                        setFlag(false),
                        handleChange(index, "field", e.target.value)
                      )}
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Field</option>
                      {fieldOptions.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Operator Selector */}
                  <div className="w-full md:w-36">
                    <select
                      value={rule.operator}
                      onChange={(e) => (
                        setFlag(false),
                        handleChange(index, "operator", e.target.value)
                      )}
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:outline-none focus:border-blue-500"
                      disabled={!rule.field}
                    >
                      <option value="">Operator</option>
                      {operators.map((op) => (
                        <option key={op} value={op}>
                          {op}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Value Input */}
                  <div className="w-full md:flex-1">
                    {fieldType === "date" ? (
                      <input
                        type="date"
                        value={rule.value}
                        onChange={(e) => (
                          setFlag(false),
                          handleChange(index, "value", e.target.value)
                        )}
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:outline-none focus:border-blue-500"
                      />
                    ) : fieldType === "number" ? (
                      <input
                        type="number"
                        value={rule.value}
                        min={0}
                        onChange={(e) => (
                          setFlag(false),
                          handleChange(index, "value", e.target.value)
                        )}
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:outline-none focus:border-blue-500"
                        placeholder="Enter value"
                      />
                    ) : (
                      <input
                        type="text"
                        value={rule.value}
                        onChange={(e) => (
                          setFlag(false),
                          handleChange(index, "value", e.target.value)
                        )}
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:outline-none focus:border-blue-500"
                        placeholder="Enter value"
                      />
                    )}
                  </div>

                  <button
                    onClick={() => (setFlag(false), handleRemoveRule(index))}
                    className="w-fit p-1.5 cursor-pointer  bg-red-700/90 text-white hover:bg-red-700 rounded-full font-medium transition-all"
                  >
                    <Trash2 height={15} width={15} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              onClick={() => (setFlag(false), handleAddRule())}
              className="flex-1 px-3 py-2 cursor-pointer bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
            >
              + Add Rule
            </button>
            <button
              onClick={handleApplyRules}
              className={`${
                rules.length === 0
                  ? "bg-gray-600 pointer-events-none"
                  : "bg-green-600"
              } flex-1 px-3 py-2 cursor-pointer text-white rounded-lg font-medium hover:bg-green-700 transition-all`}
            >
              {rules.length === 0
                ? "Add a rule to apply"
                : rules.length === 1
                ? "Apply Rule"
                : "Apply Rules"}
            </button>
          </div>
        </div>
        {flag && (
          <div>
            <div className="mt-4 gap-1 font-bold flex justify-center items-center flex-1 w-full">
              <span className="text-blue-700">{count}</span>
              <span className="text-blue-700">
                {count === 1 ? "customer" : "customers"} matched
              </span>{" "}
              with selected rules.{" "}
            </div>

            {!openSaveDiv && (
              <div className="mt-5 gap-1 font-bold flex justify-center items-center flex-1 w-full">
                <Button
                  onClick={() => setOpenSaveDiv(true)}
                  className="cursor-pointer"
                >
                  Save Campaign
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
      {openSaveDiv && (
        <div className="mt-8 w-full max-w-4xl bg-white py-5 px-8 rounded-lg shadow-md">
          <div className="space-y-3.5">
            <div className="font-semibold text-base mb-6 ">
              Add your campaign name and personalised campaign message
            </div>
            <div className="flex gap-3 flex-1 justify-center items-center text-sm">
              <label className="min-w-fit" htmlFor="campaign-name">
                Campaign Name:{" "}
              </label>
              <input
                autoComplete="off"
                type="text"
                name="campaignName"
                onChange={(e) => setCampaignName(e.target.value)}
                className="w-full text-xs border-2 border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                placeholder="Your campaign will be saved by this name"
              />
            </div>
            <div className="flex gap-3 flex-1 justify-center items-center text-sm">
              <label className="min-w-fit" htmlFor="campaign-name">
                Campaign Message:{" "}
              </label>
              <input
                autoComplete="off"
                type="text"
                name="campaignText"
                onChange={(e) => setCampaignMessage(e.target.value)}
                className="w-full text-xs border-2 border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                placeholder="This message will be sent to the selected audience"
              />
            </div>
          </div>
          <div className="flex flex-1 justify-center items-center mt-5 gap-3">
            <div>
              <Button
                onClick={handleSaveCampaign}
                className="cursor-pointer transition-all duration-300"
              >
                Save
              </Button>
            </div>
            <div>
              <Button
                onClick={() => (
                  setOpenSaveDiv(false),
                  setCampaignName(""),
                  setCampaignMessage("")
                )}
                className="cursor-pointer bg-red-700/90 hover:bg-red-700 transition-all duration-300"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;
