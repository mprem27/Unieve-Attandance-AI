from __future__ import annotations

from typing import Any
from urllib.parse import urljoin

import httpx
from bs4 import BeautifulSoup

from app.college.parser import parse_ams_profile


# =========================================================
# AMS AUTHENTICATION ERROR
# =========================================================


class AmsAuthenticationError(Exception):
    """
    Raised only when the supplied AMS credentials are invalid.

    This is intentionally different from:
        - network errors
        - timeout errors
        - AMS server errors
        - parsing errors

    The frontend can therefore show:
        "Invalid AMS credentials."

    without treating the error as an application login failure.
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
        portalUsername
        Example: VTU26381

    Password:
        AMS account password

    COLLEGE ROLL / REGISTRATION NUMBER
    ----------------------------------
    vtuNumber
    Example: 23UECS1039

    Parent Portal login uses the student's VTU number.
    Parent Portal password is NOT required.
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

        username = str(
            username or ""
        ).strip()

        password = str(
            password or ""
        )

        vtu_number = str(
            vtu_number or ""
        ).strip()

        # -----------------------------------------------------
        # BASIC VALIDATION
        # -----------------------------------------------------

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
            # STEP 1: OPEN AMS LOGIN PAGE
            # =================================================

            login_response = await client.get(
                self.LOGIN_URL
            )

            login_response.raise_for_status()

            # =================================================
            # STEP 2: SUBMIT AMS LOGIN
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
            # STEP 3: OPEN AMS DASHBOARD
            # =================================================

            dashboard_response = await client.get(
                self.DEFAULT_URL,
                headers={
                    "Referer": self.LOGIN_URL,
                },
            )

            dashboard_response.raise_for_status()

            html = dashboard_response.text

            # =================================================
            # STEP 4: VERIFY LOGIN
            # =================================================

            if not self._looks_like_student_page(
                html
            ):
                # IMPORTANT:
                #
                # AMS accepted the HTTP request, but the
                # returned page is not an authenticated
                # student page.
                #
                # Treat this specifically as an
                # authentication failure.
                raise AmsAuthenticationError()

            # =================================================
            # SUCCESS
            # =================================================

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
            # -------------------------------------------------
            # INVALID AMS CREDENTIALS
            # -------------------------------------------------
            #
            # Do not replace this with a generic Exception.
            # UserService can identify this error specifically.
            # -------------------------------------------------

            try:
                await client.aclose()
            except Exception:
                pass

            raise

        except httpx.HTTPStatusError as exc:
            # -------------------------------------------------
            # HTTP ERROR
            # -------------------------------------------------
            #
            # A 401/403 from the AMS validation endpoint is
            # treated as invalid credentials.
            #
            # Other HTTP errors are NOT automatically treated
            # as invalid credentials because they may indicate
            # an AMS server-side problem.
            # -------------------------------------------------

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
            # -------------------------------------------------
            # NETWORK / TIMEOUT ERROR
            # -------------------------------------------------
            #
            # DO NOT report this as invalid credentials.
            #
            # The AMS server may simply be unavailable.
            # -------------------------------------------------

            try:
                await client.aclose()
            except Exception:
                pass

            raise

        except Exception:
            # -------------------------------------------------
            # OTHER AMS ERROR
            # -------------------------------------------------

            try:
                await client.aclose()
            except Exception:
                pass

            raise

    # =========================================================
    # GET STUDENT PROFILE
    # =========================================================

    async def get_student_profile(
        self,
        session: dict[str, Any],
    ) -> dict[str, Any]:

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
        # REFRESH AMS DASHBOARD IF REQUIRED
        # =====================================================

        if not html:
            response = await client.get(
                self.DEFAULT_URL,
                headers={
                    "Referer": self.LOGIN_URL,
                },
            )

            response.raise_for_status()

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
        # PRESERVE CORRECT IDENTIFIERS
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
            ).strip()

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

                if (
                    photo_response.status_code == 200
                ):
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
                print(
                    "AMS photo fetch warning:",
                    str(exc),
                )

        return profile

    # =========================================================
    # GET STUDENT ATTENDANCE
    # =========================================================

    async def get_student_attendance(
        self,
        session: dict[str, Any],
    ) -> list[dict[str, Any]]:
        """
        Fetch attendance from the authenticated AMS session.

        IMPORTANT:
            This is an additive method. Existing login,
            profile parsing, photo fetching, and logout
            behavior are not changed.

        The AMS dashboard can expose attendance through a
        normal HTML link. We first look for attendance-related
        links and then parse HTML tables from the selected page.

        If AMS exposes attendance through JavaScript/API calls
        instead of an HTML page, this method returns an empty
        list and the actual AMS endpoint must be added after
        inspecting the network request used by the AMS page.
        """

        client = session.get("client")

        if not client:
            raise ValueError(
                "AMS session is missing."
            )

        dashboard_html = session.get(
            "dashboard_html"
        )

        if not dashboard_html:
            response = await client.get(
                self.DEFAULT_URL,
                headers={
                    "Referer": self.LOGIN_URL,
                },
            )
            response.raise_for_status()
            dashboard_html = response.text
            session["dashboard_html"] = dashboard_html

        soup = BeautifulSoup(
            dashboard_html,
            "html.parser",
        )

        # -----------------------------------------------------
        # FIND ATTENDANCE PAGE
        # -----------------------------------------------------

        attendance_url = None

        keywords = (
            "attendance",
            "attendence",
            "attnd",
        )

        for link in soup.find_all("a"):
            href = link.get("href")
            text = link.get_text(
                " ",
                strip=True,
            ).lower()

            combined = f"{text} {href or ''}".lower()

            if any(
                keyword in combined
                for keyword in keywords
            ):
                if href and not href.startswith("#"):
                    attendance_url = urljoin(
                        self.DEFAULT_URL,
                        href,
                    )
                    break

        # -----------------------------------------------------
        # IF NO LINK WAS FOUND
        # -----------------------------------------------------

        if not attendance_url:
            return []

        # -----------------------------------------------------
        # FETCH ATTENDANCE PAGE
        # -----------------------------------------------------

        response = await client.get(
            attendance_url,
            headers={
                "Referer": self.DEFAULT_URL,
            },
        )
        response.raise_for_status()

        attendance_soup = BeautifulSoup(
            response.text,
            "html.parser",
        )

        # -----------------------------------------------------
        # PARSE HTML TABLES GENERICALLY
        # -----------------------------------------------------

        records: list[dict[str, Any]] = []

        for table in attendance_soup.find_all("table"):
            rows = table.find_all("tr")

            if len(rows) < 2:
                continue

            headers: list[str] = []

            first_row_cells = rows[0].find_all(
                ["th", "td"]
            )

            headers = [
                cell.get_text(
                    " ",
                    strip=True,
                )
                for cell in first_row_cells
            ]

            normalized_headers = [
                header.lower().strip()
                for header in headers
            ]

            attendance_columns = any(
                any(
                    keyword in header
                    for keyword in (
                        "attendance",
                        "present",
                        "absent",
                        "percentage",
                        "%",
                    )
                )
                for header in normalized_headers
            )

            if not attendance_columns:
                continue

            for row in rows[1:]:
                cells = row.find_all(
                    ["td", "th"]
                )

                values = [
                    cell.get_text(
                        " ",
                        strip=True,
                    )
                    for cell in cells
                ]

                if not values:
                    continue

                record: dict[str, Any] = {}

                for index, value in enumerate(values):
                    if index < len(headers):
                        key = headers[index] or f"column{index + 1}"
                    else:
                        key = f"column{index + 1}"

                    record[key] = value

                if record:
                    records.append(record)

        return records

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
            print(
                "AMS logout warning:",
                str(exc),
            )

        finally:
            try:
                await client.aclose()
            except Exception:
                pass

    # =========================================================
    # CHECK AUTHENTICATED PAGE
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

        important_ids = [
            "MainContent_lblStuname",
            "MainContent_lblID",
            "MainContent_lblRollNo",
            "MainContent_lblBranch",
            "MainContent_lblFathername",
            "MainContent_lblMothername",
        ]

        matches = 0

        for element_id in important_ids:
            if soup.find(
                id=element_id
            ):
                matches += 1

        if matches >= 2:
            return True

        page_text = soup.get_text(
            " ",
            strip=True,
        ).lower()

        indicators = [
            "student",
            "father",
            "mother",
            "branch",
            "semester",
            "academic",
        ]

        indicator_count = sum(
            1
            for item in indicators
            if item in page_text
        )

        return indicator_count >= 3