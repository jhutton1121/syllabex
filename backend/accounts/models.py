import threading

from django.conf import settings
from django.db import models

_thread_local = threading.local()


def get_current_account():
    return getattr(_thread_local, 'account', None)


def set_current_account(account):
    _thread_local.account = account


class Account(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, db_index=True)
    domain = models.CharField(max_length=255, blank=True, null=True, unique=True)
    parent = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='sub_accounts',
    )
    is_active = models.BooleanField(default=True)
    settings = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'accounts'

    def __str__(self):
        return self.name

    @property
    def root_account(self):
        account = self
        while account.parent is not None:
            account = account.parent
        return account

    @property
    def is_root(self):
        return self.parent is None

    def get_descendants(self, include_self=True):
        result = [self] if include_self else []
        for child in self.sub_accounts.filter(is_active=True):
            result.extend(child.get_descendants(include_self=True))
        return result

    def get_account_ids(self, include_self=True):
        return [a.id for a in self.get_descendants(include_self)]


class AccountMembership(models.Model):
    ROLE_CHOICES = [
        ('account_admin', 'Account Admin'),
        ('sub_account_admin', 'Sub-Account Admin'),
        ('member', 'Member'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='account_memberships',
    )
    account = models.ForeignKey(
        Account,
        on_delete=models.CASCADE,
        related_name='memberships',
    )
    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default='member')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'account_memberships'
        unique_together = [['user', 'account']]

    def __str__(self):
        return f"{self.user.email} - {self.role} in {self.account.name}"
