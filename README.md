# XClone

A Twitter clone built with React Native and Node.js.

## Authentication Workflow

### Overview
The app uses Clerk for authentication with a sophisticated workflow that handles social sign-in (Google/Apple) and automatic navigation based on authentication state.

### Complete Sign-In Flow

#### 1. 🚀 Initial State
```
User opens app → Goes to /(auth) route → Sees sign-in page with Google/Apple buttons
```

#### 2. 📱 User Interaction
```tsx
// In auth/index.tsx
onPress={() => handleSocialAuth("oauth_google")}
// or
onPress={() => handleSocialAuth("oauth_apple")}
```

#### 3. 🔧 Hook Handles Authentication
```tsx
// In useSocialAuth.ts
const handleSocialAuth = async (strategy) => {
  setIsLoading(true);  // Shows loading spinner
  try {
    const { createdSessionId, setActive } = await startSSOFlow({ strategy });
    if (createdSessionId && setActive) {
      await setActive({ session: createdSessionId });  // Creates user session
    }
  } catch (err) {
    // Handle errors
  } finally {
    setIsLoading(false);  // Hides loading spinner
  }
};
```

#### 4. 🔐 Clerk Authentication Flow
- **`startSSOFlow`**: Opens Google/Apple sign-in popup
- **User authenticates**: Enters credentials on Google/Apple
- **Clerk creates session**: New user account + session
- **`setActive`**: Activates the session in your app

#### 5. 🔄 Auth Layout Detects Change
```tsx
// In (auth)/_layout.tsx
export default function AuthRoutesLayout() {
  const { isSignedIn } = useAuth()  // Clerk hook

  if (isSignedIn) {  // User is now signed in!
    return <Redirect href={'/'} />   // Redirect to home page
  }

  return <Stack />  // Show auth screens if not signed in
}
```

#### 6. 🏠 Redirect to Home Page
```
/(auth) → / (home page)
```

### How Clerk Knows You're Signed In

#### Real-Time State Management
```tsx
const { isSignedIn } = useAuth()
```
- **`useAuth()`** is a Clerk hook that subscribes to Clerk's internal state
- **Clerk maintains** a global authentication state in memory
- **Real-time updates** happen automatically when auth state changes

#### The Authentication Flow
```tsx
// When you click Google/Apple button:
const { createdSessionId, setActive } = await startSSOFlow({ strategy });

// This line is KEY:
await setActive({ session: createdSessionId });
```

**What `setActive` does:**
- **Creates/updates** the user session in Clerk's internal state
- **Triggers** a state change event
- **Updates** all components using `useAuth()` automatically

#### Real-Time State Synchronization
```tsx
// Before authentication:
useAuth() → { isSignedIn: false, user: null }

// After successful authentication:
useAuth() → { isSignedIn: true, user: { id: "user_123", email: "..." } }

// Your component automatically re-renders with new values!
```

### Step-by-Step Behind the Scenes

#### Step 1: User Clicks Button
```tsx
onPress={() => handleSocialAuth("oauth_google")}
```

#### Step 2: Clerk Opens OAuth Flow
```tsx
startSSOFlow({ strategy: "oauth_google" })
// Opens Google sign-in popup
```

#### Step 3: User Authenticates with Google
- User enters Google credentials
- Google returns authentication token
- Clerk receives the token

#### Step 4: Clerk Creates Session
```tsx
// Clerk internally:
// 1. Validates Google token
// 2. Creates/updates user record
// 3. Generates session ID
// 4. Updates internal state: isSignedIn = true
```

#### Step 5: Your App Gets Notified
```tsx
// Clerk automatically triggers:
// - State change event
// - All useAuth() hooks update
// - Your component re-renders
// - isSignedIn becomes true
```

#### Step 6: Redirect Happens
```tsx
// In your _layout.tsx:
if (isSignedIn) {  // Now true!
  return <Redirect href={'/'} />
}
```

### Key Components

#### useSocialAuth Hook
```tsx
export const useSocialAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { startSSOFlow } = useSSO();

  const handleSocialAuth = async (strategy) => {
    setIsLoading(true);
    try {
      const { createdSessionId, setActive } = await startSSOFlow({ strategy });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (err) {
      console.log("Error in social auth", err);
      const provider = strategy === "oauth_google" ? "Google" : "Apple";
      Alert.alert("Error", `Failed to sign in with ${provider}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, handleSocialAuth };
};
```

#### Auth Layout with Automatic Redirect
```tsx
export default function AuthRoutesLayout() {
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    return <Redirect href={'/'} />
  }

  return <Stack />
}
```

### Why This Architecture Works

#### Clerk Handles:
- **User creation** (first time users)
- **Session management**
- **Authentication state**
- **OAuth flow complexity**

#### Your App Handles:
- **UI/UX** (buttons, loading states)
- **Navigation** (redirects based on auth state)
- **Error handling**
- **User experience**

#### The Magic:
- **`useAuth()`** automatically updates when Clerk's state changes
- **`isSignedIn`** becomes `true` after successful authentication
- **`<Redirect>`** automatically navigates to home page
- **No manual navigation needed!**

### Visual Flow Summary
```
Sign-in Page → Button Click → Loading State → Google/Apple Auth → 
Clerk Session → Auth Layout Detects Sign-in → Redirect to Home Page
```

This architecture provides a seamless, secure, and user-friendly authentication experience where Clerk handles all the complex authentication logic while your app simply responds to authentication state changes.

### Device Memory and Session Persistence

#### How Clerk Remembers Your Device

**Yes! Clerk tracks and manages device-specific information for each login, which is why you get automatically redirected to the home page on subsequent app opens.**

#### Session Management
- **Each device** gets a unique session when you log in
- **Session tokens** are stored locally on each device
- **Multiple devices** can be logged in simultaneously with the same account

#### Device Storage
```tsx
// Clerk stores locally on each device:
- Session token (JWT)
- User ID
- Authentication state
- Device-specific metadata
```

#### Multi-Device Support
- **Phone + Tablet**: Both can be logged in at the same time
- **Different browsers**: Each maintains its own session
- **App + Web**: Separate sessions for mobile app and web browser

#### Security Features
- **Device fingerprinting**: Clerk can detect suspicious login patterns
- **Session revocation**: You can log out from specific devices
- **Location tracking**: Clerk knows where each device is logging in from

### Why You Get Redirected Automatically

#### Session Persistence Flow
```
1st Login: Device → Clerk → Session Token → Stored Locally
2nd Open: App Opens → Clerk Checks Stored Token → Still Valid → Home Page!
```

#### What Clerk Checks Automatically
- **Session token** stored on device
- **Token expiration** (when it was created)
- **Token validity** (hasn't been revoked)
- **Device fingerprint** (same device)

#### Real Example

**First Time:**
```
Open App → No stored token → isSignedIn = false → Auth Screen
Click Google → Authenticate → Clerk creates session → Token stored → Home
```

**Next Time:**
```
Open App → Clerk finds stored token → Validates token → isSignedIn = true → Home!
```

**If Token Expires:**
```
Open App → Clerk finds stored token → Token expired → isSignedIn = false → Auth Screen
```

#### Automatic Token Validation
```tsx
// Every time your app opens, Clerk automatically:
const { isSignedIn } = useAuth()  // Checks stored token

// If token exists and is valid:
isSignedIn = true  // User is "remembered"

// If no token or expired:
isSignedIn = false  // User needs to sign in again
```

#### No Manual Work Required
- **You don't code** the token checking
- **Clerk handles** it automatically
- **Your app just** responds to the `isSignedIn` value

### The Magic Explained

**Clerk is like a smart security guard who:**
1. **Remembers** who you are on each device
2. **Automatically checks** your "ID card" (session token) when you return
3. **Lets you in** if your ID is still valid
4. **Asks for new ID** if your old one expired

**This is why:**
- Your device "remembers" you
- You don't have to log in every single time
- You get automatically redirected to home page
- Multiple devices can stay logged in independently

The session token acts like a "remember me" feature that Clerk manages automatically, providing a seamless user experience while maintaining security.

### Understanding _layout.tsx Files

#### What _layout.tsx Does

**Purpose:**
- **Wraps multiple screens** in a specific layout
- **Defines navigation structure** (Stack, Tabs, Drawer)
- **Shares common UI elements** across multiple screens
- **Handles authentication logic** for that route group

#### Common Use Cases

**1. Navigation Structure:**
```tsx
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="home" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
```

**2. Stack Navigation:**
```tsx
// app/(auth)/_layout.tsx
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
```

**3. Authentication Logic:**
```tsx
// app/(auth)/_layout.tsx
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';

export default function AuthLayout() {
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    return <Redirect href="/" />;  // Redirect if already signed in
  }

  return <Stack />;  // Show auth screens if not signed in
}
```

**4. Shared UI Elements:**
```tsx
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="profile" />
      </Tabs>
      
      {/* Shared footer across all tabs */}
      <View style={{ padding: 20, backgroundColor: '#f0f0f0' }}>
        <Text>Shared Footer</Text>
      </View>
    </View>
  );
}
```

#### Layout Hierarchy in Your App

**Current Structure:**
```
Root Layout (app/_layout.tsx)
├── ClerkProvider + Stack
├── Auth Layout (app/(auth)/_layout.tsx)
│   ├── Checks authentication state
│   ├── Redirects if signed in
│   └── Shows auth screens if not signed in
└── Main Layout (app/index.tsx)
    └── Home page content
```

**Screen Flow:**
1. **User opens app** → Root layout renders with ClerkProvider
2. **If on auth route** → Auth layout checks if user is signed in
3. **If signed in** → Redirects to home page
4. **If not signed in** → Shows authentication screens

#### Key Benefits

- **Code Organization**: Separate layout logic for different route groups
- **Authentication Guards**: Protect routes based on user state
- **Navigation Structure**: Define how screens are organized
- **Shared UI**: Common elements across multiple screens
- **Reusability**: Layouts can be reused across different route groups

#### Naming Conventions

**Route Group Names:**
- **`(auth)`** - Authentication-related screens
- **`(tabs)`** - Tab-based navigation (common but not required)
- **`(main)`** - Main app screens
- **`(dashboard)`** - Dashboard-related screens

**Important Notes:**
- **Parentheses `()`** create route groups (not the name inside)
- **`_layout.tsx`** defines the layout for that group
- **Group names** can be anything descriptive
- **`(tabs)`** is just a popular choice, not a requirement

## Backend Implementation Status

## Database Models

### User Model
The core user entity with social media features:

```javascript
{
  clerkId: String (required, unique),     // Clerk authentication ID
  email: String (required, unique),       // User email
  firstName: String (required),           // First name
  lastName: String (required),            // Last name
  username: String (required, unique),    // Unique username
  profilePicture: String (default: ""),   // Profile image URL
  bannerImage: String (default: ""),      // Banner image URL
  bio: String (max: 160 chars),          // User biography
  location: String,                       // User location
  followers: [User IDs],                 // Array of follower user IDs
  following: [User IDs],                 // Array of following user IDs
  timestamps: true                       // Created/updated timestamps
}
```

### Post Model
Represents tweets/posts in the system:

```javascript
{
  user: ObjectId (required),             // Reference to User who created post
  content: String (max: 280 chars),      // Post text content
  image: String (default: ""),           // Optional image URL
  likes: [User IDs],                     // Array of users who liked the post
  comments: [Comment IDs],               // Array of comment IDs
  timestamps: true                       // Created/updated timestamps
}
```

### Comment Model
Represents comments on posts:

```javascript
{
  user: ObjectId (required),             // Reference to User who commented
  post: ObjectId (required),             // Reference to Post being commented on
  content: String (required, max: 280),  // Comment text content
  likes: [User IDs],                     // Array of users who liked the comment
  timestamps: true                       // Created/updated timestamps
}
```

### Notification Model
Handles user notifications for various actions:

```javascript
{
  from: ObjectId (required),             // User who triggered the notification
  to: ObjectId (required),               // User receiving the notification
  type: String (enum: ["follow", "like", "comment"]), // Notification type
  post: ObjectId (optional),             // Related post (for like/comment)
  comment: ObjectId (optional),          // Related comment (for comment)
  timestamps: true                       // Created/updated timestamps
}
```

## Database Relationships

- **User ↔ User**: Many-to-many relationship for followers/following
- **User → Post**: One-to-many (user can create multiple posts)
- **Post → Comment**: One-to-many (post can have multiple comments)
- **User → Comment**: One-to-many (user can make multiple comments)
- **User → Notification**: One-to-many (user can receive multiple notifications)

## API Documentation

### Base URL
```
http://localhost:5001/api
```

### Authentication
All protected routes require a valid Clerk JWT token in the Authorization header:
```
Authorization: Bearer <clerk_jwt_token>
```

### User Routes (`/api/users`)

#### 1. Get User Profile (Public)
- **Endpoint**: `GET /api/users/profile/:username`
- **Description**: Retrieve public profile information for any user
- **Input**: 
  - `username` (URL parameter): The username to look up
- **Output**:
  ```json
  {
    "user": {
      "_id": "user_id",
      "username": "johndoe",
      "firstName": "John",
      "lastName": "Doe",
      "profilePicture": "https://example.com/image.jpg",
      "bio": "Software developer",
      "location": "New York",
      "followers": ["follower1_id", "follower2_id"],
      "following": ["following1_id"],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
  ```
- **Workflow**: 
  1. Extract username from URL parameters
  2. Query database for user with matching username
  3. Return user profile data (excluding sensitive information)
  4. Return 404 if user not found

#### 2. Sync User (Protected)
- **Endpoint**: `POST /api/users/sync`
- **Description**: Create or sync user data from Clerk authentication
- **Input**: No body required (uses Clerk auth token)
- **Output**:
  ```json
  {
    "user": {
      "_id": "user_id",
      "clerkId": "clerk_user_id",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "username": "john",
      "profilePicture": "https://clerk.com/avatar.jpg"
    },
    "message": "User created successfully"
  }
  ```
- **Workflow**:
  1. Extract user ID from Clerk auth token
  2. Check if user already exists in database
  3. If exists: return existing user data
  4. If new: fetch user data from Clerk API
  5. Create new user record in database
  6. Return created user data

#### 3. Get Current User (Protected)
- **Endpoint**: `GET /api/users/me`
- **Description**: Get authenticated user's profile information
- **Input**: No body required (uses Clerk auth token)
- **Output**:
  ```json
  {
    "user": {
      "_id": "user_id",
      "clerkId": "clerk_user_id",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "username": "john",
      "profilePicture": "https://example.com/image.jpg",
      "bio": "Software developer",
      "location": "New York",
      "followers": ["follower1_id"],
      "following": ["following1_id"]
    }
  }
  ```
- **Workflow**:
  1. Extract user ID from Clerk auth token
  2. Query database for user with matching clerkId
  3. Return user profile data
  4. Return 404 if user not found

#### 4. Update Profile (Protected)
- **Endpoint**: `PUT /api/users/profile`
- **Description**: Update authenticated user's profile information
- **Input**:
  ```json
  {
    "bio": "Updated bio",
    "location": "San Francisco",
    "profilePicture": "https://new-image.com/avatar.jpg"
  }
  ```
- **Output**:
  ```json
  {
    "user": {
      "_id": "user_id",
      "clerkId": "clerk_user_id",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "username": "john",
      "bio": "Updated bio",
      "location": "San Francisco",
      "profilePicture": "https://new-image.com/avatar.jpg"
    }
  }
  ```
- **Workflow**:
  1. Extract user ID from Clerk auth token
  2. Find user in database by clerkId
  3. Update user record with provided fields
  4. Return updated user data
  5. Return 404 if user not found

#### 5. Follow/Unfollow User (Protected)
- **Endpoint**: `POST /api/users/follow/:targetUserId`
- **Description**: Follow or unfollow another user
- **Input**: 
  - `targetUserId` (URL parameter): ID of user to follow/unfollow
- **Output**:
  ```json
  {
    "message": "User followed successfully"
  }
  ```
- **Workflow**:
  1. Extract user ID from Clerk auth token
  2. Extract target user ID from URL parameters
  3. Validate that user is not trying to follow themselves
  4. Check if already following the target user
  5. If following: remove from following/followers arrays (unfollow)
  6. If not following: add to following/followers arrays (follow)
  7. Create notification for follow action
  8. Return success message

### Post Routes (`/api/posts`)

#### 1. Get All Posts (Public)
- **Endpoint**: `GET /api/posts`
- **Description**: Retrieve all posts with user and comment information
- **Input**: No body required
- **Output**:
  ```json
  {
    "posts": [
      {
        "_id": "post_id",
        "content": "Hello world!",
        "image": "https://example.com/post-image.jpg",
        "likes": ["user1_id", "user2_id"],
        "user": {
          "_id": "user_id",
          "username": "johndoe",
          "firstName": "John",
          "lastName": "Doe",
          "profilePicture": "https://example.com/avatar.jpg"
        },
        "comments": [
          {
            "_id": "comment_id",
            "content": "Great post!",
            "user": {
              "_id": "user_id",
              "username": "janedoe",
              "firstName": "Jane",
              "lastName": "Doe",
              "profilePicture": "https://example.com/avatar2.jpg"
            }
          }
        ],
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
  ```
- **Workflow**:
  1. Query all posts from database
  2. Populate user information for each post
  3. Populate comments with user information
  4. Sort posts by creation date (newest first)
  5. Return formatted post data

#### 2. Get Single Post (Public)
- **Endpoint**: `GET /api/posts/:postId`
- **Description**: Retrieve a specific post with full details
- **Input**: 
  - `postId` (URL parameter): ID of the post to retrieve
- **Output**: Same as get all posts but for single post
- **Workflow**:
  1. Extract post ID from URL parameters
  2. Query database for post with matching ID
  3. Populate user and comment information
  4. Return post data or 404 if not found

#### 3. Get User Posts (Public)
- **Endpoint**: `GET /api/posts/user/:username`
- **Description**: Retrieve all posts from a specific user
- **Input**: 
  - `username` (URL parameter): Username whose posts to retrieve
- **Output**: Same as get all posts but filtered by user
- **Workflow**:
  1. Extract username from URL parameters
  2. Find user in database by username
  3. Query all posts by that user
  4. Populate user and comment information
  5. Sort by creation date and return

#### 4. Create Post (Protected)
- **Endpoint**: `POST /api/posts`
- **Description**: Create a new post with optional image upload
- **Input**: 
  - `content` (string, optional): Text content of the post
  - `image` (file, optional): Image file to upload
- **Output**:
  ```json
  {
    "post": {
      "_id": "post_id",
      "content": "My new post!",
      "image": "https://res.cloudinary.com/cloud/image/upload/v123/post-image.jpg",
      "user": "user_id",
      "likes": [],
      "comments": [],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
  ```
- **Workflow**:
  1. Extract user ID from Clerk auth token
  2. Validate that post has either content or image
  3. Find user in database by clerkId
  4. If image provided:
     - Convert Multer buffer to base64
     - Upload to Cloudinary with optimizations
     - Get secure URL from Cloudinary
  5. Create post in database with user ID, content, and image URL
  6. Return created post data

#### 5. Like/Unlike Post (Protected)
- **Endpoint**: `POST /api/posts/:postId/like`
- **Description**: Toggle like status on a post
- **Input**: 
  - `postId` (URL parameter): ID of the post to like/unlike
- **Output**:
  ```json
  {
    "message": "Post liked successfully"
  }
  ```
- **Workflow**:
  1. Extract user ID from Clerk auth token
  2. Extract post ID from URL parameters
  3. Find user and post in database
  4. Check if user already liked the post
  5. If liked: remove user from likes array (unlike)
  6. If not liked: add user to likes array (like)
  7. Create notification for like action
  8. Return success message

#### 6. Delete Post (Protected)
- **Endpoint**: `DELETE /api/posts/:postId`
- **Description**: Delete a post (only by the post creator)
- **Input**: 
  - `postId` (URL parameter): ID of the post to delete
- **Output**:
  ```json
  {
    "message": "Post deleted successfully"
  }
  ```
- **Workflow**:
  1. Extract user ID from Clerk auth token
  2. Extract post ID from URL parameters
  3. Find post in database
  4. Verify that the authenticated user is the post creator
  5. Delete the post from database
  6. Return success message

### Comment Routes (`/api/comments`)

#### 1. Get Post Comments (Public)
- **Endpoint**: `GET /api/comments/post/:postId`
- **Description**: Retrieve all comments for a specific post
- **Input**: 
  - `postId` (URL parameter): ID of the post to get comments for
- **Output**:
  ```json
  {
    "comments": [
      {
        "_id": "comment_id",
        "content": "Great post!",
        "user": {
          "_id": "user_id",
          "username": "johndoe",
          "firstName": "John",
          "lastName": "Doe",
          "profilePicture": "https://example.com/avatar.jpg"
        },
        "likes": ["user1_id"],
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
  ```
- **Workflow**:
  1. Extract post ID from URL parameters
  2. Query all comments for the specified post
  3. Populate user information for each comment
  4. Return formatted comment data

#### 2. Create Comment (Protected)
- **Endpoint**: `POST /api/comments/post/:postId`
- **Description**: Add a comment to a specific post
- **Input**: 
  - `postId` (URL parameter): ID of the post to comment on
  - `content` (string, required): Comment text content
- **Output**:
  ```json
  {
    "comment": {
      "_id": "comment_id",
      "content": "My comment!",
      "user": "user_id",
      "post": "post_id",
      "likes": [],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
  ```
- **Workflow**:
  1. Extract user ID from Clerk auth token
  2. Extract post ID from URL parameters
  3. Extract comment content from request body
  4. Find user and post in database
  5. Create comment in database with user ID, post ID, and content
  6. Create notification for comment action
  7. Return created comment data

#### 3. Delete Comment (Protected)
- **Endpoint**: `DELETE /api/comments/:commentId`
- **Description**: Delete a comment (only by the comment creator)
- **Input**: 
  - `commentId` (URL parameter): ID of the comment to delete
- **Output**:
  ```json
  {
    "message": "Comment deleted successfully"
  }
  ```
- **Workflow**:
  1. Extract user ID from Clerk auth token
  2. Extract comment ID from URL parameters
  3. Find comment in database
  4. Verify that the authenticated user is the comment creator
  5. Delete the comment from database
  6. Return success message

### Notification Routes (`/api/notifications`)

#### 1. Get Notifications (Protected)
- **Endpoint**: `GET /api/notifications`
- **Description**: Retrieve all notifications for the authenticated user
- **Input**: No body required (uses Clerk auth token)
- **Output**:
  ```json
  {
    "notifications": [
      {
        "_id": "notification_id",
        "from": {
          "_id": "user_id",
          "username": "johndoe",
          "firstName": "John",
          "lastName": "Doe",
          "profilePicture": "https://example.com/avatar.jpg"
        },
        "to": "current_user_id",
        "type": "follow",
        "post": null,
        "comment": null,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
  ```
- **Workflow**:
  1. Extract user ID from Clerk auth token
  2. Query all notifications where the user is the recipient
  3. Populate sender user information
  4. Return formatted notification data

#### 2. Delete Notification (Protected)
- **Endpoint**: `DELETE /api/notifications/:notificationId`
- **Description**: Delete a specific notification
- **Input**: 
  - `notificationId` (URL parameter): ID of the notification to delete
- **Output**:
  ```json
  {
    "message": "Notification deleted successfully"
  }
  ```
- **Workflow**:
  1. Extract user ID from Clerk auth token
  2. Extract notification ID from URL parameters
  3. Find notification in database
  4. Verify that the authenticated user is the notification recipient
  5. Delete the notification from database
  6. Return success message

## Security Features

### Arcjet Protection
- **Rate Limiting**: 15 requests per 10 seconds per IP
- **Bot Detection**: Blocks automated bots (except search engines)
- **Attack Prevention**: Protects against SQL injection, XSS, and CSRF attacks
- **Global Application**: Applied to all routes via middleware

### Authentication
- **Clerk Integration**: JWT-based authentication system
- **Route Protection**: `protectRoute` middleware for sensitive endpoints
- **User Validation**: Automatic user verification on protected routes

### File Upload Security
- **Multer Validation**: File type and size restrictions
- **Cloudinary Processing**: Secure cloud storage with image optimization
- **Buffer Handling**: Memory-based file processing for security

## Error Handling

All endpoints return appropriate HTTP status codes:
- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **429**: Too Many Requests
- **500**: Internal Server Error

Error responses include descriptive messages:
```json
{
  "error": "Error Type",
  "message": "Detailed error description"
}
```

