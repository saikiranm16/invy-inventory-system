# Deployment Notes

Update these values before deploying:

Backend env file:
- `backend/.env`
- `MONGO_URI`
- `JWT_SECRET`
- `JWT_EXPIRE`
- `ADMIN_SECRET`
- `GMAIL_USER`
- `GMAIL_APP_PASSWORD`
- `EMAIL_FROM`
- `CLIENT_ORIGINS`

Frontend / client deployment:
- Set `NEXT_PUBLIC_API_URL` to your deployed backend URL if it is not `http://localhost:5000/api`

How admin registration works:
- Leave `adminSecret` empty to create a normal `user`
- Provide the value from `ADMIN_SECRET` to create an `admin`

Default seeded users:
- Admin: `admin@invy.local` / `Admin@123`
- User: `user@invy.local` / `User@123`

Password reset email:
- Gmail delivery uses `GMAIL_USER` and `GMAIL_APP_PASSWORD`
- Use a Gmail App Password, not your normal Gmail login password
- `EMAIL_FROM` can usually be the same as `GMAIL_USER`
