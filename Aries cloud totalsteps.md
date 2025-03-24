Certainly! Setting up the VON Network, Aries Mediator Agent, Aries Cloud Issuer Agent, and Aries Cloud Verifier Agent using Docker Compose involves several steps. Below are the detailed setup steps for each component.

### Prerequisites
- Docker and Docker Compose installed on your machine.
- Basic knowledge of Docker and Docker Compose.

### Step 1: Set Up VON Network
1. **Create a directory for the VON Network setup**:
   ```sh
   mkdir von-network
   cd von-network
   ```

2. **Create a `docker-compose.yml` file for the VON Network**:
   ```yaml
   version: '3.5'
   services:
     von-network:
       image: bcgovimages/von-network:latest
       container_name: von-network
       ports:
         - "9000:9000"
         - "9701-9708:9701-9708"
       networks:
         - aries-network
       command: start --logs --ip 0.0.0.0 --nodes 4 --seed my_network_seed --genesis

   networks:
     aries-network:
       driver: bridge
   ```

3. **Run the VON Network container**:
   ```sh
   docker-compose up -d
   ```

### Step 2: Set Up Aries Mediator
1. **Create a directory for the mediator setup**:
   ```sh
   mkdir ../aries-mediator
   cd ../aries-mediator
   ```

2. **Create a `docker-compose.yml` file for the mediator**:
   ```yaml
   version: '3.5'
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

### Step 3: Set Up Aries Cloud Issuer Agent
1. **Create a directory for the issuer agent setup**:
   ```sh
   mkdir ../aries-cloud-issuer
   cd ../aries-cloud-issuer
   ```

2. **Create a `docker-compose.yml` file for the issuer agent**:
   ```yaml
   version: '3.5'
   services:
     issuer-agent:
       image: hyperledger/aries-cloudagent:py-alpine-0.7.3
       container_name: aries-cloud-issuer
       environment:
         - LOG_LEVEL=debug
         - MEDIATOR_URL=http://aries-mediator:3001
         - WEBHOOKS_URL=http://aries-cloud-issuer:3002/webhooks
         - INBOUND_TRANSPORT=http
         - ADMIN_API_KEY=admin_api_key
         - AGENT_ADMIN_PORT=3003
         - LEDGER_URL=http://von-network:9000
         - WALLET_SEED=my_wallet_seed
         - WALLET_KEY=my_wallet_key
         - WALLET_NAME=my_wallet
         - AUTO_ACCEPT_INVITES=True
         - AUTO_ACCEPT_REQUESTS=True
       ports:
         - "3002:3002"
         - "3003:3003"
       networks:
         - aries-network

   networks:
     aries-network:
       external: true
   ```

3. **Run the issuer agent container**:
   ```sh
   docker-compose up -d
   ```

### Step 4: Set Up Aries Cloud Verifier Agent
1. **Create a directory for the verifier agent setup**:
   ```sh
   mkdir ../aries-cloud-verifier
   cd ../aries-cloud-verifier
   ```

2. **Create a `docker-compose.yml` file for the verifier agent**:
   ```yaml
   version: '3.5'
   services:
     verifier-agent:
       image: hyperledger/aries-cloudagent:py-alpine-0.7.3
       container_name: aries-cloud-verifier
       environment:
         - LOG_LEVEL=debug
         - MEDIATOR_URL=http://aries-mediator:3001
         - WEBHOOKS_URL=http://aries-cloud-verifier:3004/webhooks
         - INBOUND_TRANSPORT=http
         - ADMIN_API_KEY=admin_api_key
         - AGENT_ADMIN_PORT=3005
         - LEDGER_URL=http://von-network:9000
         - WALLET_SEED=my_wallet_seed
         - WALLET_KEY=my_wallet_key
         - WALLET_NAME=my_wallet
         - AUTO_ACCEPT_INVITES=True
         - AUTO_ACCEPT_REQUESTS=True
       ports:
         - "3004:3004"
         - "3005:3005"
       networks:
         - aries-network

   networks:
     aries-network:
       external: true
   ```

3. **Run the verifier agent container**:
   ```sh
   docker-compose up -d
   ```

### Verify the Setup
To ensure all services are running correctly, you can check the logs of each service.

1. **Check VON Network logs**:
   ```sh
   docker logs von-network
   ```

2. **Check mediator logs**:
   ```sh
   docker logs aries-mediator
   ```

3. **Check issuer agent logs**:
   ```sh
   docker logs aries-cloud-issuer
   ```

4. **Check verifier agent logs**:
   ```sh
   docker logs aries-cloud-verifier
   ```

### Access Admin Interfaces
To confirm that the agents are correctly connected to the mediator and VON Network, access their admin interfaces:

1. **Mediator Admin Interface**:
   ```sh
   curl -H "x-api-key: admin_api_key" http://localhost:3001/status
   ```

2. **Issuer Agent Admin Interface**:
   ```sh
   curl -H "x-api-key: admin_api_key" http://localhost:3003/status
   ```

3. **Verifier Agent Admin Interface**:
   ```sh
   curl -H "x-api-key: admin_api_key" http://localhost:3005/status
   ```

This setup provides a complete environment with the VON Network, an Aries Mediator, an Aries Cloud Issuer Agent, and an Aries Cloud Verifier Agent. Adjust the `docker-compose.yml` files and environment variables as needed for your specific requirements. For detailed operations like schema creation, credential definition, issuing, and verification, refer to the [Aries Cloud Agent API documentation](https://github.com/hyperledger/aries-cloudagent-python/blob/main/AdminAPI.md).
