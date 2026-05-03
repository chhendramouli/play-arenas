package com.letsplay.arenas_backend.workflow;

import com.letsplay.arenas_backend.config.TemporalConfig;
import io.temporal.worker.Worker;
import io.temporal.worker.WorkerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

@Component
public class TemporalWorker {

    @Autowired
    private WorkerFactory workerFactory;

    @Autowired
    private BookingActivitiesImpl bookingActivitiesImpl;

    @PostConstruct
    public void startWorker() {
        Worker worker = workerFactory.newWorker(TemporalConfig.BOOKING_TASK_QUEUE);
        worker.registerWorkflowImplementationTypes(BookingWorkflowImpl.class);
        worker.registerActivitiesImplementations(bookingActivitiesImpl);

        workerFactory.start();
    }

    @PreDestroy
    public void stopWorker() {
        if (workerFactory != null) {
            workerFactory.shutdown();
        }
    }
}
