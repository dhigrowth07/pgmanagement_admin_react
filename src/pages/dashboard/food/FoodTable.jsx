import React, { useState } from "react";
import { Leaf, Drumstick } from "lucide-react";
import dayjs from "dayjs";

const FoodTable = () => {
  const [activeTab, setActiveTab] = useState("food");
  const [startOfWeek, setStartOfWeek] = useState(dayjs("2024-01-15"));

  const endOfWeek = startOfWeek.add(6, "day");

  const handlePrevWeek = () => {
    setStartOfWeek(startOfWeek.subtract(7, "day"));
  };

  const handleNextWeek = () => {
    setStartOfWeek(startOfWeek.add(7, "day"));
  };

  const schedule = [
    {
      day: "Monday",
      breakfast: "veg",
      lunch: "nonveg",
      dinner: "veg",
      status: "Confirmed",
    },
    {
      day: "Tuesday",
      breakfast: "veg",
      lunch: "veg",
      dinner: "nonveg",
      status: "Pending",
    },
  ];

  const getMealBadge = (type) => {
    if (type === "veg") {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
          <Leaf className="w-3 h-3 mr-1" /> Veg Available
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full">
          <Drumstick className="w-3 h-3 mr-1" /> Non-Veg Available
        </span>
      );
    }
  };

  const getStatusBadge = (status) => {
    const colorMap = {
      Confirmed: "text-blue-700 bg-blue-100",
      Pending: "text-orange-700 bg-orange-100",
    };
    return (
      <span
        className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${colorMap[status]}`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      {/* Tabs */}
      <div className="flex items-center border-b border-gray-200 mb-4">
        {[
          { id: "food", label: "Food Calendar" },
          { id: "polls", label: "Active Polls" },
          { id: "responses", label: "Poll Responses" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`text-sm font-medium px-4 py-2 ${
              activeTab === tab.id
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500"
            }`}
          >
            {tab.label}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2 text-sm text-gray-600">
          <button
            onClick={handlePrevWeek}
            className="px-2 py-1 hover:text-black"
          >
            &lt;
          </button>
          <span className="whitespace-nowrap">
            {startOfWeek.format("MMM D")} - {endOfWeek.format("MMM D, YYYY")}
          </span>
          <button
            onClick={handleNextWeek}
            className="px-2 py-1 hover:text-black"
          >
            &gt;
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "food" && (
        <>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Weekly Food Schedule
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-separate border-spacing-y-2">
              <thead className="text-gray-500">
                <tr>
                  <th className="p-2">Day</th>
                  <th className="p-2">Breakfast</th>
                  <th className="p-2">Lunch</th>
                  <th className="p-2">Dinner</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((row) => (
                  <tr
                    key={row.day}
                    className="bg-white border rounded-lg shadow-sm"
                  >
                    <td className="p-3 font-medium text-gray-800">{row.day}</td>
                    <td className="p-3">{getMealBadge(row.breakfast)}</td>
                    <td className="p-3">{getMealBadge(row.lunch)}</td>
                    <td className="p-3">{getMealBadge(row.dinner)}</td>
                    <td className="p-3">{getStatusBadge(row.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === "polls" && (
        <div className="text-gray-600 text-sm">No active polls this week.</div>
      )}

      {activeTab === "responses" && (
        <div className="text-gray-600 text-sm">
          No poll responses submitted yet.
        </div>
      )}
    </div>
  );
};

export default FoodTable;
