# Service Layer Architecture

This project uses a **Service Layer** architecture to separate backend logic from frontend components. This makes it easy to migrate to different backends (like AWS DynamoDB) in the future.

## Directory Structure

```
src/
├── services/              # Service layer (Backend abstraction)
│   ├── authService.js     # Authentication operations
│   └── eventService.js    # Event CRUD operations
├── components/            # React components
├── pages/                 # Page components
└── supabaseClient.js      # Supabase client config
```

## Services Overview

### `authService.js`
Handles all authentication-related operations:
- `getCurrentUser()` - Get currently logged-in user
- `getSession()` - Get current session
- `signOut()` - Sign out user

**Usage:**
```javascript
import { authService } from '../services/authService';

const user = await authService.getCurrentUser();
```

### `eventService.js`
Handles all event-related database operations:
- `fetchEvents(filter)` - Get events with optional building filter
- `createEvent(eventData)` - Create new event
- `updateEvent(eventId, updateData)` - Update existing event
- `deleteEvent(eventId)` - Delete event
- `reportEvent(eventId)` - Report inappropriate event
- `uploadEventImage(userId, file)` - Upload event poster image

**Usage:**
```javascript
import { eventService } from '../services/eventService';

// Fetch events
const events = await eventService.fetchEvents('Building 1');

// Create event
await eventService.createEvent({
  title: 'Party',
  description: 'Fun event',
  building: 'Food Court',
  event_date: '2026-02-01T10:00:00Z',
  image_url: 'https://...',
  author_id: 'user-id',
  author_email: 'user@email.com',
  is_anonymous: false
});

// Update event
await eventService.updateEvent(eventId, {
  title: 'Updated Party',
  description: 'More fun',
  building: 'Building 1',
  event_date: '2026-02-01T10:00:00Z'
});

// Delete event
await eventService.deleteEvent(eventId);
```

## Migration Guide: Supabase → AWS DynamoDB

When you're ready to migrate to AWS, you only need to:

1. **Create new service implementations:**
   ```
   src/services/
   ├── authService.js       (Keep or update for Cognito)
   ├── eventService.js      (Rewrite for DynamoDB)
   └── awsClient.js         (New: AWS SDK config)
   ```

2. **Update service methods** to use DynamoDB API instead of Supabase:
   ```javascript
   // OLD (Supabase)
   const { data } = await supabase
     .from('events')
     .select('*');
   
   // NEW (DynamoDB)
   const params = {
     TableName: 'events'
   };
   const { Items } = await dynamodb.scan(params).promise();
   ```

3. **No changes needed in components!**
   - Components still import and use `eventService`
   - The interface stays the same
   - Only the internal implementation changes

## Benefits of Service Layer

✅ **Decoupling** - Components don't know about database implementation  
✅ **Easy Migration** - Change backend without touching UI code  
✅ **Reusability** - Services can be used across multiple components  
✅ **Testing** - Easy to mock services for unit tests  
✅ **Maintenance** - Centralized business logic  

## Error Handling

All services throw errors with descriptive messages. Components should catch and handle them:

```javascript
try {
  await eventService.updateEvent(id, data);
} catch (error) {
  console.error(error.message);
  setErrorMsg(error.message);
}
```

## Future Improvements

- Add caching layer for frequently accessed data
- Implement pagination for large datasets
- Add data validation in service layer
- Create service factory for easy backend switching
