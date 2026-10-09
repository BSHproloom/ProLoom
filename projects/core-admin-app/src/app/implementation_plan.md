# Edit Project Details and Performance Improvements

## User Review Required

Please review the proposed plan to add Edit capabilities and fix the loading delay on the Project Details page.

## Proposed Changes

### Add Edit Project Functionality

I will add an "Edit Project" button at the top of the Project Profile page next to the "Delete Project" button. Clicking this button will open a popup (dialog) where you can update:
- Sales Order Number
- Client Expectation Date
- Timeline (Weeks)
- Account Manager (AM)
- Project Name & Client Name

### Fix the Loading Delay

The current loading delay happens because the page relies on fetching the entire list of projects or waiting for a massive snapshot rather than grabbing just the one project you need instantly. 

I will optimize this by:
1. Fetching the specific project document directly from the database when you open the profile (`getProjectById`).
2. Adding visual loading indicators (spinners) so you know data is being fetched, instead of showing a blank screen.

### [shared-core]
#### [MODIFY] project.service.ts
- Add a new `getProjectById(projectId: string)` method to fetch a single project directly using `doc` and `onSnapshot` for instant updates.

### [core-admin-app]
#### [MODIFY] project-detail.ts
- Create a new `EditProjectDialog` component.
- Update `ProjectDetail` component to use the new `getProjectById` and handle opening the edit dialog.
- Update data fetching to provide a better loading experience.

#### [MODIFY] project-detail.html
- Add the "Edit Project" button.
- Add `<mat-spinner>` to show loading state while `project` is null.

## Verification Plan

- Navigate from the To Do List to a Project Profile.
- Verify that the page loads much faster or at least shows a loading spinner.
- Click the "Edit Project" button and test changing the Sales Order Number and Timeline.
- Save the changes and verify they are updated on the profile page and the To Do List.
