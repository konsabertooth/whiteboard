# Whiteboard Application

## Steps to Run

### Without Docker
1. open a terminal
2. go in the backend
3. run npm start

4. open anotherterminal
5. go in the frontend
6. run  npm run dev

7. go to http://localhost:5173/mywhiteboard

### With Docker image on dockerhub

First, login to docker cli then do:

1. open a terminal
2. docker run -p 5000:5000 jawad571/whiteboard-backend

3. open another terminal
4. docker run -p 5173:5173 jawad571/whiteboard-frontend

7. go to http://localhost:5173/mywhiteboard

### With Docker by building image locally

1. open a terminal
2. cd backend
3. docker build . -t whiteboard-backend
4. docker run -p 5000:5000 hiteboard-backend

5. open a terminal
6. cd frontend
7. docker build . -t whiteboard-frontend
8. docker run -p 5173:5173 whiteboard-frontend

9. go to http://localhost:5173/mywhiteboard


