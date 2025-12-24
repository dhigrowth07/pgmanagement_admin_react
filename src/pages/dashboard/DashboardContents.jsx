import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loader2, AlertCircle, Home, ShieldAlert, IndianRupee, UserPlus, Plus, FileText, Calendar, LogOut } from "lucide-react";
import { Users } from "lucide-react";

import { fetchAllCustomers, selectAllCustomers, selectCustomerStatus } from "../../redux/customer/customerSlice";
import { fetchRoomsData, selectAllRooms, selectRoomStatus } from "../../redux/room/roomSlice";
import { fetchAllIssues, selectAllIssues, selectIssueStatus } from "../../redux/issue/issueSlice";
import { fetchStatistics, selectPaymentStatistics, selectPaymentStatus } from "../../redux/payment/paymentSlice";
import { selectUser } from "../../redux/auth/authSlice";
import { fetchDashboardMetrics, selectDashboardMetrics, selectVacatingUsersCount, selectVacatingUsers, selectDashboardStatus, selectDashboardError } from "../../redux/dashboard/dashboardSlice";

const Card = React.forwardRef(({ className, ...props }, ref) => <div ref={ref} className={`rounded-lg border bg-white text-card-foreground shadow-sm ${className || ""}`} {...props} />);
Card.displayName = "Card";

const CardContent = React.forwardRef(({ className, ...props }, ref) => <div ref={ref} className={`p-6 ${className || ""}`} {...props} />);
CardContent.displayName = "CardContent";

const Alert = React.forwardRef(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={`relative w-full rounded-lg border p-4 ${variant === "destructive" ? "border-destructive/50 text-destructive dark:border-destructive" : "border-border"} ${className || ""}`}
    {...props}
  />
));
Alert.displayName = "Alert";

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => <div ref={ref} className={`text-sm [&_p]:leading-relaxed ${className || ""}`} {...props} />);
AlertDescription.displayName = "AlertDescription";

const DashboardContents = ({ onMenuChange }) => {
  const dispatch = useDispatch();

  const customers = useSelector(selectAllCustomers);
  const rooms = useSelector(selectAllRooms);
  const issues = useSelector(selectAllIssues);
  const paymentStats = useSelector(selectPaymentStatistics);
  const user = useSelector(selectUser);
  const isPaymentEnabled = user?.feature_permissions?.is_payment_enabled;

  // Dashboard metrics from API
  const dashboardMetrics = useSelector(selectDashboardMetrics);
  const vacatingUsersCount = useSelector(selectVacatingUsersCount);
  const vacatingUsers = useSelector(selectVacatingUsers);
  const dashboardStatus = useSelector(selectDashboardStatus);
  const dashboardError = useSelector(selectDashboardError);

  const customerStatus = useSelector(selectCustomerStatus);
  const roomStatus = useSelector(selectRoomStatus);
  const issueStatus = useSelector(selectIssueStatus);
  const paymentStatus = useSelector(selectPaymentStatus);

  useEffect(() => {
    // Fetch dashboard metrics from API
    dispatch(fetchDashboardMetrics());

    // Keep existing fetches for backward compatibility
    dispatch(fetchAllCustomers());
    dispatch(fetchRoomsData());
    dispatch(fetchAllIssues());
    if (isPaymentEnabled) {
      dispatch(fetchStatistics());
    }
  }, [dispatch, isPaymentEnabled]);

  const stats = useMemo(() => {
    // Use API metrics if available, otherwise fall back to calculated stats
    if (dashboardMetrics && dashboardMetrics.length > 0) {
      const metricsMap = {};
      dashboardMetrics.forEach((metric) => {
        metricsMap[metric.label] = metric.value;
      });
      return {
        totalCustomers: metricsMap["Active Customers"] || "0",
        occupiedRooms: metricsMap["Occupied Rooms"] || "0",
        unresolvedIssues: metricsMap["Unresolved Issues"] || "0",
        totalCollected: isPaymentEnabled ? metricsMap["Total Collected"] || "₹0" : "₹0",
        vacatingUsers: metricsMap["Vacating Users"] || "0",
      };
    }

    // Fallback to calculated stats
    return {
      totalCustomers:
        customers?.filter((c) => {
          const hasRoom = !!c.room_id;
          const isActive = c.is_active === true;
          const hasNotVacated = !c.vacated_date;
          return hasRoom && isActive && hasNotVacated;
        }).length || 0,
      occupiedRooms: rooms?.filter((r) => r.current_occupancy === r.capacity).length || 0,
      unresolvedIssues: issues?.filter((i) => i.status === "unresolved").length || 0,
      totalCollected: isPaymentEnabled ? paymentStats?.total_collected || 0 : 0,
      vacatingUsers: vacatingUsersCount || 0,
    };
  }, [dashboardMetrics, customers, rooms, issues, paymentStats, isPaymentEnabled, vacatingUsersCount]);

  const isLoading = [customerStatus, roomStatus, issueStatus, dashboardStatus, ...(isPaymentEnabled ? [paymentStatus] : [])].includes("loading");
  const anyError = [customerStatus, roomStatus, issueStatus, dashboardStatus, ...(isPaymentEnabled ? [paymentStatus] : [])].includes("failed") || dashboardError;

  const dashboardItems = [
    {
      title: "Active Customers",
      value: typeof stats.totalCustomers === "string" ? stats.totalCustomers : stats.totalCustomers.toLocaleString(),
      icon: Users,
      menuKey: "customers",
      iconColor: "bg-blue-500",
    },
    {
      title: "Fully Occupied Rooms",
      value: typeof stats.occupiedRooms === "string" ? stats.occupiedRooms : stats.occupiedRooms.toLocaleString(),
      icon: Home,
      menuKey: "rooms",
      iconColor: "bg-green-500",
    },
    {
      title: "Unresolved Issues",
      value: typeof stats.unresolvedIssues === "string" ? stats.unresolvedIssues : stats.unresolvedIssues.toLocaleString(),
      icon: ShieldAlert,
      menuKey: "issues",
      iconColor: "bg-red-500",
    },
    // {
    //   title: "Vacating Users",
    //   value: typeof stats.vacatingUsers === "string" ? stats.vacatingUsers : stats.vacatingUsers.toLocaleString(),
    //   icon: LogOut,
    //   menuKey: null,
    //   iconColor: "bg-orange-500",
    // },
    ...(isPaymentEnabled
      ? [
          {
            title: "Total Collected",
            value: typeof stats.totalCollected === "string" ? stats.totalCollected : `₹${parseFloat(stats.totalCollected).toLocaleString("en-IN")}`,
            icon: IndianRupee,
            menuKey: "payments",
            iconColor: "bg-slate-600",
          },
        ]
      : []),
  ];

  const quickActions = [
    {
      title: "Add Customer",
      description: "Onboard new customers and manage their details efficiently.",
      icon: UserPlus,
      iconColor: "bg-blue-500",
      action: () => onMenuChange("customers"),
    },
    {
      title: "Add Room",
      description: "Create new room entries and manage room allocations.",
      icon: Plus,
      iconColor: "bg-green-500",
      action: () => onMenuChange("rooms"),
    },
    {
      title: "View Issues",
      description: "Find and resolve issues related to rooms and services.",
      icon: ShieldAlert,
      iconColor: "bg-slate-600",
      action: () => onMenuChange("issues"),
    },
    ...(isPaymentEnabled
      ? [
          {
            title: "Payment Records",
            description: "View and manage all payment transactions and history.",
            icon: FileText,
            iconColor: "bg-red-500",
            action: () => onMenuChange("payments"),
          },
        ]
      : []),
  ];

  if (anyError && !isLoading) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Error loading dashboard data. Please try refreshing the page.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {isLoading ? (
        <div className="flex items-center h-screen justify-center py-10">
          <span className="ml-2 text-lg text-gray-700 flex flex-col items-center space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            Loading dashboard metrics...
          </span>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {dashboardItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <Card
                  key={item.title}
                  className="relative cursor-pointer hover:shadow-lg transition-shadow duration-200 border border-gray-200 shadow-sm"
                  onClick={() => item.menuKey && onMenuChange(item.menuKey)}
                >
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className={`p-3 rounded-xl ${item.iconColor}`}>
                          <IconComponent className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">{typeof item.value === "string" ? item.value : item.value.toLocaleString()}</div>
                        <p className="text-sm text-gray-600">{item.title}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickActions.map((action) => {
                const IconComponent = action.icon;
                return (
                  <Card key={action.title} className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border border-gray-200 shadow-sm" onClick={action.action}>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className={`p-3 rounded-xl ${action.iconColor} w-fit`}>
                          <IconComponent className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900 mb-2">{action.title}</h3>
                          <p className="text-sm text-gray-600 leading-relaxed">{action.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Vacating Users Section */}
          {vacatingUsers && vacatingUsers.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Vacating Users ({vacatingUsers.length})</h2>
                <button onClick={() => onMenuChange("customers")} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  View All →
                </button>
              </div>
              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Room</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Block</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Vacating On</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Days Left</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Monthly Rent</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vacatingUsers.slice(0, 10).map((user) => (
                          <tr key={user.user_id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div>
                                <div className="font-medium text-gray-900">{user.name}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-700">{user.room_number || "N/A"}</td>
                            <td className="py-3 px-4 text-gray-700">{user.block_name || "N/A"}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-700">
                                  {user.vacating_on
                                    ? new Date(user.vacating_on).toLocaleDateString("en-IN", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                      })
                                    : "N/A"}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  user.days_until_vacation <= 7 ? "bg-red-100 text-red-700" : user.days_until_vacation <= 30 ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                {user.days_until_vacation} days
                              </span>
                            </td>
                            <td className="py-3 px-4 text-gray-700">{user.monthly_rent ? `₹${user.monthly_rent.toLocaleString("en-IN")}` : "N/A"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {vacatingUsers.length > 10 && (
                      <div className="mt-4 text-center">
                        <button onClick={() => onMenuChange("customers")} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                          View all {vacatingUsers.length} vacating users →
                        </button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardContents;
