import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loader2, AlertCircle, Home, ShieldAlert, IndianRupee, UserPlus, Plus, FileText } from "lucide-react";
import { Users } from "lucide-react";

import { fetchAllCustomers, selectAllCustomers, selectCustomerStatus } from "../../redux/customer/customerSlice";
import { fetchRoomsData, selectAllRooms, selectRoomStatus } from "../../redux/room/roomSlice";
import { fetchAllIssues, selectAllIssues, selectIssueStatus } from "../../redux/issue/issueSlice";
import { fetchStatistics, selectPaymentStatistics, selectPaymentStatus } from "../../redux/payment/paymentSlice";
import { selectUser } from "../../redux/auth/authSlice";

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

  const customerStatus = useSelector(selectCustomerStatus);
  const roomStatus = useSelector(selectRoomStatus);
  const issueStatus = useSelector(selectIssueStatus);
  const paymentStatus = useSelector(selectPaymentStatus);

  useEffect(() => {
    dispatch(fetchAllCustomers());
    dispatch(fetchRoomsData());
    dispatch(fetchAllIssues());
    if (isPaymentEnabled) {
      dispatch(fetchStatistics());
    }
  }, [dispatch, isPaymentEnabled]);

  const stats = useMemo(() => {
    return {
      // Count customers who are currently active (have a room, are active, and haven't vacated)
      // This includes customers with status "Active" or "Vacating" (future vacation date)
      totalCustomers:
        customers?.filter((c) => {
          const hasRoom = !!c.room_id;
          const isActive = c.is_active === true;
          const hasNotVacated = !c.vacated_date; // No past vacation date
          return hasRoom && isActive && hasNotVacated;
        }).length || 0,
      occupiedRooms: rooms?.filter((r) => r.current_occupancy === r.capacity).length || 0,
      unresolvedIssues: issues?.filter((i) => i.status === "unresolved").length || 0,
      totalCollected: isPaymentEnabled ? paymentStats?.total_collected || 0 : 0,
    };
  }, [customers, rooms, issues, paymentStats, isPaymentEnabled]);

  const isLoading = [customerStatus, roomStatus, issueStatus, ...(isPaymentEnabled ? [paymentStatus] : [])].includes("loading");
  const anyError = [customerStatus, roomStatus, issueStatus, ...(isPaymentEnabled ? [paymentStatus] : [])].includes("failed");

  const dashboardItems = [
    {
      title: "Active Customers",
      value: stats.totalCustomers,
      icon: Users,
      menuKey: "customers",
      iconColor: "bg-blue-500",
    },
    {
      title: "Fully Occupied Rooms",
      value: stats.occupiedRooms,
      icon: Home,
      menuKey: "rooms",
      iconColor: "bg-green-500",
    },
    {
      title: "Unresolved Issues",
      value: stats.unresolvedIssues,
      icon: ShieldAlert,
      menuKey: "issues",
      iconColor: "bg-red-500",
    },
    ...(isPaymentEnabled
      ? [
          {
            title: "Total Collected",
            value: `₹${parseFloat(stats.totalCollected).toLocaleString("en-IN")}`,
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
                        <div className="text-3xl font-bold text-gray-900 mb-1">{item.value.toLocaleString()}</div>
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
        </div>
      )}
    </div>
  );
};

export default DashboardContents;
