#!/usr/bin/env python3
"""Upload an extension zip to extensions.gnome.org.

This is the same request as `gnome-extensions upload` in GNOME 51:
POST /api/v1/accounts/login/, then POST /api/v1/extensions.
A successful upload enters review. It is not published until a reviewer
accepts it. The integer `version` in metadata.json must be higher than
the last uploaded version.
"""

import json
import os
import sys
import uuid
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

API = "https://extensions.gnome.org/api/v1"
TOS = "https://extensions.gnome.org/upload/"


def _multipart(fields, file_field):
    boundary = f"----ego{uuid.uuid4().hex}"
    name, filename, content_type, data = file_field
    chunks = []
    for key, value in fields:
        chunks.append(
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="{key}"\r\n\r\n'
            f"{value}\r\n".encode()
        )
    chunks.append(
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="{name}"; filename="{filename}"\r\n'
        f"Content-Type: {content_type}\r\n\r\n".encode()
    )
    chunks.append(data)
    chunks.append(f"\r\n--{boundary}--\r\n".encode())
    return boundary, b"".join(chunks)


def _request(url, data, headers):
    request = Request(url, data=data, headers=headers, method="POST")
    try:
        with urlopen(request) as response:
            body = response.read()
            return response.status, body
    except HTTPError as error:
        return error.code, error.read()


def login(username, password):
    status, body = _request(
        f"{API}/accounts/login/",
        urlencode({"login": username, "password": password}).encode(),
        {"Content-Type": "application/x-www-form-urlencoded"},
    )
    payload = _json(body)
    token = ((payload or {}).get("token") or {}).get("token")
    if status != 200 or not token:
        detail = (payload or {}).get("detail") or body.decode("utf-8", "replace")
        raise SystemExit(f"extensions.gnome.org login failed ({status}): {detail}")
    return token


def upload(zip_path, token):
    data = Path(zip_path).read_bytes()
    boundary, body = _multipart(
        (
            ("shell_license_compliant", "true"),
            ("tos_compliant", "true"),
        ),
        ("source", Path(zip_path).name, "application/zip", data),
    )
    status, response = _request(
        f"{API}/extensions",
        body,
        {
            "Authorization": f"Token {token}",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
    )
    if status != 201:
        payload = _json(response)
        detail = (payload or {}).get("detail") or response.decode("utf-8", "replace")
        raise SystemExit(f"upload failed ({status}): {detail}")
    return status


def _json(body):
    try:
        return json.loads(body)
    except json.JSONDecodeError:
        return None


def main():
    if len(sys.argv) != 2:
        raise SystemExit("usage: ego_upload.py ARCHIVE.zip")
    username = os.environ.get("EGO_USERNAME", "")
    password = os.environ.get("EGO_PASSWORD", "")
    if not username or not password:
        raise SystemExit(
            "Set EGO_USERNAME and EGO_PASSWORD from the extensions.gnome.org account. "
            f"Uploading accepts the terms at {TOS}."
        )
    token = login(username, password)
    upload(sys.argv[1], token)
    print(f"uploaded {sys.argv[1]} for review")


if __name__ == "__main__":
    main()
