import React, { useEffect, useState } from "react";
import { Card, Row, Col, Statistic, DatePicker, Button, Empty, Typography, Spin } from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchAttendanceStatistics,
    selectAttendanceStatistics,
    selectAttendanceLoading
} from "../../../redux/attendance/attendanceSlice";
import { UserCheck, UserX, AlertCircle, Clock, Search } from "lucide-react";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const AttendanceStats = () => {
    const dispatch = useDispatch();
    const stats = useSelector(selectAttendanceStatistics);
    const loading = useSelector(selectAttendanceLoading);

    // Default to current month
    const [dateRange, setDateRange] = useState([
        dayjs().startOf("month"),
        dayjs().endOf("month")
    ]);

    useEffect(() => {
        fetchStats();
        // eslint-disable-next-line
    }, []);

    const fetchStats = () => {
        const params = {
            start_date: dateRange ? dateRange[0].format("YYYY-MM-DD") : null,
            end_date: dateRange ? dateRange[1].format("YYYY-MM-DD") : null,
        };
        dispatch(fetchAttendanceStatistics(params));
    };

    const handleDateChange = (dates) => {
        setDateRange(dates);
    };

    return (
        <div className="space-y-6">
            <Card className="shadow-sm border-0 mb-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <Title level={4} style={{ margin: 0 }}>Statistics Period</Title>
                    <div className="flex gap-2">
                        <RangePicker
                            value={dateRange}
                            onChange={handleDateChange}
                            allowClear={false}
                            className="w-full sm:w-auto"
                        />
                        <Button
                            type="primary"
                            icon={<Search size={16} />}
                            onClick={fetchStats}
                            loading={loading}
                        >
                            Update
                        </Button>
                    </div>
                </div>
            </Card>

            <Spin spinning={loading}>
                {!stats ? (
                    <Card className="shadow-sm border-0">
                        <div className="p-12 text-center">
                            <Empty
                                description={
                                    <span>
                                        No statistics available for this period.
                                        <br />
                                        <Text type="secondary">Select a date range and click Update to view statistics.</Text>
                                    </span>
                                }
                            />
                        </div>
                    </Card>
                ) : (
                    <>
                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={12} md={6}>
                                <Card bordered={false} className="shadow-sm">
                                    <Statistic
                                        title="Total Records"
                                        value={stats.total_records}
                                        prefix={<Clock className="text-blue-500 mr-2" size={20} />}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} md={6}>
                                <Card bordered={false} className="shadow-sm">
                                    <Statistic
                                        title="Present"
                                        value={stats.present_count}
                                        valueStyle={{ color: '#3f8600' }}
                                        prefix={<UserCheck className="mr-2" size={20} />}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} md={6}>
                                <Card bordered={false} className="shadow-sm">
                                    <Statistic
                                        title="Absent"
                                        value={stats.absent_count}
                                        valueStyle={{ color: '#cf1322' }}
                                        prefix={<UserX className="mr-2" size={20} />}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} md={6}>
                                <Card bordered={false} className="shadow-sm">
                                    <Statistic
                                        title="Missed"
                                        value={stats.missed_count}
                                        valueStyle={{ color: '#faad14' }}
                                        prefix={<AlertCircle className="mr-2" size={20} />}
                                    />
                                </Card>
                            </Col>
                        </Row>

                        <Row gutter={[16, 16]} className="mt-4">
                            <Col xs={24} md={12}>
                                <Card title="Overview" bordered={false} className="shadow-sm h-full">
                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Statistic title="Unique Users" value={stats.unique_users} />
                                        </Col>
                                        <Col span={12}>
                                            <Statistic title="Unique Days" value={stats.unique_dates} />
                                        </Col>
                                    </Row>
                                    <div className="mt-4 pt-4 border-t">
                                        <div className="flex justify-between mb-2">
                                            <span>Excused Absences:</span>
                                            <span className="font-semibold">{stats.excused_count}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Admin Overrides:</span>
                                            <span className="font-semibold">{stats.override_count}</span>
                                        </div>
                                    </div>
                                </Card>
                            </Col>
                            <Col xs={24} md={12}>
                                <Card title="Attendance Rate" bordered={false} className="shadow-sm h-full">
                                    <div className="flex items-center justify-center h-full min-h-[150px]">
                                        <div className="text-center">
                                            <div className="text-4xl font-bold text-blue-600">
                                                {stats.total_records > 0
                                                    ? Math.round((stats.present_count / (stats.total_records - stats.excused_count)) * 100)
                                                    : 0}%
                                            </div>
                                            <div className="text-gray-500 mt-2">Effective Attendance Rate</div>
                                        </div>
                                    </div>
                                </Card>
                            </Col>
                        </Row>
                    </>
                )}
            </Spin>
        </div>
    );
};

export default AttendanceStats;
