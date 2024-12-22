from django.urls import path

from . import views

urlpatterns = [
    path("", views.homepage, name="homepage"),
    path('quiz/<int:quiz_id>/', views.quiz, name='quiz'),
    path("<int:quiz_id>/", views.detail, name="detail"),
    path("<int:quiz_id>:/<int:question_id>", views.results, name = "results"),
    path("<int:quiz_id>:/<int:question_id>/answer_question", views.answer_question, name = "answer_question", )
]