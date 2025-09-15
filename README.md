# Footprint Logger

Footprint Logger is a full-stack web application that helps users track and understand their daily carbon footprint.  
It allows individuals to log activities that contribute to CO₂ emissions, view personal summaries, and compare their results with the broader community.  

## About the Project

This project was designed for a real-world use case where an environmental group wanted an accessible way for people to track emissions.  
The goal is to raise awareness, encourage eco-friendly habits, and build a sense of community through shared impact.  

## Features

- **User Authentication**: Register and log in with secure JWT-based authentication.
- **Personal Activity Logs**: Save and manage activities tied to your account.
- **Daily & Weekly Summaries**: Track personal footprint totals over time, with streak tracking.
- **Community Average**: See how your footprint compares to other users.
- **Leaderboard**: Highlight users with the lowest footprint to inspire healthy competition.
- **Activity Categories**: Log emissions for food, transport, energy, and custom entries.
- **Date Validation**: Prevents users from logging activities for future dates.
- **Interactive Dashboard**: User-friendly interface to view logs, summaries, and comparisons.

## Technologies Used

### Frontend
- HTML, CSS, and Vanilla JavaScript  
- Chart.js for data visualization  

### Backend
- Node.js with Express.js  
- MongoDB with Mongoose ODM  

### Authentication
- JSON Web Tokens (JWT)  
- Bcrypt for secure password hashing  

## Project Goals

This project was created to practice **full-stack development** with a focus on:  
- Designing authentication and protected routes  
- Storing and retrieving user-specific data from a database  
- Building dashboards and visual summaries  
- Implementing community features like averages and leaderboards  
- Strengthening skills in Node.js, MongoDB, and frontend-backend integration  

## Setup Instructions

1. Clone this repository:
   ```bash
   git clone https://github.com/your-username/footprint-logger.git
   cd footprint-logger
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following:
   ```
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_secret_key
   PORT=5000
   ```

4. Start the server:
   ```bash
   npm start
   ```

5. Open the app in your browser:
   ```
   http://localhost:5000
   ```

## Future Improvements

- Mobile-first responsive design  
- Social sharing of achievements  
- Gamification elements (badges, levels)  
- Integration with external APIs for emission data  

---
🌱 *Track. Learn. Improve. Together we can reduce our footprint.* ♻️
