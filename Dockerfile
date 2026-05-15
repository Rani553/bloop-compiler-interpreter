FROM eclipse-temurin:17-jdk

# Install Python
RUN apt-get update && apt-get install -y python3 python3-pip

# Set working directory
WORKDIR /app

# Copy project files
COPY . .

# Move into backend
WORKDIR /app/backend

# Install Python dependencies
RUN pip3 install -r requirements.txt

# Compile Java source files
RUN mkdir -p java_src/bin && javac -d java_src/bin java_src/*.java

# Render uses port 10000
EXPOSE 10000

# Start Flask server
CMD ["python3", "app.py"]
