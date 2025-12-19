import React, { useState } from 'react';
import { Table, Tag } from 'antd';
import dayjs from 'dayjs';

const AlertsTable = ({ alerts, loading }) => {
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
    });

    const handleTableChange = (paginationInfo) => {
        setPagination(paginationInfo);
    };

    const columns = [
        {
            title: 'User',
            dataIndex: 'email',
            key: 'email',
            render: (email) => email || 'N/A (Broadcast)',
            responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
        },
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            responsive: ['sm', 'md', 'lg', 'xl'],
        },
        {
            title: 'Body',
            dataIndex: 'body',
            key: 'body',
            ellipsis: true,
            responsive: ['md', 'lg', 'xl'],
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                const color = status === 'sent' ? 'green' : 'red';
                return <Tag color={color}>{status.toUpperCase()}</Tag>;
            },
            responsive: ['sm', 'md', 'lg', 'xl'],
        },
        {
            title: 'Sent At',
            dataIndex: 'sent_at',
            key: 'sent_at',
            render: (date) => dayjs(date).format('MMM D, YYYY h:mm A'),
            sorter: (a, b) => dayjs(a.sent_at).unix() - dayjs(b.sent_at).unix(),
            defaultSortOrder: 'descend',
            responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
        },
    ];

    return (
        <div style={{ overflowX: 'auto' }}>
            <Table
                columns={columns}
                dataSource={alerts}
                loading={loading}
                rowKey="notification_id"
                pagination={{
                    ...pagination,
                    showSizeChanger: true,
                    pageSizeOptions: ["10", "20", "50"],
                }}
                onChange={handleTableChange}
                scroll={{ x: 800 }}
            />
        </div>
    );
};

export default AlertsTable;
