const { startReminderJob } = require('./reminderJob');
const { startOverdueJob } = require('./overdueJob');
const { startWorkOrderGenerationJob } = require('./workOrderGenerator');

/**
 * Initialize all scheduled jobs for maintenance management
 */
function startScheduler() {
    console.log('\n🕐 Starting maintenance scheduler...');

    try {
        // Start reminder notification job (8:00 AM UTC daily)
        startReminderJob();

        // Start overdue checker job (9:00 AM UTC daily)
        startOverdueJob();

        // Start work order generation job (1:00 AM UTC daily)
        startWorkOrderGenerationJob();

        console.log('✅ Maintenance scheduler initialized successfully\n');
    } catch (error) {
        console.error('❌ Failed to start scheduler:', error);
        throw error;
    }
}

module.exports = { startScheduler };
