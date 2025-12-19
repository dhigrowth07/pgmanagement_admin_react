import api from './api';

export const getAllIssues = () => {
    return api.get('/api/v1/issues/all');
};

export const updateIssueStatus = (issueId, status) => {
    return api.put(`/api/v1/issues/${issueId}/status`, { status });
};