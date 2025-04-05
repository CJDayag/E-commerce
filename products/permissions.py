from rest_framework import permissions


class IsAdminUserOrReadOnly(permissions.BasePermission):
    """
    Allow read-only access for all users (including unauthenticated users),
    but only allow to write access to admin users.
    """

    def has_permission(self, request, view):
        # Allow GET, HEAD, OPTIONS requests for everyone
        if request.method in permissions.SAFE_METHODS:
            return True

        # For write operations, require the user to be authenticated and an admin
        return request.user and request.user.is_authenticated and request.user.is_staff
