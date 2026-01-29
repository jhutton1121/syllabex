from django.db import models

from .models import get_current_account


class AccountScopedManager(models.Manager):
    def get_queryset(self):
        qs = super().get_queryset()
        account = get_current_account()
        if account is not None:
            qs = qs.filter(account=account)
        return qs
