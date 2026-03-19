# DevChat 🚀

DevChat is a modern, real-time chat application inspired by platforms like Discord and Slack. Designed for developer communities, it provides a seamless and responsive platform for instant messaging across multiple channels, secure authentication, and a beautifully crafted dark-themed UI.

## Features ✨

*   **User Authentication**: Secure email/password login and registration using bcrypt and JWT.
*   **Google OAuth**: Seamless one-click login and registration with Google via `@react-oauth/google`.
*   **Real-time Chat**: Bi-directional, instantly synced text messaging powered by Socket.IO.
*   **Responsive UI**: A premium, mobile-responsive dark glassmorphism layout built with Tailwind CSS.
*   **Secure Backend**: REST API interactions secured with HTTP headers and JWT verification logic.
*   **Database Integration**: Robust interactions mapped effectively to a MongoDB NoSQL database.
*   **Live User Tracking**: Instantly observe connected members in your channel.

## Tech Stack 🛠️

*   **Frontend**: React (Vite), Tailwind CSS, Lucide React
*   **Backend**: Node.js, Express.js
*   **Database**: MongoDB, Mongoose
*   **Real-time engine**: Socket.IO

## Installation Guide 🚀

Follow these steps to set up DevChat on your local machine.

### Prerequisites
*   Node.js (v18+ recommended)
*   MongoDB URI (Local or MongoDB Atlas)
*   Google Client ID (For Google Auth)

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/devchat.git
cd devchat
```

### 2. Install Dependencies
You will need to install npm packages for both the backend and frontend.
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in **both** the `backend` and `frontend` directories using their respective `.env.example` templates.

**`backend/.env`**
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
PORT=5000
GOOGLE_CLIENT_ID=your_google_client_id
```

**`frontend/.env`**
```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### 4. Run the Backend Server
From the `backend` directory:
```bash
npm run dev
```

### 5. Run the Frontend Development Server
From the `frontend` directory:
```bash
npm run dev
```
Navigate to `http://localhost:5173` in your browser.

## Usage 💡

1.  **Register / Login**: Open the application and create an account by filling out the registration form, or simply click **Continue with Google** to use your Gmail account.
2.  **Start Chatting**: Once redirected to the Dashboard, select a predefined channel (e.g., General, Dev, Random) from the left sidebar.
3.  **Real-time Messaging**: Type a message in the message input box and see it delivered instantly. You can also see when other users come online in the right sidebar.

## Folder Structure 📁

```text
devchat/
├── backend/                  # Server-side code
│   ├── config/               # Database and environment configurations
│   ├── controllers/          # Request handlers (e.g., AuthController)
│   ├── middleware/           # Express middlewares (e.g., JWT Auth)
│   ├── model/                # Mongoose database schemas
│   ├── routes/               # Express API routing definitions
│   └── index.js              # Entry point for the Express server and Socket.IO
│
├── frontend/                 # Client-side React application
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── components/       # Reusable React UI components
│   │   ├── context/          # React Context providers (SocketContext)
│   │   ├── pages/            # Main application views (Login, Register, Dashboard)
│   │   ├── App.jsx           # Main React component and Routing
│   │   └── main.jsx          # React entry point and Google OAuth Provider
│   ├── index.css             # Global stylesheet (Tailwind directives)
│   └── tailwind.config.cjs   # Tailwind CSS configuration
└── README.md
```

## Screenshots 📸

### Login Experience
![Login Screen](file:///C:/Users/Shalu/.gemini/antigravity/brain/49d4c896-a15a-427a-bfaa-a07fd900936f/devchat_login_page_1773948184038.png)

### Registration
![Register Screen](file:///C:/Users/Shalu/.gemini/antigravity/brain/49d4c896-a15a-427a-bfaa-a07fd900936f/devchat_register_page_1773948203405.png)

## Future Improvements 🚀

*   [ ] **Push Notifications**: Receive alerts when mentioned or when receiving direct messages.
*   [ ] **File Sharing**: Support image and document uploads within chat channels.
*   [ ] **Group Chat & Direct Messaging**: Allow users to create private channels and 1-on-1 conversations.
*   [ ] **Message Reactions**: Allow users to react to messages with emojis.

## Author ✍️

**[Your Name / Username]**
- GitHub: [@yourusername](https://github.com/yourusername)
- Twitter: [@yourhandle](https://twitter.com/yourhandle)
