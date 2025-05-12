// "use client";
// import React, { useState } from "react";
// import { X } from "lucide-react";
// // import { Input } from "@/components/ui/input";
// // import { Button } from "@/components/ui/button";

// type FieldType = "number" | "date" | "string";

// const fieldOptions: { value: string; label: string; type: FieldType }[] = [
//   { value: "amountSpent", label: "Amount Spent", type: "number" },
//   { value: "lastLoggedIn", label: "Last Logged In", type: "date" },
//   { value: "lastOrderDate", label: "Last Order Date", type: "date" },
//   { value: "createdAt", label: "Created At", type: "date" },
//   { value: "location", label: "Location", type: "string" },
//   { value: "email", label: "Email", type: "string" },
//   { value: "phone", label: "Phone", type: "string" },
// ];

// const operatorsByType = {
//   number: [">", "<", ">=", "<=", "=", "!="],
//   date: [">", "<", ">=", "<=", "=", "!="],
//   string: ["=", "!=", "contains", "not contains"],
// };

// type Rule = {
//   field: string;
//   operator: string;
//   value: string;
// };

// type RuleBuilderProps = {
//   batchId: "string";
// };

// const RuleBuilder = ({ batchId }: RuleBuilderProps) => {
//   const [rules, setRules] = useState<Rule[]>([
//     {
//       field: "Field",
//       operator: "Operator",
//       value: "Value",
//     },
//   ]);
//   const [condition, setCondition] = useState<"AND" | "OR">("AND");
//   const [count, setCount] = useState(0);

//   const handleAddRule = () => {
//     setRules([...rules, { field: "", operator: "", value: "" }]);
//   };
//   const handleRemoveRule = (index: number) => {
//     setRules(rules.filter((_, i) => i !== index));
//   };

//   const handleChange = (index: number, key: keyof Rule, value: string) => {
//     const updatedRules = [...rules];
//     updatedRules[index][key] = value;

//     if (key === "field") {
//       updatedRules[index].operator = "";
//       updatedRules[index].value = "";
//     }

//     setRules(updatedRules);
//   };

//   const handlePreview = async () => {
//     try {
//       const response = await fetch("/api/audience/preview", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           rules,
//           condition,
//           campaignId: "yourCampaignIdHere", // You can dynamically pass this
//         }),
//       });

//       const data = await response.json();

//       if (!response.ok) throw new Error(data.message);

//       //   alert(`Matching audience: ${data.count}`);
//       setCount(data.count);
//     } catch (err) {
//       console.error(err);
//       alert("Something went wrong while previewing.");
//     }
//   };

//   return (
//     <div className="space-y-4 p-4 w-full mx-auto">
//       <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
//         <h2 className="text-xl font-bold text-gray-800">Audience Rules</h2>
//         <select
//           value={condition}
//           onChange={(e) => setCondition(e.target.value as "AND" | "OR")}
//           className="w-full max-w-60 border-2 border-gray-200 rounded-lg px-4 py-2 text-base focus:outline-none focus:border-blue-500 cursor-pointer"
//         >
//           <option value="AND">ALL conditions (AND)</option>
//           <option value="OR">ANY condition (OR)</option>
//         </select>
//       </div>

//       <div className="space-y-4">
//         {rules.map((rule, index) => {
//           const selectedField = fieldOptions.find(
//             (f) => f.value === rule.field
//           );
//           const fieldType = selectedField?.type || "string";
//           const operators = operatorsByType[fieldType];

//           return (
//             <div
//               key={index}
//               className="flex flex-col md:flex-row gap-2 items-start md:items-center"
//             >
//               {/* Field Selector */}
//               <div className="w-full md:flex-1">
//                 <select
//                   value={rule.field}
//                   onChange={(e) => handleChange(index, "field", e.target.value)}
//                   className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:outline-none focus:border-blue-500"
//                 >
//                   <option value="">Field</option>
//                   {fieldOptions.map((f) => (
//                     <option key={f.value} value={f.value}>
//                       {f.label}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               {/* Operator Selector */}
//               <div className="w-full md:w-36">
//                 <select
//                   value={rule.operator}
//                   onChange={(e) =>
//                     handleChange(index, "operator", e.target.value)
//                   }
//                   className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:outline-none focus:border-blue-500"
//                   disabled={!rule.field}
//                 >
//                   <option value="">Operator</option>
//                   {operators.map((op) => (
//                     <option key={op} value={op}>
//                       {op}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               {/* Value Input */}
//               <div className="w-full md:flex-1">
//                 {fieldType === "date" ? (
//                   <input
//                     type="date"
//                     value={rule.value}
//                     onChange={(e) =>
//                       handleChange(index, "value", e.target.value)
//                     }
//                     className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:outline-none focus:border-blue-500"
//                   />
//                 ) : fieldType === "number" ? (
//                   <input
//                     type="number"
//                     value={rule.value}
//                     onChange={(e) =>
//                       handleChange(index, "value", e.target.value)
//                     }
//                     className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:outline-none focus:border-blue-500"
//                     placeholder="Enter value"
//                   />
//                 ) : (
//                   <input
//                     type="text"
//                     value={rule.value}
//                     onChange={(e) =>
//                       handleChange(index, "value", e.target.value)
//                     }
//                     className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-base focus:outline-none focus:border-blue-500"
//                     placeholder="Enter value"
//                   />
//                 )}
//               </div>

//               <button
//                 onClick={() => handleRemoveRule(index)}
//                 className="w-fit p-1 cursor-pointer bg-red-700/90 text-white hover:bg-red-700 rounded-full font-medium transition-all"
//               >
//                 <X height={16} width={16} />
//               </button>
//             </div>
//           );
//         })}
//       </div>

//       <div className="flex flex-col sm:flex-row gap-3 mt-6">
//         <button
//           onClick={handleAddRule}
//           className="flex-1 px-3 py-2 cursor-pointer bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
//         >
//           + Add Rule
//         </button>
//         <button
//           onClick={handlePreview}
//           className="flex-1 px-3 py-2 cursor-pointer bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all"
//         >
//           Preview Audience
//         </button>
//       </div>
//       <div>Count: {count}</div>
//     </div>
//   );
// };

// export default RuleBuilder;
