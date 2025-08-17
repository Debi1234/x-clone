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

