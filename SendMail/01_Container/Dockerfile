#Choose Base Image : alpine
FROM node:8.10.0-alpine

# Create app directory
WORKDIR ~/app/

# Copy dependecies json 
COPY app/package*.json ./

# Install dependencies which are not mentioned in the json file
RUN apk --no-cache add --virtual native-deps \
  g++ gcc libgcc libstdc++ linux-headers make python && \
  npm install --quiet node-gyp -g &&\
  npm install --quiet && \
  apk del native-deps

# Install json dependencies
RUN npm install --production

# Bundle app source
COPY app/ .

# Start application
CMD [ "node", "sendmail.js" ]

