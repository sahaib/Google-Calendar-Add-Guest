# Google Apps Script-AddGuest

Google Apps Script OAuth2 Service Account Authentication with Google Workspace Calendar and Admin APIs

This script is a Google Apps Script designed for authenticating a Google Workspace service account using OAuth2. It allows for event and group management on Google Calendar and Google Admin APIs.

## 🚀 Features
- **Authenticate** using a Google Workspace service account
- **Access** Google Calendar events of multiple users in the organization
- **Add guests** to calendar events
- **Retrieve group members** from Google Workspace Admin

---

## 🛠️ Setup

### 1. Create a Service Account
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Select your project (or create a new one).
3. Navigate to **IAM & Admin > Service Accounts**.
4. Click on **Create Service Account** and provide a name and description.
5. Click **Done** to finish creating the service account.

### 2. Generate a Private Key
1. Under **Service Accounts**, locate your newly created account.
2. Click **Actions (⋮)** > **Manage keys**.
3. Add a new key, selecting **JSON** format, and download it.
4. Copy the `private_key` and `client_email` from this JSON file for later use in your Google Apps Script.

### 3. Enable Required APIs
1. In the **APIs & Services > Library**, enable:
   - **Google Calendar API**
   - **Admin SDK API**

### 4. Set Domain-Wide Delegation for the Service Account
1. Under **IAM & Admin > Service Accounts**, select your service account.
2. Click **Edit** and enable **Domain-wide Delegation**.
3. Copy the **Client ID**.

4. Go to [Google Workspace Admin Console](https://admin.google.com/).
5. Navigate to **Security > API controls > Domain-wide delegation**.
6. **Add a new API client**:
   - **Client ID**: Paste the client ID from your service account.
   - **OAuth Scopes**: Add the required scopes:
     - `https://www.googleapis.com/auth/calendar`
     - `https://www.googleapis.com/auth/admin.directory.group.member.readonly`

---

## 💻 Script Installation

### 1. Open Google Apps Script
1. Go to [Google Apps Script](https://script.google.com/).
2. Create a new project and paste the code provided above.

### 2. Setup OAuth2 Library
- **OAuth2 Library**: In Apps Script, click on **Extensions > Libraries**.
- Add the OAuth2 Library using the Script ID: `1B1MJKqwZLR3T7p0C9Z6zaJuZCWqZUKGJmSaNG82hrMoy3KxMysKxiEZW`.
- Choose the latest version and click **Add**.

### 3. Configure Variables in the Script
Replace placeholders with actual values from your service account:
- `privateKey`: Service account private key from your JSON file.
- `serviceAccountEmail`: Service account email.
- `userEmail`: Email of the user to impersonate in your organization.

---

## 🔄 Setting Triggers
1. In the Google Apps Script editor, go to **Triggers** (clock icon in left sidebar).
2. **Create a new trigger**:
   - **Function**: `onCalendarEventCreated`
   - **Event source**: Select **Time-driven**
   - **Type of time-based trigger**: Set the frequency as required, e.g., **Every hour**.

---

## 🧪 Testing
1. **Run** the `testAuth()` function to confirm successful authentication.
2. Check **Logs** (View > Logs) to view authentication success or failure messages.

---

## 📄 Script Breakdown

- `getServiceAccountAuth()`: Authenticates the service account, using domain-wide delegation to impersonate a user.
- `getUsersFromGroup()`: Retrieves emails of members in a specific Google Workspace group.
- `onCalendarEventCreated(e)`: Triggered on calendar event creation. It checks if the current user is in the monitored list and processes relevant events.
- `processEvent()`: Adds a guest to the event if not already present.
- `checkAndUpdateRecentEvents()`: Checks for recent calendar events created by monitored users and processes them.

---

## 📋 Notes
- Ensure the service account has permissions set correctly in the Google Workspace Admin Console.
- For detailed usage of each function, check the inline documentation within the script.
- Review logging information in Google Apps Script logs for troubleshooting.

---

## 📧 Contact & Support
For more details on setting up Google Workspace APIs, refer to [Google's OAuth2 Documentation](https://developers.google.com/identity/protocols/oauth2).
