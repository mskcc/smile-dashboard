FROM node:16.10.0
ADD ./ /server
WORKDIR /server
ENV NODE_TLS_REJECT_UNAUTHORIZED=0
ENV LD_LIBRARY_PATH=./graphql-server/opt/oracle/instantclient_21_12
RUN yarn
RUN yarn build:backend
CMD ["yarn", "start:backend"]
