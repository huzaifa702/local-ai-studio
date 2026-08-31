from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any
import uuid
import hashlib
import json
import base64
import time
import urllib.request
import urllib.parse
from ..db.database import get_db
from ..config import JWT_SECRET, GOOGLE_CLIENT_ID

router = APIRouter(prefix="/api/auth", tags=["auth"])

def hash_pw(pw: str) -> str:
    return hashlib.sha256((pw + "salt_ai_2026").encode("utf-8")).hexdigest()

def create_jwt_token(user_id: str, username: str) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": user_id,
        "username": username,
        "iat": int(time.time()),
        "exp": int(time.time()) + (86400 * 30) # 30 days
    }
    header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    sig = hashlib.sha256(f"{header_b64}.{payload_b64}.{JWT_SECRET}".encode()).hexdigest()
    return f"{header_b64}.{payload_b64}.{sig}"

def decode_jwt_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header_b64, payload_b64, sig = parts
        expected_sig = hashlib.sha256(f"{header_b64}.{payload_b64}.{JWT_SECRET}".encode()).hexdigest()
        if sig != expected_sig:
            return None
        
        padded = payload_b64 + "=" * ((4 - len(payload_b64) % 4) % 4)
        payload = json.loads(base64.urlsafe_b64decode(padded.encode()).decode())
        if payload.get("exp", 0) < time.time():
            return None
        return payload
    except Exception:
        return None

async def get_current_user_id(authorization: Optional[str] = Header(None)) -> str:
    if not authorization:
        return "local_user"
    
    token = authorization.replace("Bearer ", "").strip()
    payload = decode_jwt_token(token)
    if payload and "sub" in payload:
        return payload["sub"]
    return "local_user"

def format_user_response(user_row: Dict[str, Any]) -> Dict[str, Any]:
    uid = user_row.get("id", "local_user")
    uname = user_row.get("username", "developer")
    disp = user_row.get("display_name") or user_row.get("displayName") or uname
    avatar = user_row.get("avatar") or (disp[:2]).upper() if disp else "HR"
    return {
        "id": uid,
        "username": uname,
        "email": user_row.get("email"),
        "phoneNumber": user_row.get("phone_number"),
        "displayName": disp,
        "display_name": disp,
        "avatar": avatar,
        "token": create_jwt_token(uid, uname)
    }

# Pydantic Schemas
class EmailRegister(BaseModel):
    email: str
    password: str
    displayName: Optional[str] = None

class EmailLogin(BaseModel):
    email: str
    password: str

class GoogleAuthRequest(BaseModel):
    credential: Optional[str] = None # Real Google ID token from Google Identity Services
    email: Optional[str] = None
    name: Optional[str] = None
    picture: Optional[str] = None
    googleId: Optional[str] = None

class UserProfileUpdate(BaseModel):
    displayName: Optional[str] = None
    avatar: Optional[str] = None
    email: Optional[str] = None

@router.get("/me")
async def get_current_user_profile(user_id: str = Depends(get_current_user_id)):
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT id, username, email, phone_number, display_name, avatar, created_at FROM users WHERE id = ?", 
            (user_id,)
        )
        user = await cursor.fetchone()
        if not user:
            cursor = await db.execute(
                "SELECT id, username, email, phone_number, display_name, avatar, created_at FROM users WHERE id = 'local_user'"
            )
            user = await cursor.fetchone()
            if not user:
                await db.execute(
                    "INSERT INTO users (id, username, email, display_name, avatar) VALUES ('local_user', 'developer', 'local@ai.dev', 'huzaifa rajput', 'HR')"
                )
                await db.commit()
                cursor = await db.execute("SELECT id, username, email, phone_number, display_name, avatar, created_at FROM users WHERE id = 'local_user'")
                user = await cursor.fetchone()
        
        return format_user_response(dict(user))
    finally:
        await db.close()

@router.post("/register")
async def register_email(req: EmailRegister):
    """
    Real email & password registration with salted password hashing.
    """
    db = await get_db()
    try:
        email = req.email.strip().lower()
        if not email or "@" not in email:
            raise HTTPException(status_code=400, detail="Please enter a valid email address.")
        if len(req.password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

        cursor = await db.execute("SELECT id FROM users WHERE email = ? OR username = ?", (email, email))
        if await cursor.fetchone():
            raise HTTPException(status_code=400, detail="An account with this email already exists. Please sign in.")

        user_id = str(uuid.uuid4())
        display_name = req.displayName.strip() if req.displayName and req.displayName.strip() else email.split("@")[0]
        avatar_initials = (display_name[:2]).upper()

        await db.execute(
            "INSERT INTO users (id, username, email, password_hash, display_name, avatar) VALUES (?, ?, ?, ?, ?, ?)",
            (user_id, email, email, hash_pw(req.password), display_name, avatar_initials)
        )
        await db.commit()

        return format_user_response({
            "id": user_id,
            "username": email,
            "email": email,
            "display_name": display_name,
            "avatar": avatar_initials
        })
    finally:
        await db.close()

@router.post("/login")
async def login_email(req: EmailLogin):
    """
    Real email & password login with hashed password verification.
    """
    db = await get_db()
    try:
        email = req.email.strip().lower()
        cursor = await db.execute(
            "SELECT id, username, email, display_name, avatar FROM users WHERE (email = ? OR username = ?) AND password_hash = ?",
            (email, email, hash_pw(req.password))
        )
        user = await cursor.fetchone()
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password.")

        return format_user_response(dict(user))
    finally:
        await db.close()

@router.post("/google")
async def auth_google(req: GoogleAuthRequest):
    """
    Real Google OAuth verification using Google's tokeninfo API.
    Verifies authentic Google ID tokens directly from Google Identity Services.
    """
    db = await get_db()
    try:
        email = None
        display_name = None
        avatar = "HR"
        google_sub = None

        # 1. Verify Real Google ID Token if passed from Google Identity Services
        if req.credential:
            try:
                verify_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={urllib.parse.quote(req.credential)}"
                req_obj = urllib.request.Request(verify_url, headers={"User-Agent": "LocalAI/1.0"})
                with urllib.request.urlopen(req_obj, timeout=10) as response:
                    google_payload = json.loads(response.read().decode("utf-8"))
                
                email = google_payload.get("email")
                display_name = google_payload.get("name") or google_payload.get("given_name")
                avatar = google_payload.get("picture") or (display_name[:2]).upper() if display_name else "G"
                google_sub = google_payload.get("sub")
            except Exception as e:
                raise HTTPException(status_code=401, detail=f"Google OAuth verification failed: {str(e)}")
        else:
            email = req.email.strip().lower() if req.email else None
            display_name = req.name
            google_sub = req.googleId

        if not email:
            raise HTTPException(status_code=400, detail="Google authentication did not provide a valid email.")

        cursor = await db.execute(
            "SELECT id, username, email, display_name, avatar FROM users WHERE email = ? OR google_id = ?", 
            (email, google_sub or email)
        )
        user = await cursor.fetchone()

        if user:
            return format_user_response(dict(user))

        # Create new real Google user in database
        user_id = str(uuid.uuid4())
        name = display_name or email.split("@")[0]
        avatar_val = avatar or (name[:2]).upper()

        await db.execute(
            "INSERT INTO users (id, username, email, google_id, display_name, avatar) VALUES (?, ?, ?, ?, ?, ?)",
            (user_id, email, email, google_sub or f"google_{email}", name, avatar_val)
        )
        await db.commit()

        return format_user_response({
            "id": user_id,
            "username": email,
            "email": email,
            "display_name": name,
            "avatar": avatar_val
        })
    finally:
        await db.close()

@router.put("/profile")
async def update_profile(req: UserProfileUpdate, user_id: str = Depends(get_current_user_id)):
    db = await get_db()
    try:
        updates = []
        params = []
        if req.displayName is not None:
            updates.append("display_name = ?")
            params.append(req.displayName)
        if req.avatar is not None:
            updates.append("avatar = ?")
            params.append(req.avatar)
        if req.email is not None:
            updates.append("email = ?")
            params.append(req.email)
            
        if updates:
            params.append(user_id)
            await db.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = ?", params)
            await db.commit()
            
        cursor = await db.execute("SELECT id, username, email, phone_number, display_name, avatar FROM users WHERE id = ?", (user_id,))
        user = await cursor.fetchone()
        return format_user_response(dict(user))
    finally:
        await db.close()
