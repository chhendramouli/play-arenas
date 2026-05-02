package com.decathlon.play_arenas_backend.config;

import io.temporal.client.WorkflowClient;
import io.temporal.serviceclient.WorkflowServiceStubs;
import io.temporal.serviceclient.WorkflowServiceStubsOptions;
import io.temporal.worker.WorkerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TemporalConfig {

    @Value("${temporal.host:localhost:7233}")
    private String temporalHost;

    public static final String BOOKING_TASK_QUEUE = "BOOKING_TASK_QUEUE";

    @Bean
    public WorkflowServiceStubs workflowServiceStubs() {
        return WorkflowServiceStubs.newInstance(
            WorkflowServiceStubsOptions.newBuilder().setTarget(temporalHost).build()
        );
    }

    @Bean
    public WorkflowClient workflowClient(WorkflowServiceStubs workflowServiceStubs) {
        return WorkflowClient.newInstance(workflowServiceStubs);
    }

    @Bean
    public WorkerFactory workerFactory(WorkflowClient workflowClient) {
        return WorkerFactory.newInstance(workflowClient);
    }
}
