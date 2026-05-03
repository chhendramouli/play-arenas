package com.letsplay.arenas_backend.workflow;

import io.temporal.workflow.SignalMethod;
import io.temporal.workflow.WorkflowInterface;
import io.temporal.workflow.WorkflowMethod;

@WorkflowInterface
public interface BookingWorkflow {
    @WorkflowMethod
    void startBooking(String bookingIdStr, int holdDurationMinutes);

    @SignalMethod
    void completePayment(boolean success);

    @io.temporal.workflow.QueryMethod
    String getStatus();
}
