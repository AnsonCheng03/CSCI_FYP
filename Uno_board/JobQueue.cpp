#include "JobQueue.h"

// Define the job queue array and indices for tracking the queue
Job jobQueue[MAX_QUEUE_SIZE];
int jobQueueStart = 0; // Index of the first job
int jobQueueEnd = 0;   // Index where the next job will be added

bool isJobQueueEmpty() {
    return jobQueueStart == jobQueueEnd;
}

bool isJobQueueFull() {
    return (jobQueueEnd + 1) % MAX_QUEUE_SIZE == jobQueueStart;
}

void enqueueJob(JobFunction job, void* context) {
    if (!isJobQueueFull()) {
        jobQueue[jobQueueEnd].function = job;
        jobQueue[jobQueueEnd].context = context;
        jobQueueEnd = (jobQueueEnd + 1) % MAX_QUEUE_SIZE;
    } else {
        Serial.println("Job queue is full.");
    }
}

Job dequeueJob() {
    Job job = { nullptr, nullptr };  // Initialize both function and context to nullptr
    if (!isJobQueueEmpty()) {
        job = jobQueue[jobQueueStart];  // Retrieve the job at the start of the queue
        jobQueueStart = (jobQueueStart + 1) % MAX_QUEUE_SIZE;  // Move the queue start pointer
    } else {
        Serial.println("Job queue is empty.");
    }
    return job;
}
