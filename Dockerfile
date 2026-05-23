# Use base image from Docker Hub
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# copy the package.json and package-lock.json files
COPY package*.json ./

# Install the dependancies
RUN npm install  

#Copy the rest of the application files
COPY . .

#Expose the port your app will run
EXPOSE 5173

#Start the application
CMD [ "npm", "run","dev" ]