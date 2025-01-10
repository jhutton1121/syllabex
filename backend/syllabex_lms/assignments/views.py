from django.db.models import F
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import get_object_or_404, render
from django.urls import reverse

from .models import Quiz, MultipleChoiceOption

def detail(request, quiz_id):
    return HttpResponse("You're looking at Quiz %s" % quiz_id)

def results(request, quiz_id, question_id):
    response = 'You are looking at the result of question %s.'
    return HttpResponse(response % question_id)

def answer_question(request, quiz_id, question_id):
    return HttpResponse('You are answering question $s' % question_id)

def homepage(request):
    latest_quiz = Quiz.objects.order_by('-created_at').first()  # Get the most recent quiz
    return render(request, 'homepage.html', {'latest_quiz': latest_quiz})

def quiz(request, quiz_id):
    quiz = get_object_or_404(Quiz, id=quiz_id)
    questions = quiz.question_set.all().order_by('created_date')
    current_question = questions.first()  # Show the first question for simplicity
    feedback = None
    is_correct = None

    if request.method == "POST":
        selected_option_id = request.POST.get('option')
        if selected_option_id:  
            selected_option = MultipleChoiceOption.objects.get(id=selected_option_id)
            is_correct = selected_option.is_correct
            feedback = "Correct!" if is_correct else "Sorry, Incorrect!"

    context = {
        'quiz': quiz,
        'current_question': current_question,
        'feedback': feedback,
        'is_correct': is_correct,
    }
    return render(request, 'quiz.html', context)
