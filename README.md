# Full Stack Repo Template

## Stack Overview

Frontend:
- vite / react
- tailwindcss
- shadcn

Backend:
- fastapi
- sqlalchemy
- PostgreSQL
- Alembic
- Uvicorn
- SQLModel

Database:
- mariadb

Functionalities:
- Authentication
- Authorization
- User Management
- Healthcheck

## Repo Setup

1. download repo
- retrieve repo
```
curl -L -o fullstack_template.zip https://github.com/cliff-rosen/fullstack_template/archive/refs/heads/master.zip
```
- unzip and name root folder as APP_NAME

2. navigate to repo
```
cd APP_NAME
```

3. create repo on github

4. initialize git repo
```
git init
git add .
git commit -m "initial commit"
git branch -M main
```

5. push to github
```
git remote add origin https://github.com/your-repo/APP_NAME.git
git push -u origin main
```


## Database Setup
- determine database name
- create a database in AWS RDS
- set DB_NAME in .env

## Backend Setup

1. create virtual environment
```
cd backend
python -m venv venv
```

2. activate virtual environment
```
venv\Scripts\Activate.ps1
```

3. install dependencies
```
pip install -r requirements.txt
```

4. configure backend
- create .env file (see .env.example)
- configure database connection in .env
- set app name and version in settings.py

5. create alembic.ini file (see alembic.ini.example)


6. run backend
```
uvicorn main:app --reload
``` 

7. Verify backend is running
- open browser and navigate to
```
http://localhost:8000/docs
```

- verify that healthcheck endpoint is accessible


## Frontend Setup

0. update index.html
- set title to app name
- set icon to app-icon.svg

1. update settings.ts   
- set apiUrl to backend api url
- set appName to app name

2. install dependencies
```
cd frontend
npm install
```

3. run frontend
```
npm run dev
```

