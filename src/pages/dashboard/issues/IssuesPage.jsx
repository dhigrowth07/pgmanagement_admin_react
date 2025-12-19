import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Typography } from 'antd';
import { fetchAllIssues, selectAllIssues, selectIssueStatus, updateIssueStatus } from '../../../redux/issue/issueSlice';
import IssuesTable from './IssuesTable';
import IssueViewModal from './IssueViewModal';
import UpdateStatusModal from './UpdateStatusModal';

const { Title } = Typography;

const IssuesPage = () => {
    const dispatch = useDispatch();
    const issues = useSelector(selectAllIssues);
    console.log('issues: ', issues);
    const status = useSelector(selectIssueStatus);
    console.log('status: ', status);

    const [modalState, setModalState] = useState({ type: null, data: null });

    useEffect(() => {
        dispatch(fetchAllIssues());
    }, [dispatch]);

    const openModal = (type, data = null) => setModalState({ type, data });
    const closeModal = () => setModalState({ type: null, data: null });

    const handleStatusUpdate = async (newStatus) => {
        if (modalState.data) {
            await dispatch(updateIssueStatus({
                issueId: modalState.data.issue_id,
                status: newStatus,
            }));
        }
        closeModal();
    };

    return (
        <Card
            title={<Title level={4} className="pt-2">Issues Management</Title>}
            bordered={false}
        >
            <IssuesTable
                issues={issues}
                loading={status === 'loading'}
                onView={(record) => openModal('view', record)}
                onUpdateStatus={(record) => openModal('updateStatus', record)}
            />
            <IssueViewModal
                visible={modalState.type === 'view'}
                onCancel={closeModal}
                issue={modalState.data}
            />
            <UpdateStatusModal
                visible={modalState.type === 'updateStatus'}
                onCancel={closeModal}
                issue={modalState.data}
                onSubmit={handleStatusUpdate}
                loading={status === 'loading'}
            />
        </Card>
    );
};

export default IssuesPage;