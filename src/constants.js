export const TRIGGER_URL = `https://api.thecodemesh.com/api/v1/trigger/proxy/`

export const SCOPES = {
  "CALENDAR_RW": 'https://www.googleapis.com/auth/calendar',
  "CALENDAR_R": 'https://www.googleapis.com/auth/calendar.readonly',
  "EVENTS_RW": 'https://www.googleapis.com/auth/calendar.events',
  "EVENTS_R": 'https://www.googleapis.com/auth/calendar.events.readonly',
}

export const APIS = {
  "CALENDAR_LIST": 'calendar/v3/users/me/calendarList',
  "EVENTS_LIST": 'calendar/v3/calendars/<calendarId>/events',
}