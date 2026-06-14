# DailyJournal / DailyChat

A full-stack chat-style journal app built with a plain HTML/CSS/JavaScript frontend and a Node.js/Express backend.

Users can sign up, log in, send text messages, upload images, view posts from all users, and delete their own posts. Images are uploaded to AWS S3, while user and post data is stored in MySQL.

## Features

- User registration and login
- Password hashing with bcrypt
- JWT-based authentication
- Public message feed
- Text posts with optional image uploads
- Image storage through AWS S3
- Delete own posts only
- Auto-refreshing dashboard
- EC2 deployment through GitHub Actions and PM2

## Project Structure

```text
DailyJournal/
|-- backend/
|   |-- app.js              # Express server entry point
|   |-- db.js               # MySQL connection pool
|   |-- s3.js               # AWS S3 client setup
|   |-- package.json        # Backend dependencies
|   `-- routes/
|       |-- auth.js         # Register and login routes
|       `-- posts.js        # Post create, fetch, and delete routes
|-- frontend/
|   |-- login.html          # Login page
|   |-- signup.html         # Signup page
|   |-- dashboard.html      # Main chat dashboard
|   |-- script.js           # Frontend API and UI logic
|   |-- style.css           # Login/signup styles
|   `-- dashboard.css       # Dashboard styles
`-- .github/
    `-- workflows/
        `-- deploy.yml      # GitHub Actions EC2 deployment
```

## Tech Stack

**Frontend**

- HTML
- CSS
- JavaScript

**Backend**

- Node.js
- Express
- MySQL
- bcrypt
- JSON Web Tokens
- multer
- multer-s3
- AWS SDK for S3

## Backend API

### Auth Routes

Base path:

```text
/api/auth
```

#### Register

```http
POST /api/auth/register
```

Body:

```json
{
  "name": "User Name",
  "email": "user@example.com",
  "password": "password"
}
```

Creates a new user and stores the password as a bcrypt hash.

#### Login

```http
POST /api/auth/login
```

Body:

```json
{
  "email": "user@example.com",
  "password": "password"
}
```

Returns a JWT token when the credentials are valid.

### Post Routes

Base path:

```text
/api/posts
```

#### Create Post

```http
POST /api/posts
```

Requires an `Authorization` header containing the JWT token.

Accepts `multipart/form-data`:

- `content` - message text
- `image` - optional image file

Allowed image types:

- JPG
- PNG
- GIF

Maximum image size: 10 MB.

#### Get Posts

```http
GET /api/posts
```

Returns all posts joined with the user name, ordered by newest first.

#### Delete Post

```http
DELETE /api/posts/:id
```

Requires an `Authorization` header containing the JWT token.

Users can only delete posts that belong to their own account.

## Environment Variables

Create a `.env` file inside the `backend/` folder.

```env
PORT=3000

DB_HOST=your_mysql_host
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=your_database_name

JWT_SECRET=your_jwt_secret

AWS_REGION=your_aws_region
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_BUCKET_NAME=your_s3_bucket_name
```

## Database Tables

The backend expects a MySQL database with `users` and `posts` tables.

Example schema:

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Run Locally

Install backend dependencies:

```bash
cd backend
npm install
```

Start the server:

```bash
node app.js
```

The app will run at:

```text
http://localhost:3000
```

The Express server serves the frontend from the `frontend/` folder, so opening the backend URL loads the app.

## Frontend Flow

1. User signs up on `signup.html`.
2. User logs in on `login.html`.
3. The backend returns a JWT token.
4. The frontend stores the token in `localStorage`.
5. The user is redirected to `dashboard.html`.
6. The dashboard loads posts from `/api/posts`.
7. New messages are sent to `/api/posts`.
8. The dashboard refreshes posts every 5 seconds.

## Deployment

Deployment is configured in:

```text
.github/workflows/deploy.yml
```

On every push to the `main` branch, GitHub Actions:

1. Checks out the repository.
2. Connects to the EC2 instance using SSH.
3. Pulls the latest code into `/home/ubuntu/DailyJournal`.
4. Installs backend dependencies.
5. Restarts the app using PM2.

Required GitHub secrets:

```text
EC2_SSH_KEY
EC2_HOST
```

## Notes

- The app name in the folder is `DailyJournal`, but the UI currently says `DailyChat`.
- Post content is rendered with `innerHTML` in the frontend. Escape user input before rendering to prevent XSS.
- Deleting a post removes it from MySQL, but uploaded images are not currently deleted from S3.
- There is no `npm start` script yet. The server can be started with `node app.js`.
