package com.decathlon.play_arenas_backend.workflow;

import io.temporal.activity.ActivityInterface;
import io.temporal.activity.ActivityMethod;

@ActivityInterface
public interface BookingActivities {
    @ActivityMethod
    void markBookingPending(String bookingIdStr);

    @ActivityMethod
    void confirmBooking(String bookingIdStr);

    @ActivityMethod
    void cancelBooking(String bookingIdStr);
}
