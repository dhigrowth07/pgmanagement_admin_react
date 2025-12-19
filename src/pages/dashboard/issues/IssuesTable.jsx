import React, { useState } from 'react';
import { Table, Tag, Button, Tooltip, Space } from 'antd';
import { EyeOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const statusColors = {
    unresolved: 'blue',
    in_progress: 'processing',
    resolved: 'success',
    closed: 'default',
    // Legacy support
    open: 'blue',
    inprogress: 'processing',
};

const statusDisplayMap = {
    unresolved: 'UNRESOLVED',
    in_progress: 'IN PROGRESS',
    resolved: 'RESOLVED',
    closed: 'CLOSED',
    // Legacy support
    open: 'UNRESOLVED',
    inprogress: 'IN PROGRESS',
};

const IssuesTable = ({ issues, loading, onView, onUpdateStatus }) => {

    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
    });

    const handleTableChange = (paginationInfo) => {
        setPagination(paginationInfo);
    };


    const columns = [
        {
            title: 'Issue ID',
            dataIndex: 'issue_id',
            key: 'issue_id',
            sorter: (a, b) => a.issue_id - b.issue_id,
        },
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
        },
        {
            title: 'Reported By',
            dataIndex: 'user_name',
            render: (user_name) => user_name || 'N/A',
            key: 'user_name',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                // Normalize status for display (handle both formats)
                const normalizedStatus = status === 'open' ? 'unresolved' : 
                                       status === 'inprogress' ? 'in_progress' : status;
                return (
                    <Tag color={statusColors[normalizedStatus] || statusColors[status] || 'default'}>
                        {statusDisplayMap[normalizedStatus] || statusDisplayMap[status] || status.toUpperCase()}
                    </Tag>
                );
            },
            filters: [
                { text: 'Unresolved', value: 'unresolved' },
                { text: 'In Progress', value: 'in_progress' },
                { text: 'Resolved', value: 'resolved' },
                { text: 'Closed', value: 'closed' },
            ],
            onFilter: (value, record) => {
                // Handle both database format and legacy format
                const recordStatus = record.status === 'open' ? 'unresolved' : 
                                   record.status === 'inprogress' ? 'in_progress' : record.status;
                return recordStatus === value;
            },
        },
        {
            title: 'Reported On',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date) => dayjs(date).format('DD MMM YYYY, h:mm A'),
            sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
            defaultSortOrder: 'descend',
        },
        {
            title: 'Actions',
            key: 'actions',
            align: 'center',
            render: (_, record) => (
                <Space>
                    <Tooltip title="View Details">
                        <Button icon={<EyeOutlined />} onClick={() => onView(record)} size="small" />
                    </Tooltip>
                    <Tooltip title="Update Status">
                        <Button icon={<EditOutlined />} type="primary" onClick={() => onUpdateStatus(record)} size="small" />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <Table
            columns={columns}
            dataSource={issues}
            loading={loading}
            rowKey="issue_id"
            pagination={{
                ...pagination,
                showSizeChanger: true,
                pageSizeOptions: ["10", "20", "50"],
            }}
            onChange={handleTableChange}
        />
    );
};

export default IssuesTable;