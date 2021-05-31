FROM node:14
LABEL maintainer="Abhay Patil <abhaypatil87@gmail.com>"

RUN apt-get update && apt-get install -y gcc

WORKDIR /app
COPY . /app

RUN npm install --save

EXPOSE 4000
CMD ["npm", "run", "start"]