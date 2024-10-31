// var OAuth2 = OAuth2LibraryApp;
function getServiceAccountAuth() {
    var privateKey = "service_account_private_key";
    var serviceAccountEmail = "service_account_email";
    var userEmail = "google_workspace_user_email"; // The user to impersonate
    try {
        var service = OAuth2.createService("Calendar Service Account")
          .setTokenUrl('https://oauth2.googleapis.com/token')
          .setPrivateKey(privateKey)
          .setIssuer(serviceAccountEmail)
          .setSubject(userEmail)
          .setPropertyStore(PropertiesService.getScriptProperties())
          .setParam('access_type', 'offline')
          .setParam('approval_prompt', 'force')
          .setScope(['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/admin.directory.group.member.readonly']);
    
        if (service.hasAccess()) {
          Logger.log('Authentication successful');
          return service;
        } else {
          Logger.log('Authentication failed. Error: ' + service.getLastError());
          return null;
        }
    } catch (error) {
        Logger.log('Error in getServiceAccountAuth: ' + error.toString());
        return null;
    }
}
function testAuth() {
    var service = getServiceAccountAuth();
    if (service && service.hasAccess()) {
      Logger.log('Authentication successful');
    } else {
      Logger.log('Authentication failed');
    }
  }
  
/**
 * @OnlyCurrentDoc
 * @NotOnlyCurrentDoc
 * @Scopes https://www.googleapis.com/auth/admin.directory.group.member.readonly
 */
// Constants
const GROUP_EMAIL = 'group_email_of_organisation'; // Group email
const GUEST_TO_ADD = 'guest_email_to_add';
/**
 * Retrieves a list of user emails from the specified group.
 * Uses the AdminDirectory API to fetch group members.
 * @returns {Array} An array of email addresses of group members.
 */
function getUsersFromGroup() {
    var service = getServiceAccountAuth();
    if (!service.hasAccess()) {
        Logger.log('Authentication failed');
        return;
    }
  try {
    var pageToken;
    var members = [];
    do {
      var response = AdminDirectory.Members.list(GROUP_EMAIL, {
        maxResults: 200,
        pageToken: pageToken
      });
      members = members.concat(response.members || []);
      pageToken = response.nextPageToken;
    } while (pageToken);
    
    return members.map(member => member.email);
  } catch (error) {
    Logger.log('Error getting users from group: ' + error.toString());
    Logger.log('Error stack: ' + error.stack);
    return [];
  }
}
// Get the email of the current user and users from the group
const CURRENT_USER = Session.getActiveUser().getEmail();
const USERS_TO_MONITOR = getUsersFromGroup();
/**
 * Triggered when a calendar event is created.
 * Checks if the current user is in the monitored list and processes relevant events.
 * @param {Object} e - The event object containing details about the created calendar event.
 */
function onCalendarEventCreated(e) {
  Logger.log('Script triggered. Raw event data: ' + JSON.stringify(e));
  try {
    Logger.log('Script triggered. Event details: ' + JSON.stringify(e));
    Logger.log('Current user: ' + CURRENT_USER);
    if (!USERS_TO_MONITOR.includes(CURRENT_USER)) {
      Logger.log('Current user is not in the monitored list');
      return;
    }
    Logger.log('Current user is in the monitored list');
    if (!e || !e.calendarId) {
      Logger.log('Error: Invalid event object');
      return;
    }
    var calendarId = e.calendarId;
    Logger.log('Calendar ID: ' + calendarId);
    if (!USERS_TO_MONITOR.includes(calendarId)) {
      Logger.log('Calendar is not in the monitored list');
      return;
    }
    Logger.log('Calendar is in the monitored list');
    var calendar = CalendarApp.getCalendarById(calendarId);
    if (!calendar) {
      Logger.log('Error: Could not find calendar with ID: ' + calendarId);
      return;
    }
    // Get all events from now to 7 days in the future
    var now = new Date();
    var sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    Logger.log('Searching for events between ' + now.toISOString() + ' and ' + sevenDaysLater.toISOString());
    var events = calendar.getEvents(now, sevenDaysLater);
    Logger.log('Number of events found: ' + events.length);
    if (events.length === 0) {
      Logger.log('No events found in the next 7 days. Please check calendar permissions and event creation.');
      return;
    }
    // Process all found events
    events.forEach(function(event) {
      processEvent(event);
    });
  } catch (error) {
    Logger.log('Error occurred: ' + error.toString());
    Logger.log('Error stack: ' + error.stack);
  }
}
/**
 * Processes a single calendar event.
 * Attempts to add the specified guest to the event if not already present.
 * @param {CalendarEvent} event - The calendar event to process.
 */
function processEvent(event) {
  Logger.log('Processing event:');
  Logger.log('- Title: ' + event.getTitle());
  Logger.log('- Start time: ' + event.getStartTime());
  Logger.log('- End time: ' + event.getEndTime());
  Logger.log('- Event ID: ' + event.getId());
  Logger.log('- Creation date: ' + event.getDateCreated());
  // Attempt to add guest to the event
  var guests = event.getGuestList().map(guest => guest.getEmail());
  Logger.log('Current guests: ' + guests.join(', '));
  
  if (!guests.includes(GUEST_TO_ADD)) {
    try {
      event.addGuest(GUEST_TO_ADD);
      Logger.log('Successfully added guest to the event: ' + GUEST_TO_ADD);
      // Log the updated guest list
      Logger.log('Updated guest list:');
      event.getGuestList().forEach(function(guest) {
        Logger.log('  * ' + guest.getEmail() + ' (Status: ' + guest.getGuestStatus() + ')');
      });
    } catch (addError) {
      Logger.log('Error adding guest: ' + addError.toString());
    }
  } else {
    Logger.log('Guest already exists in the event.');
  }
}

function checkAndUpdateRecentEvents() {
    var service = getServiceAccountAuth();
    if (!service.hasAccess()) {
      Logger.log('Authentication failed');
      return;
    }
    Logger.log('Script started');
    var usersToMonitor = getUsersFromGroup();
    Logger.log('Users to monitor: ' + JSON.stringify(usersToMonitor));
  
    var now = new Date();
    var fiveMinutesAgo = new Date(now.getTime() - 60 * 60 * 1000);
    var sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
    usersToMonitor.forEach(function(userEmail) {
      try {
        Logger.log('Checking calendar for user: ' + userEmail);
        var events = Calendar.Events.list(userEmail, {
          timeMin: fiveMinutesAgo.toISOString(),
          timeMax: sevenDaysLater.toISOString(),
          singleEvents: true,
          orderBy: 'startTime'
        });
  
        Logger.log('Number of events found for ' + userEmail + ': ' + (events.items ? events.items.length : 0));
  
        if (events.items && events.items.length > 0) {
          events.items.forEach(function(event) {
            if (new Date(event.created) >= fiveMinutesAgo) {
              processEventAPI(event, userEmail);
            }
          });
        }
      } catch (error) {
        Logger.log('Error processing calendar for ' + userEmail + ': ' + error.toString());
      }
    });
  }
  
function processEventAPI(event, calendarId) {
  Logger.log('Processing event:');
  Logger.log('- Title: ' + event.summary);
  Logger.log('- Start time: ' + event.start.dateTime);
  Logger.log('- End time: ' + event.end.dateTime);
  Logger.log('- Event ID: ' + event.id);
  Logger.log('- Creation date: ' + event.created);

  var guests = event.attendees ? event.attendees.map(attendee => attendee.email) : [];
  Logger.log('Current guests: ' + guests.join(', '));

  if (!guests.includes(GUEST_TO_ADD)) {
    try {
      // 🔍 Fetch the event again to ensure we have the latest version
      var updatedEvent = Calendar.Events.get(calendarId, event.id);
      
      // 🔄 Update the attendees list
      updatedEvent.attendees = updatedEvent.attendees || [];
      updatedEvent.attendees.push({email: GUEST_TO_ADD});
      
      // ✏️ Update the event
      Calendar.Events.update(updatedEvent, calendarId, event.id);
      
      Logger.log('Successfully added guest to the event: ' + GUEST_TO_ADD);
    } catch (addError) {
      Logger.log('Error adding guest: ' + addError.toString());
      // 🚨 Log more details about the error
      if (addError.details) {
        Logger.log('Error details: ' + JSON.stringify(addError.details));
      }
    }
  } else {
    Logger.log('Guest already exists in the event.');
  }
}
