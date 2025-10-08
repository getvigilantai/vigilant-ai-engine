# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Install any needed packages specified in requirements.txt
# We are installing directly since we only have a few
RUN pip install --no-cache-dir sqlalchemy psycopg2-binary

# Copy the current directory contents into the container at /usr/src/app
COPY main.py .

# Make port 80 available to the world outside this container (if needed, good practice)
# EXPOSE 80

# Define environment variable
ENV NAME World

# Run main.py when the container launches
CMD ["python", "-u", "main.py"]