FROM python:3.10

WORKDIR /app
COPY . /app

RUN pip install --upgrade pip
RUN pip install flask
RUN pip install -r requirements.txt

EXPOSE 8000
CMD ["python", "app.py"]