import requests
import os

class FortyTwoOAuth:
    AUTH_URL    = "https://api.intra.42.fr/oauth/authorize"
    TOKEN_URL   = "https://api.intra.42.fr/oauth/token"
    PROFILE_URL = "https://api.intra.42.fr/v2/me"

    @staticmethod
    def get_auth_url():
        params = {
            "client_id":     os.getenv("FORTYTWO_CLIENT_ID"),
            "redirect_uri":  os.getenv("FORTYTWO_REDIRECT_URI"),
            "response_type": "code",
            "scope":         "public",
        }
        from urllib.parse import urlencode
        return f"{FortyTwoOAuth.AUTH_URL}?{urlencode(params)}"

    @staticmethod
    def exchange_code(code):
        res = requests.post(FortyTwoOAuth.TOKEN_URL, data={
            "grant_type":    "authorization_code",
            "client_id":     os.getenv("FORTYTWO_CLIENT_ID"),
            "client_secret": os.getenv("FORTYTWO_CLIENT_SECRET"),
            "redirect_uri":  os.getenv("FORTYTWO_REDIRECT_URI"),
            "code":          code,
        })
        return res.json().get("access_token")

    @staticmethod
    def get_user_profile(access_token):
        res = requests.get(
            FortyTwoOAuth.PROFILE_URL,
            headers={"Authorization": f"Bearer {access_token}"}
        )
        data = res.json()
        return {
            "provider": "42",
            "uid":        str(data["id"]),
            "username":   data["login"],
            "email":      data["email"],
            "first_name": data["first_name"],
            "last_name":  data["last_name"],
        }


class GitHubOAuth:
    AUTH_URL    = "https://github.com/login/oauth/authorize"
    TOKEN_URL   = "https://github.com/login/oauth/access_token"
    PROFILE_URL = "https://api.github.com/user"
    EMAIL_URL   = "https://api.github.com/user/emails"

    @staticmethod
    def get_auth_url():
        from urllib.parse import urlencode
        params = {
            "client_id":    os.getenv("GITHUB_CLIENT_ID"),
            "redirect_uri": os.getenv("GITHUB_REDIRECT_URI"),
            "scope":        "user:email",
        }
        return f"{GitHubOAuth.AUTH_URL}?{urlencode(params)}"

    @staticmethod
    def exchange_code(code):
        res = requests.post(GitHubOAuth.TOKEN_URL, data={
            "client_id":     os.getenv("GITHUB_CLIENT_ID"),
            "client_secret": os.getenv("GITHUB_CLIENT_SECRET"),
            "redirect_uri":  os.getenv("GITHUB_REDIRECT_URI"),
            "code":          code,
        }, headers={"Accept": "application/json"})
        return res.json().get("access_token")

    @staticmethod
    def get_user_profile(access_token):
        headers = {"Authorization": f"Bearer {access_token}"}
        data  = requests.get(GitHubOAuth.PROFILE_URL, headers=headers).json()
        # GitHub can return email as null if it's set to private
        email = data.get("email")
        if not email:
            emails = requests.get(GitHubOAuth.EMAIL_URL, headers=headers).json()
            primary = next((e for e in emails if e["primary"]), None)
            email = primary["email"] if primary else f"{data['login']}@github.noemail"
        name_parts = (data.get("name") or data["login"]).split(" ", 1)
        return {
            "provider":   "github",
            "uid":        str(data["id"]),
            "username":   data["login"],
            "email":      email,
            "first_name": name_parts[0],
            "last_name":  name_parts[1] if len(name_parts) > 1 else "",
        }


class GoogleOAuth:
    AUTH_URL    = "https://accounts.google.com/o/oauth2/v2/auth"
    TOKEN_URL   = "https://oauth2.googleapis.com/token"
    PROFILE_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

    @staticmethod
    def get_auth_url():
        from urllib.parse import urlencode
        params = {
            "client_id":     os.getenv("GOOGLE_CLIENT_ID"),
            "redirect_uri":  os.getenv("GOOGLE_REDIRECT_URI"),
            "response_type": "code",
            "scope":         "openid email profile",
            "access_type":   "offline",
        }
        return f"{GoogleOAuth.AUTH_URL}?{urlencode(params)}"

    @staticmethod
    def exchange_code(code):
        res = requests.post(GoogleOAuth.TOKEN_URL, data={
            "grant_type":    "authorization_code",
            "client_id":     os.getenv("GOOGLE_CLIENT_ID"),
            "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
            "redirect_uri":  os.getenv("GOOGLE_REDIRECT_URI"),
            "code":          code,
        })
        return res.json().get("access_token")

    @staticmethod
    def get_user_profile(access_token):
        res  = requests.get(
            GoogleOAuth.PROFILE_URL,
            headers={"Authorization": f"Bearer {access_token}"}
        )
        data = res.json()
        return {
            "provider":   "google",
            "uid":        data["id"],
            "username":   data["email"].split("@")[0],
            "email":      data["email"],
            "first_name": data.get("given_name", ""),
            "last_name":  data.get("family_name", ""),
        }