# aries-cloud_agent

steps to deploy indy von network 

git clone https://github.com/bcgov/von-network.git

cd von-network 

./manage build 

./manage start 

steps to sretup aries cloud agent 

docker-compose up -d 


Setting up an Aries Mediator and Aries Cloud Agent using Docker Compose involves several steps. This guide will walk you through the process, including setting up Docker Compose files for each component.

### Prerequisites
- Docker and Docker Compose installed on your machine.
- Basic knowledge of Docker and Docker Compose.

### Step 1: Create a Docker Network
First, create a Docker network that both the Aries Mediator and Aries Cloud Agent will use to communicate.

```sh
docker network create aries-network
```

### Step 2: Set Up Aries Mediator
1. **Create a directory for the mediator setup**:
   ```sh
   mkdir aries-mediator
   cd aries-mediator
   ```

2. **Create a `docker-compose.yml` file for the mediator**:
   ```yaml
   version: '3'
   services:
     mediator:
       image: bcgovimages/indy-catalyst:latest
       container_name: aries-mediator
       environment:
         - LOG_LEVEL=debug
         - MEDIATOR_PORT=3001
         - WEBHOOKS_URL=http://aries-mediator:3001/webhooks
         - ADMIN_API_KEY=admin_api_key
       ports:
         - "3001:3001"
       networks:
         - aries-network

   networks:
     aries-network:
       external: true
   ```

3. **Run the mediator container**:
   ```sh
   docker-compose up -d
   ```

### Step 3: Set Up Aries Cloud Agent
1. **Create a directory for the cloud agent setup**:
   ```sh
   mkdir ../aries-cloud-agent
   cd ../aries-cloud-agent
   ```

2. **Create a `docker-compose.yml` file for the cloud agent**:
   ```yaml
   version: '3'
   services:
     agent:
       image: hyperledger/aries-cloudagent:py-alpine-0.7.3
       container_name: aries-cloud-agent
       environment:
         - LOG_LEVEL=debug
         - MEDIATOR_URL=http://aries-mediator:3001
         - WEBHOOKS_URL=http://aries-cloud-agent:3002/webhooks
         - INBOUND_TRANSPORT=http
         - ADMIN_API_KEY=admin_api_key
         - AGENT_ADMIN_PORT=3003
       ports:
         - "3002:3002"
         - "3003:3003"
       networks:
         - aries-network

   networks:
     aries-network:
       external: true
   ```

3. **Run the cloud agent container**:
   ```sh
   docker-compose up -d
   ```

### Step 4: Verify the Setup
To ensure both services are running correctly, you can check the logs of each service.

1. **Check mediator logs**:
   ```sh
   docker logs aries-mediator
   ```

2. **Check cloud agent logs**:
   ```sh
   docker logs aries-cloud-agent
   ```

### Step 5: Connect Cloud Agent to Mediator
The cloud agent should automatically connect to the mediator if the environment variables are set correctly. To confirm, you can access the admin interfaces if necessary.

1. **Access Mediator Admin Interface** (replace `localhost` with your Docker host if necessary):
   ```sh
   curl -H "x-api-key: admin_api_key" http://localhost:3001/status
   ```

2. **Access Cloud Agent Admin Interface**:
   ```sh
   curl -H "x-api-key: admin_api_key" http://localhost:3003/status
   ```

### Additional Configuration
Depending on your use case, you might need to adjust the configurations and environment variables further. Refer to the official documentation of Aries Cloud Agent and Aries Mediator for more details on advanced configurations.

### Conclusion
This setup provides a basic environment to run Aries Mediator and Aries Cloud Agent using Docker Compose. Adjust the `docker-compose.yml` files and environment variables as needed for your specific requirements.
