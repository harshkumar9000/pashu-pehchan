"""
server/app/routes/notifications.py
In-app user notifications for enquiry updates and livestock alerts.
"""

from typing import List
from fastapi import APIRouter, HTTPException, Depends
from server.app.schemas.schemas import NotificationResponse
from server.app.services.auth.auth_service import get_current_user
from server.app.database.database import (
    get_notifications_for_user,
    mark_notification_read
)

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

@router.get("", response_model=List[NotificationResponse])
def list_notifications(current_user: dict = Depends(get_current_user)):
    """Retrieve notifications for active user."""
    notifs = get_notifications_for_user(current_user["sub"])
    return [NotificationResponse(**n) for n in notifs]

@router.put("/{notification_id}/read")
def mark_read(
    notification_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Mark a notification as read."""
    success = mark_notification_read(notification_id, current_user["sub"])
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found.")
    return {"status": "success", "message": "Notification marked as read."}
