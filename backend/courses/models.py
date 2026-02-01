from django.db import models
from users.models import User
from accounts.managers import AccountScopedManager


class Course(models.Model):
    """Course model, scoped to an account"""

    account = models.ForeignKey(
        'accounts.Account',
        on_delete=models.CASCADE,
        related_name='courses',
        db_index=True,
    )
    code = models.CharField(max_length=20, db_index=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    ai_enabled = models.BooleanField(default=False)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    objects = AccountScopedManager()
    unscoped = models.Manager()

    class Meta:
        db_table = 'courses'
        verbose_name = 'Course'
        verbose_name_plural = 'Courses'
        ordering = ['-created_at']
        unique_together = [['code', 'account']]
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.code} - {self.name}"
    
    def get_instructors(self):
        """Get all instructors for this course"""
        return User.objects.filter(
            memberships__course=self,
            memberships__role='instructor',
            memberships__status='active'
        )
    
    def get_students(self):
        """Get all students for this course"""
        return User.objects.filter(
            memberships__course=self,
            memberships__role='student',
            memberships__status='active'
        )
    
    def get_active_student_count(self):
        """Get count of active students"""
        return self.memberships.filter(role='student', status='active').count()
    
    def get_active_instructor_count(self):
        """Get count of active instructors"""
        return self.memberships.filter(role='instructor', status='active').count()


class CourseModule(models.Model):
    """A time-bounded module within a course (e.g. 'Time Value of Money - Weeks 1-3')"""

    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='modules',
        db_index=True,
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    order = models.IntegerField(default=0)
    start_date = models.DateField()
    end_date = models.DateField()
    is_locked = models.BooleanField(default=False, db_index=True)
    zoom_link = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'course_modules'
        verbose_name = 'Course Module'
        verbose_name_plural = 'Course Modules'
        ordering = ['start_date', 'order']
        indexes = [
            models.Index(fields=['course']),
            models.Index(fields=['start_date']),
            models.Index(fields=['order']),
        ]

    def __str__(self):
        return f"{self.course.code} - {self.title}"

    @property
    def status(self):
        from django.utils import timezone
        today = timezone.now().date()
        if today < self.start_date:
            return 'upcoming'
        elif today > self.end_date:
            return 'completed'
        return 'active'

    @property
    def is_active(self):
        return self.status == 'active'


class Announcement(models.Model):
    """Instructor announcement broadcast to course members"""

    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='announcements',
        db_index=True,
    )
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='announcements',
    )
    title = models.CharField(max_length=200)
    body = models.TextField()
    is_published = models.BooleanField(default=True, db_index=True)
    pinned = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'announcements'
        ordering = ['-pinned', '-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"{self.course.code} - {self.title}"


class CourseMembership(models.Model):
    """Course membership linking users to courses with roles"""
    
    ROLE_CHOICES = [
        ('student', 'Student'),
        ('instructor', 'Instructor'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('dropped', 'Dropped'),
        ('completed', 'Completed'),
    ]
    
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='memberships',
        db_index=True
    )
    course = models.ForeignKey(
        Course, 
        on_delete=models.CASCADE, 
        related_name='memberships',
        db_index=True
    )
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='student',
        db_index=True
    )
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='active',
        db_index=True
    )
    enrolled_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'course_memberships'
        verbose_name = 'Course Membership'
        verbose_name_plural = 'Course Memberships'
        unique_together = [['user', 'course']]
        ordering = ['-enrolled_at']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['course']),
            models.Index(fields=['role']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.role} in {self.course.code}"
    
    @property
    def is_instructor(self):
        return self.role == 'instructor'
    
    @property
    def is_student(self):
        return self.role == 'student'
