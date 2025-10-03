# Footprint Logger

> Live site: Currently being rendered  [here](https://footprint-logger-gfeh.onrender.com)

Footprint Logger is a full-stack web application that helps users track and understand their daily carbon footprint.  
It allows individuals to log activities that contribute to CO₂ emissions, view personal summaries, and compare their results with the broader community.  

## About the Project

This project was designed for a real-world use case where an environmental group wanted an accessible way for people to track emissions.  
The goal is to raise awareness, encourage eco-friendly habits, and build a sense of community through shared impact.  

# Footprint Logger

Footprint Logger is a small full-stack web app for tracking personal CO₂-emitting activities. Users can register, log activities (food/transport/energy/custom), view daily and weekly summaries, and receive realtime tips.

This README covers how to run the project locally, environment variables, and a few implementation notes (socket auth and the global spinner UX).

## Repo layout
- `public/` — static frontend (HTML, CSS, vanilla JS)
- `server/` — Express server, Mongoose models and API endpoints (this is where you run the Node server)

## Technologies used

- Frontend: HTML, CSS, and vanilla JavaScript
- Visualization: Chart rendering is done with a simple canvas-based chart (no heavy framework); you may see Chart.js used in earlier versions
- Realtime: Socket.IO for realtime tips and client-server socket communication
- Backend: Node.js with Express
- Database: MongoDB with Mongoose ODM
- Authentication: JSON Web Tokens (jsonwebtoken) and bcrypt for password hashing
- Environment/config: dotenv for environment variables
- Development tooling: nodemon for dev reloads, Prettier for formatting


## Quickstart (local development)
1. Clone the repo and open it:

   git clone https://github.com/your-username/footprint-logger.git
   cd footprint-logger

2. Install server dependencies (server lives in `server/`):

   cd server
   npm install

3. Create a `.env` file inside the `server/` directory. At minimum set:

   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_secret_key
   PORT=5000

   Note: If `MONGO_URI` is missing the server will start but Mongoose will throw an error when attempting to connect.

4. Start the server in development mode:

   npm run dev

   Or start in production mode:

   npm start

5. Open the app in your browser:

   http://localhost:5000

## Useful commands
- Install server deps: `cd server && npm install`
- Start dev server (nodemon): `cd server && npm run dev`
- Start production server: `cd server && npm start`
- Format files with Prettier (from repo root): `npx prettier --write "public/**/*.{js,css,html}" && cd server && npx prettier --write "**/*.{js,json}"`

## Environment variables
- `MONGO_URI` — MongoDB connection string (required for DB routes)
- `JWT_SECRET` — secret used to sign JWTs (fallback default exists in code for development but set a secure value for real deployments)
- `PORT` — server port (defaults to 5000)

Create the `.env` file in the `server/` directory, not the repo root.

## Notes on socket authentication
- The server uses Socket.IO to deliver realtime tips. When a socket connects the client should emit a `register` event containing the JWT token (not the username). The server verifies the token server-side, extracts the `userId` from the token payload, and joins a room for that user. This avoids trusting client-supplied identifiers.

Client example (already implemented):

```js
// public/script.js
socket = io();
socket.on('connect', () => {
  const token = localStorage.getItem('token');
  if (token) socket.emit('register', token);
});
```

Server behavior (already implemented): the server verifies the token with `JWT_SECRET` and, if valid, joins the user's room so it can emit `tip` events to that user.

## Global spinner UX
- The frontend uses a global overlay spinner for long-running actions (login/register and activity logging). Helpers are exposed as `window.showGlobalSpinner()` and `window.hideGlobalSpinner()` from `public/ui.js`.

## API Endpoints (overview)
- `POST /api/register` — register new user
- `POST /api/login` — returns `{ token, username, email }`
- `POST /api/activities` — create activity (protected)
- `GET /api/activities` — list user activities (protected)
- `GET /api/activities/weekly` — aggregated weekly totals (protected)
- `GET /api/activities/category-summary` — category totals for last 7 days (protected)
- `POST /api/goals` and `GET /api/goals` — set/get weeklyGoal for user (protected)

Protected routes require an `Authorization: Bearer <token>` header.

## Troubleshooting
- "MongooseError: The `uri` parameter... got 'undefined'" — you need to set `MONGO_URI` in `server/.env`.
- If sockets don't receive tips, verify the client emits the JWT token on `register` and that the server's `JWT_SECRET` matches the one used to sign tokens.

## Development tips
- Use `nodemon` (already set up) for automatic restarts: `npm run dev` inside `server/`.
- Format code with Prettier as shown above.

## Contributing / Next steps
- Improve socket auth by exchanging a short-lived socket token after login (optional enhancement).
- Add unit tests for the API and small integration tests for auth flows.

---

🌱 Track. Learn. Improve. Together we can reduce our footprint.
