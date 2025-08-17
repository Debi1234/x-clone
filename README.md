# XClone

A Twitter clone built with React Native and Node.js.

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

