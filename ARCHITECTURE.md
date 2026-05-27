# ProLoom BSH - Architecture & Business Logic

This document serves as the master record for all business logic, workflow rules, and data structures implemented in the Carpet Control suite.

## 1. Application Suite
- **Admin App (core-admin-app)**: Used by Admins and Sales Coordinators. Responsible for creating projects, assigning tasks to designers, reviewing artwork, and managing the team directory.
- **AM App (am-app)**: Used by Account Managers. Provides a dashboard to view the status of their assigned projects and carpets.
- **Designer App (designer-app)**: Used by Designers. Dashboard for viewing assigned carpets, setting estimated completion dates, tracking time, submitting artwork, and responding to revisions.
- **Production App (production-app)**: Used by the Production/QC team.

## 2. Roles & Permissions
- **Admin / Sales Coordinator (SC)**: Full access to project creation, assignment, and artwork review.
- **Account Manager (AM)**: View-only access to projects assigned to them. Receives notifications on project progress.
- **Designer**: Restricted to viewing carpets assigned directly to them. Can log time and submit artwork for review.
- **Production**: Restricted to production phases (Sample, Production File, Production, QC).

## 3. The Design Workflow (Artwork Phase)
### 3.1 Task Assignment
- A Sales Coordinator selects a Carpet and assigns it to a specific Designer.
- *Condition*: A single carpet can only have ONE Designer assigned at a time.
- *Trigger*: Upon assignment, a Notification is sent to the Designer and the AM. The Carpet status changes to `Assigned`.

### 3.2 Time Tracking & Pausing
- A Designer can set an `Estimated Finishing Date` for a carpet.
- When a Designer clicks `Start Working`, the system records the `start_time`.
- *Condition (Auto-Pause)*: If a Designer clicks `Start Working` on Carpet B while Carpet A is active, the system automatically stops the timer on Carpet A, calculates the elapsed time, adds it to `time_spent_seconds`, sets `is_working = false`, and logs an Activity.
- *Condition (Manual Pause)*: A Designer can manually pause tracking.

### 3.3 Review & Revisions
- Designer clicks `Submit for Review`. Status becomes `Review Pending`.
- SC reviews artwork in Admin App.
- *Path A (Revise)*: SC clicks `Revise` with a comment. Status becomes `Revision Needed`. Designer is notified. Designer reads comment, can reply, and clicks `Start Working` to track revision time.
- *Path B (Approve)*: SC clicks `Approve`. Status becomes `Sent to AM`. AM is notified.

## 4. Notifications & Activity Logs
- **Notifications**: Delivered via an In-App Bell (Firestore `notifications` collection) and Browser Push Notifications.
- **Activity Logs**: Every state change (Assign, Start, Pause, Submit, Revise, Approve) creates a document in the `activity_logs` collection. This generates the chronological "Project Profile" history.
