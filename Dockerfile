FROM openjdk:17

# Install Python
RUN apt-get update && apt-get install -y python3 python3-pip

# Set working directory
WORKDIR /app

# Copy all files
COPY . .

# Install Python dependencies
WORKDIR /app/backend
RUN pip3 install -r requirements.txt

# Compile Java files
RUN mkdir -p java_src/bin && javac -d java_src/bin java_src/*.java

# Expose port
EXPOSE 10000

# Start Flask app
CMD ["python3", "app.py"]
