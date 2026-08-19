from __future__ import annotations

import logging
from typing import Any
from urllib.parse import urljoin

import httpx
from bs4 import BeautifulSoup

from app.college.parser import parse_ams_profile


logger = logging.getLogger(__name__)


class AmsAuthenticationError(Exception):
    """
    Raised when the supplied AMS credentials are invalid.

    This is different from:
    - network errors
    - timeout errors
    - AMS server errors
    - parsing errors
    """

    def __init__(
        self,
        message: str = (
            "Invalid AMS credentials. "
            "Check the VTU number and AMS password."
        ),
    ) -> None:
        super().__init__(message)


class AmsAdapter:
    """
    Vel Tech Academic Management System adapter.

    AMS LOGIN
    ---------
    Username:
        VTU number / portal username

        Example:
            VTU26381

    Password:
        AMS account password

    COLLEGE ROLL / REGISTRATION NUMBER
    ----------------------------------
    rollNumber:
        Example:
            23UECS1039

    IMPORTANT:
        AMS username and college roll number are separate.

        AMS username:
            VTU26381

        Roll / registration number:
            23UECS1039

    The Parent Portal uses the VTU number as its login
    identifier according to the current project flow.
    """

    BASE_URL = "https://ams.veltech.edu.in"

    LOGIN_URL = f"{BASE_URL}/Login.htm"
    VALIDATION_URL = f"{BASE_URL}/Validation.aspx"
    DEFAULT_URL = f"{BASE_URL}/Default.aspx"
    LOGOUT_URL = f"{BASE_URL}/Logout.aspx"

    def __init__(self) -> None:
        self.timeout = 60.0

        self.headers = {
            "User-Agent": (
                "Mozilla/5.0 "
                "(Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 "
                "(KHTML, like Gecko) "
                "Chrome/151.0.0.0 Safari/537.36"
            ),
            "Accept": (
                "text/html,application/xhtml+xml,"
                "application/xml;q=0.9,image/avif,"
                "image/webp,*/*;q=0.8"
            ),
            "Accept-Language": (
                "en-IN,en-GB;q=0.9,en-US;q=0.8"
            ),
            "Connection": "keep-alive",
        }

    # =========================================================
    # LOGIN
    # =========================================================

    async def login(
        self,
        username: str,
        password: str,
        vtu_number: str | None = None,
    ) -> dict[str, Any]:
        """
        Login to the Vel Tech AMS.

        username:
            AMS / VTU username.

        password:
            AMS password.

        vtu_number:
            Optional roll/registration number retained for
            compatibility with existing services.

        Invalid credentials raise:
            AmsAuthenticationError

        Network/server errors are allowed to propagate so
        UserService can distinguish them from invalid credentials.
        """

        username = str(
            username or ""
        ).strip().upper()

        password = str(
            password or ""
        )

        vtu_number = str(
            vtu_number or ""
        ).strip()

        if not username:
            raise ValueError(
                "AMS username / VTU number is required."
            )

        if not password:
            raise ValueError(
                "AMS password is required."
            )

        client = httpx.AsyncClient(
            follow_redirects=True,
            timeout=httpx.Timeout(
                connect=20.0,
                read=60.0,
                write=30.0,
                pool=20.0,
            ),
            headers=self.headers,
        )

        try:
            # =================================================
            # STEP 1: OPEN LOGIN PAGE
            # =================================================

            login_response = await client.get(
                self.LOGIN_URL
            )

            login_response.raise_for_status()

            # =================================================
            # STEP 2: SUBMIT LOGIN
            # =================================================

            validation_response = await client.post(
                self.VALIDATION_URL,
                data={
                    "username": username,
                    "password": password,
                },
                headers={
                    "Content-Type": (
                        "application/x-www-form-urlencoded"
                    ),
                    "Referer": self.LOGIN_URL,
                    "Origin": self.BASE_URL,
                },
            )

            validation_response.raise_for_status()

            # =================================================
            # STEP 3: CHECK LOGIN RESPONSE
            # =================================================

            if self._is_invalid_login_response(
                validation_response
            ):
                raise AmsAuthenticationError()

            # =================================================
            # STEP 4: OPEN DASHBOARD
            # =================================================

            dashboard_response = await client.get(
                self.DEFAULT_URL,
                headers={
                    "Referer": self.LOGIN_URL,
                },
            )

            dashboard_response.raise_for_status()

            # =================================================
            # STEP 5: CHECK REDIRECT
            # =================================================

            if self._is_login_page(
                str(dashboard_response.url)
            ):
                raise AmsAuthenticationError()

            html = dashboard_response.text

            # =================================================
            # STEP 6: CHECK AUTHENTICATION ERROR TEXT
            # =================================================

            if self._contains_authentication_error(
                html
            ):
                raise AmsAuthenticationError()

            # =================================================
            # STEP 7: VERIFY STUDENT PAGE
            # =================================================

            if not self._looks_like_student_page(
                html
            ):
                raise AmsAuthenticationError(
                    "AMS login was not accepted. "
                    "Please check the VTU number and AMS password."
                )

            # =================================================
            # SUCCESS
            # =================================================

            logger.info(
                "AMS authentication successful for %s",
                username,
            )

            return {
                "client": client,
                "username": username,
                "portalUsername": username,
                "vtuNumber": vtu_number,
                "dashboard_html": html,
                "url": str(
                    dashboard_response.url
                ),
            }

        except AmsAuthenticationError:
            try:
                await client.aclose()
            except Exception:
                pass

            raise

        except httpx.HTTPStatusError as exc:
            status_code = (
                exc.response.status_code
                if exc.response is not None
                else None
            )

            if status_code in {
                401,
                403,
            }:
                try:
                    await client.aclose()
                except Exception:
                    pass

                raise AmsAuthenticationError() from exc

            try:
                await client.aclose()
            except Exception:
                pass

            raise

        except (
            httpx.ConnectError,
            httpx.ConnectTimeout,
            httpx.ReadTimeout,
            httpx.WriteTimeout,
            httpx.PoolTimeout,
        ):
            try:
                await client.aclose()
            except Exception:
                pass

            raise

        except Exception:
            try:
                await client.aclose()
            except Exception:
                pass

            raise

    # =========================================================
    # INVALID LOGIN RESPONSE
    # =========================================================

    @classmethod
    def _is_invalid_login_response(
        cls,
        response: httpx.Response,
    ) -> bool:
        """
        Detect failed AMS authentication after submitting
        the login form.

        AMS can return HTTP 200 after redirecting back to
        Login.htm, so status code alone is not sufficient.
        """

        final_url = str(
            response.url
        )

        if cls._is_login_page(
            final_url
        ):
            return True

        return cls._contains_authentication_error(
            response.text
        )

    # =========================================================
    # LOGIN PAGE DETECTION
    # =========================================================

    @classmethod
    def _is_login_page(
        cls,
        url: str,
    ) -> bool:
        """
        Detect whether AMS redirected the request back to
        its login page.
        """

        normalized_url = str(
            url or ""
        ).lower()

        return (
            "login.htm" in normalized_url
            or "login.aspx" in normalized_url
            or "/login" in normalized_url
        )

    # =========================================================
    # AUTHENTICATION ERROR TEXT
    # =========================================================

    @classmethod
    def _contains_authentication_error(
        cls,
        html: str,
    ) -> bool:
        """
        Detect common authentication failure messages.

        This is intentionally conservative so normal student
        profile pages are not incorrectly rejected.
        """

        if not html:
            return False

        soup = BeautifulSoup(
            html,
            "html.parser",
        )

        text = soup.get_text(
            " ",
            strip=True,
        ).lower()

        error_phrases = (
            "invalid username",
            "invalid password",
            "invalid user",
            "invalid credentials",
            "username or password",
            "user name or password",
            "incorrect username",
            "incorrect password",
            "login failed",
            "authentication failed",
            "authentication failure",
            "invalid login",
            "wrong username",
            "wrong password",
        )

        return any(
            phrase in text
            for phrase in error_phrases
        )

    # =========================================================
    # GET STUDENT PROFILE
    # =========================================================

    async def get_student_profile(
        self,
        session: dict[str, Any],
    ) -> dict[str, Any]:
        """
        Extract the complete student profile from AMS.
        """

        client = session.get(
            "client"
        )

        if not client:
            raise ValueError(
                "AMS session is missing."
            )

        html = session.get(
            "dashboard_html"
        )

        # =====================================================
        # REFRESH DASHBOARD IF REQUIRED
        # =====================================================

        if not html:
            response = await client.get(
                self.DEFAULT_URL,
                headers={
                    "Referer": self.LOGIN_URL,
                },
            )

            response.raise_for_status()

            if self._is_login_page(
                str(response.url)
            ):
                raise AmsAuthenticationError()

            html = response.text

            session["dashboard_html"] = html

        # =====================================================
        # PARSE AMS PROFILE
        # =====================================================

        profile = parse_ams_profile(
            html
        )

        if not isinstance(
            profile,
            dict,
        ):
            raise ValueError(
                "AMS profile parser returned invalid data."
            )

        # =====================================================
        # PRESERVE IDENTIFIERS
        # =====================================================

        portal_username = (
            profile.get("portalUsername")
            or profile.get("portal_username")
            or session.get("portalUsername")
            or session.get("username")
        )

        roll_number = (
            profile.get("vtuNumber")
            or profile.get("vtu_number")
            or profile.get("registrationNumber")
            or profile.get("registration_number")
        )

        if portal_username:
            profile["portalUsername"] = str(
                portal_username
            ).strip().upper()

        if roll_number:
            profile["vtuNumber"] = str(
                roll_number
            ).strip()

        # =====================================================
        # FETCH STUDENT PHOTO
        # =====================================================

        photo_url = profile.get(
            "photoUrl"
        )

        if photo_url:
            absolute_photo_url = urljoin(
                self.DEFAULT_URL,
                str(photo_url),
            )

            try:
                photo_response = await client.get(
                    absolute_photo_url,
                    headers={
                        "Referer": self.DEFAULT_URL,
                    },
                )

                if photo_response.status_code == 200:
                    content_type = (
                        photo_response.headers
                        .get(
                            "content-type",
                            "",
                        )
                        .lower()
                    )

                    if (
                        "image" in content_type
                        and photo_response.content
                    ):
                        profile["photoBytes"] = (
                            photo_response.content
                        )

            except Exception as exc:
                logger.warning(
                    "AMS photo fetch warning: %s",
                    exc,
                )

        return profile

    # =========================================================
    # LOGOUT
    # =========================================================

    async def logout(
        self,
        session: dict[str, Any],
    ) -> None:
        client = session.get(
            "client"
        )

        if not client:
            return

        try:
            await client.get(
                self.LOGOUT_URL,
                headers={
                    "Referer": self.DEFAULT_URL,
                },
            )

        except Exception as exc:
            logger.warning(
                "AMS logout warning: %s",
                exc,
            )

        finally:
            try:
                await client.aclose()
            except Exception:
                pass

    # =========================================================
    # CHECK AUTHENTICATED STUDENT PAGE
    # =========================================================

    @classmethod
    def _looks_like_student_page(
        cls,
        html: str,
    ) -> bool:
        if not html:
            return False

        soup = BeautifulSoup(
            html,
            "html.parser",
        )

        # =====================================================
        # DIRECT AMS PROFILE IDS
        # =====================================================

        important_ids = [
            "MainContent_lblStuname",
            "MainContent_lblID",
            "MainContent_lblRollNo",
            "MainContent_lblBranch",
            "MainContent_lblFathername",
            "MainContent_lblMothername",
        ]

        matches = sum(
            1
            for element_id in important_ids
            if soup.find(
                id=element_id
            )
        )

        if matches >= 2:
            return True

        # =====================================================
        # FALLBACK TEXT CHECK
        # =====================================================

        page_text = soup.get_text(
            " ",
            strip=True,
        ).lower()

        indicators = (
            "student",
            "father",
            "mother",
            "branch",
            "semester",
            "academic",
        )

        indicator_count = sum(
            1
            for item in indicators
            if item in page_text
        )

        return indicator_count >= 3