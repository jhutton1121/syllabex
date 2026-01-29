from django.http import JsonResponse

from .models import Account, set_current_account


class AccountMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        account = None

        # Strategy 1: explicit header
        slug = request.headers.get('X-Account-Slug')
        if slug:
            account = Account.objects.filter(slug=slug, is_active=True).first()

        # Strategy 2: subdomain
        if not account:
            host = request.get_host().split(':')[0]
            parts = host.split('.')
            if len(parts) > 2:
                subdomain = parts[0]
                account = Account.objects.filter(
                    slug=subdomain, is_active=True
                ).first()

        # Strategy 3: fall back to authenticated user's account
        if not account and hasattr(request, 'user') and request.user.is_authenticated:
            account = getattr(request.user, 'account', None)

        request.account = account
        set_current_account(account)

        # Validate: authenticated user must belong to the resolved account
        if (
            hasattr(request, 'user')
            and request.user.is_authenticated
            and account is not None
            and getattr(request.user, 'account_id', None) != account.id
        ):
            set_current_account(None)
            return JsonResponse(
                {'error': 'Account mismatch. You do not belong to this account.'},
                status=403,
            )

        response = self.get_response(request)
        set_current_account(None)
        return response
