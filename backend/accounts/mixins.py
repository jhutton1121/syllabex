from django.db import models


class AccountScopedMixin(models.Model):
    account = models.ForeignKey(
        'accounts.Account',
        on_delete=models.CASCADE,
        related_name='%(class)ss',
        db_index=True,
    )

    class Meta:
        abstract = True
