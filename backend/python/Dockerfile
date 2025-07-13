FROM python:3.10

WORKDIR /app
COPY . /app

RUN apt-get update && apt-get install -y libgl1
RUN pip install --upgrade pip
RUN pip install flask
RUN pip install -r requirements.txt

EXPOSE 8000
CMD ["python", "app.py"]