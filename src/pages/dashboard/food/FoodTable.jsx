import React, { useState, useEffect, useCallback } from "react";
import { Leaf, Info, Calendar, User, Clock, ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import dayjs from "dayjs";
import { Spin, message, Tooltip, DatePicker, Tag, Avatar, Card } from "antd";
import foodService from "../../../services/foodService";

const FoodTable = ({ refreshKey }) => {
  const [activeTab, setActiveTab] = useState("food");
  const [startOfWeekStr, setStartOfWeekStr] = useState(dayjs().startOf('week').add(1, 'day').format("YYYY-MM-DD"));
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);

  // For Responses Tab
  const [selectedDate, setSelectedDate] = useState(dayjs().add(1, 'day'));
  const [dailyResponses, setDailyResponses] = useState({ users: [], breakfast_count: 0, lunch_count: 0, dinner_count: 0, total_users: 0 });
  const [responsesLoading, setResponsesLoading] = useState(false);

  const startOfWeek = dayjs(startOfWeekStr);
  const endOfWeek = startOfWeek.add(6, "day");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const sDate = startOfWeek.format("YYYY-MM-DD");
      const eDate = endOfWeek.format("YYYY-MM-DD");

      const [summaryResp, availabilityResp] = await Promise.all([
        foodService.getWeeklySummary(sDate, eDate),
        foodService.getWeeklyAvailability(sDate, eDate)
      ]);

      const summaries = summaryResp.data.data || [];
      const availabilities = availabilityResp.data.data || [];

      const merged = [];
      for (let i = 0; i < 7; i++) {
        const date = startOfWeek.add(i, "day").format("YYYY-MM-DD");
        const summary = summaries.find((s) => dayjs(s.poll_date || s.date).format("YYYY-MM-DD") === date) || {
          poll_date: date,
          breakfast_count: 0,
          lunch_count: 0,
          dinner_count: 0,
          total_users: 0
        };
        const availability = availabilities.find((a) => dayjs(a.poll_date).format("YYYY-MM-DD") === date);

        merged.push({
          ...summary,
          availability: availability || null
        });
      }

      setSchedule(merged);
    } catch (error) {
      console.error("Error fetching food data:", error);
      message.error("Failed to load food schedule");
    } finally {
      setLoading(false);
    }
  }, [startOfWeekStr]); // Dependency on the string representation to avoid re-creation

  const fetchDailyResponses = async (date) => {
    setResponsesLoading(true);
    try {
      const resp = await foodService.getDailySummary(date.format("YYYY-MM-DD"));
      setDailyResponses(resp.data.data || { users: [], breakfast_count: 0, lunch_count: 0, dinner_count: 0, total_users: 0 });
    } catch (error) {
      if (error?.response?.status !== 404) {
        console.error("Error fetching daily responses:", error);
        message.error("Failed to load poll responses");
      }
      setDailyResponses({ users: [], breakfast_count: 0, lunch_count: 0, dinner_count: 0, total_users: 0 });
    } finally {
      setResponsesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "food") {
      fetchData();
    } else if (activeTab === "responses" || activeTab === "polls") {
      fetchDailyResponses(selectedDate);
    }
  }, [activeTab, fetchData, selectedDate, refreshKey]);

  const handlePrevWeek = () => setStartOfWeekStr(startOfWeek.subtract(7, "day").format("YYYY-MM-DD"));
  const handleNextWeek = () => setStartOfWeekStr(startOfWeek.add(7, "day").format("YYYY-MM-DD"));

  const getMealBadge = (count, isAvailable = true) => {
    if (!isAvailable) return <Tag color="error" className="rounded-full">Not Available</Tag>;
    if (count > 0) return <Tag color="success" className="rounded-full" icon={<Leaf size={12} className="inline mr-1" />}>{count} Choice{count > 1 ? 's' : ''}</Tag>;
    return <Tag color="default" className="rounded-full">None</Tag>;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header / Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between p-4 sm:p-6 border-b border-gray-100 gap-6">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
          {[
            { id: "food", label: "Food Calendar", icon: Calendar },
            { id: "polls", label: "Live Poll Status", icon: Clock },
            { id: "responses", label: "Resident Choices", icon: User },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === tab.id
                ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                : "text-gray-400 hover:bg-gray-50 hover:text-gray-600 border border-transparent"
                }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {activeTab === "food" ? (
            <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
              <button onClick={handlePrevWeek} className="p-2 hover:bg-white rounded-lg transition-colors shadow-sm text-gray-400 hover:text-blue-600"><ChevronLeft size={18} /></button>
              <span className="font-bold text-gray-600 px-3 min-w-[140px] text-center text-xs uppercase tracking-wide">
                {startOfWeek.format("MMM D")} - {endOfWeek.format("MMM D")}
              </span>
              <button onClick={handleNextWeek} className="p-2 hover:bg-white rounded-lg transition-colors shadow-sm text-gray-400 hover:text-blue-600"><ChevronRight size={18} /></button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Select Date:</span>
              <DatePicker
                value={selectedDate}
                onChange={(date) => date && setSelectedDate(date)}
                allowClear={false}
                className="rounded-xl h-10 border-gray-200 font-bold text-gray-600"
              />
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 sm:p-6">
        {activeTab === "food" && (
          <div className="overflow-x-auto rounded-xl">
            {loading ? (
              <div className="flex flex-col justify-center items-center h-80 gap-4">
                <Spin size="large" />
                <p className="text-gray-400 animate-pulse font-medium">Syncing meal schedule...</p>
              </div>
            ) : (
              <table className="w-full text-sm text-left border-separate border-spacing-y-2">
                <thead className="text-gray-400 uppercase text-[10px] font-black tracking-widest">
                  <tr>
                    <th className="px-6 py-2">Day / Date</th>
                    <th className="px-6 py-2">Breakfast</th>
                    <th className="px-6 py-2">Lunch</th>
                    <th className="px-6 py-2">Dinner</th>
                    <th className="px-6 py-2">Availability</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((row) => (
                    <tr key={row.poll_date} className="bg-white group hover:scale-[1.005] transition-transform duration-200 shadow-sm border border-gray-100">
                      <td className="px-6 py-4 rounded-l-2xl border-y border-l border-gray-100">
                        <div className="font-black text-gray-800 text-base">{dayjs(row.poll_date).format("dddd")}</div>
                        <div className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">{dayjs(row.poll_date).format("MMM D, YYYY")}</div>
                      </td>
                      <td className="px-6 py-4 border-y border-gray-100">{getMealBadge(row.breakfast_count, row.availability?.available_meals?.includes('breakfast') ?? true)}</td>
                      <td className="px-6 py-4 border-y border-gray-100">{getMealBadge(row.lunch_count, row.availability?.available_meals?.includes('lunch') ?? true)}</td>
                      <td className="px-6 py-4 border-y border-gray-100">{getMealBadge(row.dinner_count, row.availability?.available_meals?.includes('dinner') ?? true)}</td>
                      <td className="px-6 py-4 rounded-r-2xl border-y border-r border-gray-100">
                        <div className="flex items-center gap-2">
                          <Tag color={row.availability?.status === 'Confirmed' ? 'green' : 'orange'} className="rounded-full px-3 font-bold border-none py-0.5">
                            {row.availability?.status || 'Pending'}
                          </Tag>
                          {row.availability?.notes?.length > 0 && (
                            <Tooltip title={row.availability.notes.join(", ")}><Info size={14} className="text-blue-400 cursor-help" /></Tooltip>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "polls" && (
          <div className="min-h-[400px] animate-in fade-in duration-500">
            {responsesLoading ? <div className="flex justify-center items-center h-80"><Spin /></div> : (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { label: "Breakfast Requests", count: dailyResponses.breakfast_count, color: "#10b981", bg: "bg-green-50" },
                    { label: "Lunch Requests", count: dailyResponses.lunch_count, color: "#3b82f6", bg: "bg-blue-50" },
                    { label: "Dinner Requests", count: dailyResponses.dinner_count, color: "#f59e0b", bg: "bg-orange-50" }
                  ].map(item => (
                    <Card key={item.label} bordered={false} className={`${item.bg} rounded-3xl text-center hover:translate-y-[-4px] transition-transform`}>
                      <div style={{ color: item.color }} className="text-5xl font-black mb-1">{item.count}</div>
                      <div className="text-gray-500 font-bold text-[10px] uppercase tracking-widest">{item.label}</div>
                    </Card>
                  ))}
                </div>
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl text-white shadow-xl shadow-blue-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="text-center sm:text-left">
                    <h3 className="text-2xl font-black mb-1">Response Rate</h3>
                    <p className="text-blue-100 text-sm font-medium">Monitoring resident submissions for {selectedDate.format("dddd, MMM D")}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-5xl font-black">{dailyResponses.total_users}</div>
                      <div className="text-blue-200 font-bold text-[10px] uppercase tracking-widest mt-1">Total Submissions</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "responses" && (
          <div className="overflow-x-auto rounded-2xl border border-gray-100 animate-in slide-in-from-bottom-2 duration-500">
            {responsesLoading ? <div className="flex flex-col justify-center items-center h-80 gap-3"><Spin /> <p className="text-xs text-gray-400 font-bold uppercase">Collating preferences...</p></div> :
              (!dailyResponses.users || dailyResponses.users.length === 0) ? (
                <div className="p-20 text-center bg-gray-50 flex flex-col items-center">
                  <div className="bg-white p-6 rounded-full shadow-sm mb-4">
                    <User size={40} className="text-gray-200" />
                  </div>
                  <h3 className="text-gray-800 font-black mb-1">No responses yet</h3>
                  <p className="text-gray-400 text-sm max-w-xs mx-auto">Residents haven't submitted their choices for this specific date in the chosen range.</p>
                </div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-400 uppercase text-[10px] font-black tracking-widest">
                    <tr>
                      <th className="px-6 py-4">Resident Profile</th>
                      <th className="px-6 py-4 text-center">Breakfast</th>
                      <th className="px-6 py-4 text-center">Lunch</th>
                      <th className="px-6 py-4 text-center">Dinner</th>
                      <th className="px-6 py-4 text-right">Time Logged</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {dailyResponses.users.map((u) => (
                      <tr key={u.user_id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="bg-blue-600 font-black flex-shrink-0">{u.name[0]}</Avatar>
                            <div>
                              <div className="font-black text-gray-800 leading-tight">{u.name}</div>
                              <div className="text-[10px] text-gray-400 font-medium">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">{u.breakfast ? <div className="bg-green-100 text-green-700 w-8 h-8 rounded-full flex items-center justify-center mx-auto"><Check size={16} strokeWidth={3} /></div> : <div className="bg-gray-100 text-gray-300 w-8 h-8 rounded-full flex items-center justify-center mx-auto"><X size={16} strokeWidth={3} /></div>}</td>
                        <td className="px-6 py-4 text-center">{u.lunch ? <div className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center mx-auto"><Check size={16} strokeWidth={3} /></div> : <div className="bg-gray-100 text-gray-300 w-8 h-8 rounded-full flex items-center justify-center mx-auto"><X size={16} strokeWidth={3} /></div>}</td>
                        <td className="px-6 py-4 text-center">{u.dinner ? <div className="bg-orange-100 text-orange-700 w-8 h-8 rounded-full flex items-center justify-center mx-auto"><Check size={16} strokeWidth={3} /></div> : <div className="bg-gray-100 text-gray-300 w-8 h-8 rounded-full flex items-center justify-center mx-auto"><X size={16} strokeWidth={3} /></div>}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-gray-800 font-black text-xs">{dayjs(u.last_updated).format("hh:mm A")}</div>
                          <div className="text-[10px] text-gray-400 font-bold uppercase">{dayjs(u.last_updated).format("MMM DD")}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodTable;
