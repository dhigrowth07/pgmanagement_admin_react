import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  getPendingDeletionRequests,
  approveDeletionRequest,
  rejectDeletionRequest,
} from "../../services/deletionRequestService";
import { handleApiError } from "../../utils/APIErrorHandler";
import toast from "react-hot-toast";

const initialState = {
  requests: [],
  status: "idle",
  error: null,
};

export const fetchPendingDeletionRequests = createAsyncThunk(
  "deletionRequest/fetchPending",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getPendingDeletionRequests();
      return response.data.data || [];
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const approveRequest = createAsyncThunk(
  "deletionRequest/approve",
  async (requestId, { dispatch, rejectWithValue }) => {
    try {
      const response = await approveDeletionRequest(requestId);
      toast.success(
        response.data.msg || "Account deletion approved successfully!"
      );
      dispatch(fetchPendingDeletionRequests());
      return response.data.data;
    } catch (error) {
      const errorData = handleApiError(error);
      toast.error(
        errorData.msg ||
          errorData.message ||
          "Failed to approve deletion request."
      );
      return rejectWithValue(errorData);
    }
  }
);

export const rejectRequest = createAsyncThunk(
  "deletionRequest/reject",
  async ({ requestId, rejectionReason }, { dispatch, rejectWithValue }) => {
    try {
      const response = await rejectDeletionRequest(requestId, rejectionReason);
      toast.success(
        response.data.msg || "Deletion request rejected successfully!"
      );
      dispatch(fetchPendingDeletionRequests());
      return response.data.data;
    } catch (error) {
      const errorData = handleApiError(error);
      toast.error(
        errorData.msg ||
          errorData.message ||
          "Failed to reject deletion request."
      );
      return rejectWithValue(errorData);
    }
  }
);

const deletionRequestSlice = createSlice({
  name: "deletionRequest",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPendingDeletionRequests.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchPendingDeletionRequests.fulfilled, (state, action) => {
        state.status = "idle";
        state.requests = action.payload;
        state.error = null;
      })
      .addCase(fetchPendingDeletionRequests.rejected, (state, action) => {
        state.status = "idle";
        state.error = action.payload;
      })
      .addCase(approveRequest.pending, (state) => {
        state.status = "loading";
      })
      .addCase(approveRequest.fulfilled, (state) => {
        state.status = "idle";
      })
      .addCase(approveRequest.rejected, (state) => {
        state.status = "idle";
      })
      .addCase(rejectRequest.pending, (state) => {
        state.status = "loading";
      })
      .addCase(rejectRequest.fulfilled, (state) => {
        state.status = "idle";
      })
      .addCase(rejectRequest.rejected, (state) => {
        state.status = "idle";
      });
  },
});

export const { clearError } = deletionRequestSlice.actions;

export const selectDeletionRequests = (state) => state.deletionRequest.requests;
export const selectDeletionRequestStatus = (state) =>
  state.deletionRequest.status;
export const selectDeletionRequestError = (state) =>
  state.deletionRequest.error;

export default deletionRequestSlice.reducer;
