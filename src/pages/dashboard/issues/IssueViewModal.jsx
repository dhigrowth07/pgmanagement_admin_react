import React from 'react';
import { Modal, Descriptions, Tag, Typography } from 'antd';
import dayjs from 'dayjs';

const { Title, Paragraph, Text } = Typography;
const statusColors = {
    open: 'blue',
    inprogress: 'processing',
    resolved: 'success',
    closed: 'default',
};

const IssueViewModal = ({ visible, onCancel, issue }) => {
    if (!issue) return null;

    return (
        <Modal
            title={<Title level={4}>Issue Details #{issue.issue_id}</Title>}
            open={visible}
            onCancel={onCancel}
            footer={null}
            width={600}
        >
            <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="Title">
                    <Text strong>{issue.title}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Description">
                    <Paragraph>{issue.description}</Paragraph>
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                    <Tag color={statusColors[issue.status] || 'default'}>{issue.status.toUpperCase()}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Block Name">{issue.block_name || 'N/A'}</Descriptions.Item>
                <Descriptions.Item label="Room No">{issue.room_number || 'N/A'}</Descriptions.Item>
                <Descriptions.Item label="Reported By">{issue.user_name || 'N/A'}</Descriptions.Item>
                <Descriptions.Item label="Reported On">{dayjs(issue.created_at).format('DD MMM YYYY, h:mm A')}</Descriptions.Item>
                <Descriptions.Item label="Last Updated">{dayjs(issue.updated_at).format('DD MMM YYYY, h:mm A')}</Descriptions.Item>
                {/* <Descriptions.Item label="Closed By">{issue.closed_by || 'N/A'}</Descriptions.Item>
                <Descriptions.Item label="Closed At">{issue.closed_at ? dayjs(issue.closed_at).format('DD MMM YYYY, h:mm A') : 'N/A'}</Descriptions.Item> */}
            </Descriptions>
        </Modal>
    );
};

export default IssueViewModal;