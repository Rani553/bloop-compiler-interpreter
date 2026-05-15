FROM eclipse-temurin:17-jdk

# Install Python + venv
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv

# Set working directory
WORKDIR /app

# Copy project files
COPY . .

# Move to backend
WORKDIR /app/backend

# Create virtual environment
RUN python3 -m venv venv

# Activate venv and install requirements
RUN . venv/bin/activate && pip install -r requirements.txt

# Compile Java files
RUN mkdir -p java_src/bin && javac -d java_src/bin java_src/*.java

# Expose Render port
EXPOSE 10000

# Start Flask app using venv python
CMD ["venv/bin/python", "app.py"]
