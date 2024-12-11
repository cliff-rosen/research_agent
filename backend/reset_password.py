from sqlalchemy import text
from database import engine
from services.auth_service import get_password_hash

def reset_admin_password():
    # Generate new password hash
    new_password = "admin"
    hashed_password = get_password_hash(new_password)
    
    # Update password in database
    with engine.connect() as connection:
        query = text("UPDATE users SET password = :password WHERE email = 'admin@cognify.com'")
        connection.execute(query, {"password": hashed_password})
        connection.commit()
        print("Password reset successfully")

if __name__ == "__main__":
    reset_admin_password() 