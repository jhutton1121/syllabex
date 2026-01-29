from django.contrib.auth.backends import ModelBackend

from .models import get_current_account


class AccountAwareBackend(ModelBackend):
    def authenticate(self, request, email=None, password=None, **kwargs):
        from users.models import User

        account = get_current_account()
        if account is None and request is not None:
            account = getattr(request, 'account', None)
        if account is None:
            return None

        try:
            user = User.objects.get(email=email, account=account)
        except User.DoesNotExist:
            return None

        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
