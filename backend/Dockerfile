# Syllabex/backend/Dockerfile

# 1. Choose a base image (Python 3.13 example)
FROM python:3.13-slim

# 2. Create and set the working directory
WORKDIR /app

# 3. Set environment variables to prevent .pyc and enable stdout/stderr
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# 4. Copy the requirements file and install dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copy the actual backend Django code into the container
COPY . /app/

# 6. Expose the port Django will run on
EXPOSE 8000

# 7. Default command: run the development server
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
