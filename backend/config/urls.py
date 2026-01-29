"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView
from accounts.jwt import AccountTokenObtainPairView


def api_root(request):
    """API root endpoint with welcome message and available endpoints"""
    return JsonResponse({
        'message': 'Welcome to Syllabex API',
        'version': '1.0.0',
        'status': 'active',
        'endpoints': {
            'admin': '/admin/',
            'api': {
                'authentication': {
                    'login': '/api/auth/login/',
                    'refresh': '/api/auth/refresh/',
                },
                'note': 'Additional API endpoints will be available soon'
            }
        },
        'documentation': 'See backend/README.md for setup and usage instructions'
    })


urlpatterns = [
    path('', api_root, name='api_root'),  # Root endpoint
    path('admin/', admin.site.urls),
    # JWT Authentication endpoints
    path('api/auth/login/', AccountTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # App URLs
    path('api/users/', include('users.urls')),
    path('api/courses/', include('courses.urls')),
    path('api/assignments/', include('assignments.urls')),
    path('api/gradebook/', include('gradebook.urls')),
    path('api/ai/', include('ai_assistant.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
