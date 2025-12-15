const cron = require('node-cron');
const { executeQuery } = require('../utils/db');
const { sendMaintenanceReminderEmail } = require('../utils/email');
const { formatDate } = require('../utils/dateUtils');

/**
 * Reminder notification cron job
 * Runs daily at 8:00 AM UTC
 * Sends email reminders for upcoming maintenance activities
 */
function startReminderJob() {
    // Run every day at 8:00 AM UTC
    cron.schedule('0 8 * * *', async () => {
        console.log('📧 Running maintenance reminder job...');

        try {
            // Get all active tenant schemas
            const schemasQuery = `
                SELECT schema_name 
                FROM companies 
                WHERE schema_status = 'active' AND deleted_at IS NULL
            `;

            const schemasResult = await executeQuery('public', schemasQuery, []);
            const schemas = schemasResult.rows;

            console.log(`Found ${schemas.length} active tenant schemas`);

            let totalReminders = 0;
            let totalSent = 0;
            let totalErrors = 0;

            // Process each tenant schema
            for (const { schema_name } of schemas) {
                try {
                    // Find due reminders that haven't been sent
                    // A reminder is due if created_at (which stores the reminder date) is today or in the past
                    // Now handles multiple assigned users per schedule
                    const remindersQuery = `
                        SELECT 
                            ar.id as reminder_id,
                            ar.maintenance_schedule_id,
                            ams.title as maintenance_title,
                            ams.assigned_to_user_ids,
                            ams.asset_id,
                            ams.time_zone,
                            a.name as asset_name,
                            u.id as user_id,
                            u.email as user_email,
                            u.first_name,
                            u.last_name,
                            ama.scheduled_at
                        FROM ${schema_name}.asset_reminders ar
                        JOIN ${schema_name}.asset_maintenance_schedules ams 
                            ON ar.maintenance_schedule_id = ams.id
                        JOIN ${schema_name}.assets a 
                            ON ams.asset_id = a.id
                        LEFT JOIN LATERAL unnest(COALESCE(ams.assigned_to_user_ids, ARRAY[]::UUID[])) AS user_id ON true
                        LEFT JOIN ${schema_name}.users u 
                            ON u.id = user_id
                        LEFT JOIN ${schema_name}.asset_maintenance_activity ama
                            ON ams.id = ama.maintenance_schedule_id 
                            AND ama.status = 'pending'
                            AND ama.deleted_at IS NULL
                        WHERE ar.notified = false
                            AND ar.deleted_at IS NULL
                            AND ams.deleted_at IS NULL
                            AND a.deleted_at IS NULL
                            AND DATE(ar.created_at AT TIME ZONE 'UTC') <= CURRENT_DATE
                            AND array_length(COALESCE(ams.assigned_to_user_ids, ARRAY[]::UUID[]), 1) > 0
                        ORDER BY ama.scheduled_at, u.email
                    `;

                    const remindersResult = await executeQuery(schema_name, remindersQuery, []);
                    const reminders = remindersResult.rows;

                    totalReminders += reminders.length;

                    if (reminders.length > 0) {
                        console.log(`  📬 ${schema_name}: ${reminders.length} reminders to send`);
                    }

                    // Group reminders by reminder_id to track which ones we've processed
                    const processedReminders = new Set();
                    
                    // Send emails for each reminder/user combination
                    for (const reminder of reminders) {
                        if (!reminder.user_email) {
                            console.log(`    ⚠️  No email for user ${reminder.user_id} in reminder ${reminder.reminder_id} - skipping`);
                            continue;
                        }

                        try {
                            // Send reminder email to this user
                            await sendMaintenanceReminderEmail(reminder.user_email, {
                                assetName: reminder.asset_name,
                                maintenanceTitle: reminder.maintenance_title,
                                scheduledDate: formatDate(reminder.scheduled_at, reminder.time_zone),
                                assetId: reminder.asset_id
                            });

                            // Mark reminder as sent only once per reminder (not per user)
                            if (!processedReminders.has(reminder.reminder_id)) {
                                const updateQuery = `
                                    UPDATE ${schema_name}.asset_reminders
                                    SET notified = true, notified_at = NOW(), updated_at = NOW()
                                    WHERE id = $1
                                `;
                                await executeQuery(schema_name, updateQuery, [reminder.reminder_id]);
                                processedReminders.add(reminder.reminder_id);
                            }

                            totalSent++;
                            console.log(`    ✅ Sent reminder ${reminder.reminder_id} to ${reminder.user_email}`);
                        } catch (emailError) {
                            totalErrors++;
                            console.error(`    ❌ Failed to send reminder ${reminder.reminder_id} to ${reminder.user_email}:`, emailError.message);
                            // Continue with next reminder even if this one fails
                        }
                    }
                } catch (schemaError) {
                    console.error(`  ❌ Error processing schema ${schema_name}:`, schemaError.message);
                    totalErrors++;
                    // Continue with next schema
                }
            }

            console.log(`📧 Reminder job completed: ${totalSent}/${totalReminders} sent, ${totalErrors} errors`);
        } catch (error) {
            console.error('❌ Fatal error in reminder job:', error);
        }
    });

    console.log('✅ Reminder job scheduled (daily at 8:00 AM UTC)');
}

module.exports = { startReminderJob };
