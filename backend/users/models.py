from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin


class CustomUserManager(BaseUserManager):
    """Custom user manager where email is the unique identifier per account"""

    def create_user(self, email, password=None, account=None, **extra_fields):
        """Create and save a regular user with the given email, account, and password"""
        if not email:
            raise ValueError('The Email field must be set')
        if account is None:
            raise ValueError('The Account field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, account=account, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """Create and save a superuser with the given email and password"""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        # Superusers get assigned to the default root account
        from accounts.models import Account
        account = extra_fields.pop('account', None)
        if account is None:
            account, _ = Account.objects.get_or_create(
                slug='default',
                defaults={'name': 'Default Account'},
            )

        return self.create_user(email, password, account=account, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Custom user model using email as username, scoped to an account"""

    account = models.ForeignKey(
        'accounts.Account',
        on_delete=models.CASCADE,
        related_name='users',
        db_index=True,
    )
    email = models.EmailField(db_index=True)
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    objects = CustomUserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        unique_together = [['email', 'account']]

    def __str__(self):
        return self.email
    
    def get_full_name(self):
        """Return the user's full name"""
        full_name = f"{self.first_name} {self.last_name}".strip()
        return full_name or self.email
    
    def is_admin(self):
        """Check if user has admin profile"""
        return hasattr(self, 'admin_profile')

    def is_account_admin(self):
        """Check if user is an account admin"""
        return self.account_memberships.filter(
            account=self.account,
            role='account_admin',
            is_active=True,
        ).exists()

    def get_course_role(self, course):
        """Get user's role in a specific course"""
        from courses.models import CourseMembership
        membership = CourseMembership.objects.filter(user=self, course=course).first()
        return membership.role if membership else None


class AdminProfile(models.Model):
    """Admin profile linked to User for system administrators"""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='admin_profile')
    employee_id = models.CharField(max_length=50, unique=True, db_index=True)
    permissions_level = models.IntegerField(default=1)
    
    class Meta:
        db_table = 'admin_profiles'
        verbose_name = 'Admin Profile'
        verbose_name_plural = 'Admin Profiles'
    
    def __str__(self):
        return f"Admin: {self.user.email} ({self.employee_id})"
