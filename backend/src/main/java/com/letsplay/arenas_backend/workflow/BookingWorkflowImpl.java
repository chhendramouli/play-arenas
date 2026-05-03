package com.letsplay.arenas_backend.workflow;

import io.temporal.activity.ActivityOptions;
import io.temporal.common.RetryOptions;
import io.temporal.workflow.Workflow;
import java.time.Duration;

public class BookingWorkflowImpl implements BookingWorkflow {

    private final BookingActivities activities = Workflow.newActivityStub(
        BookingActivities.class,
        ActivityOptions.newBuilder()
            .setStartToCloseTimeout(Duration.ofMinutes(1))
            .setRetryOptions(RetryOptions.newBuilder()
                .setInitialInterval(Duration.ofSeconds(1))
                .setMaximumInterval(Duration.ofSeconds(10))
                .setMaximumAttempts(5)
                .build())
            .build()
    );

    private boolean paymentReceived = false;
    private boolean paymentSuccess = false;

    @Override
    public void startBooking(String bookingIdStr, int holdDurationMinutes) {
        // Step 1: Update booking to PENDING
        activities.markBookingPending(bookingIdStr);
        
        // Step 2: Wait for payment signal
        boolean signaled = Workflow.await(Duration.ofMinutes(holdDurationMinutes), () -> paymentReceived);
        
        if (signaled && paymentSuccess) {
            // Step 3a: Payment Success, confirm booking
            activities.confirmBooking(bookingIdStr);
        } else {
            // Step 3b: Timeout or Payment Failed, cancel booking
            activities.cancelBooking(bookingIdStr);
        }
    }

    @Override
    public void completePayment(boolean success) {
        this.paymentSuccess = success;
        this.paymentReceived = true;
    }

    @Override
    public String getStatus() {
        if (!paymentReceived) return "Awaiting Payment";
        return paymentSuccess ? "Payment Success" : "Payment Failed";
    }
}
