import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as issueService from "../../services/issueService";
import { handleApiError } from "../../utils/APIErrorHandler";
import toast from "react-hot-toast";

const initialState = {
  issues: [],
  status: "idle",
  error: null,
};

export const fetchAllIssues = createAsyncThunk("issue/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const response = await issueService.getAllIssues();
    return response.data.data || [];
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

export const updateIssueStatus = createAsyncThunk("issue/updateStatus", async ({ issueId, status }, { dispatch, rejectWithValue }) => {
  try {
    const response = await issueService.updateIssueStatus(issueId, status);
    toast.success("Issue status updated successfully!");
    dispatch(fetchAllIssues());
    return response.data.data;
  } catch (error) {
    const errorData = handleApiError(error);
    toast.error(errorData.msg || "Failed to update issue status.");
    return rejectWithValue(errorData);
  }
});

const issueSlice = createSlice({
  name: "issue",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllIssues.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAllIssues.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.issues = action.payload;
      })
      .addCase(fetchAllIssues.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload.msg;
      })
      .addCase(updateIssueStatus.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateIssueStatus.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(updateIssueStatus.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload.msg;
      });
  },
});

export const selectAllIssues = (state) => state.issue.issues;
export const selectIssueStatus = (state) => state.issue.status;

export default issueSlice.reducer;
