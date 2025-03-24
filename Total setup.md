Certainly! Below are the separate Docker Compose files for setting up an Aries Mediator, Aries Cloud Issuer Agent, and Aries Cloud Verifier Agent.

### Aries Mediator Docker Compose

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

### Aries Cloud Issuer Agent Docker Compose

1. **Create a directory for the issuer agent setup**:
   ```sh
   mkdir ../aries-cloud-issuer
   cd ../aries-cloud-issuer
   ```

2. **Create a `docker-compose.yml` file for the issuer agent**:
   ```yaml
   version: '3'
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
         - LEDGER_URL=http://test.bcovrin.vonx.io
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

### Aries Cloud Verifier Agent Docker Compose

1. **Create a directory for the verifier agent setup**:
   ```sh
   mkdir ../aries-cloud-verifier
   cd ../aries-cloud-verifier
   ```

2. **Create a `docker-compose.yml` file for the verifier agent**:
   ```yaml
   version: '3'
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
         - LEDGER_URL=http://test.bcovrin.vonx.io
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

1. **Check mediator logs**:
   ```sh
   docker logs aries-mediator
   ```

2. **Check issuer agent logs**:
   ```sh
   docker logs aries-cloud-issuer
   ```

3. **Check verifier agent logs**:
   ```sh
   docker logs aries-cloud-verifier
   ```

### Access Admin Interfaces
To confirm that the agents are correctly connected to the mediator, access their admin interfaces:

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

This setup will give you a working environment with an Aries Mediator, an Aries Cloud Issuer Agent, and an Aries Cloud Verifier Agent. Adjust the `docker-compose.yml` files and environment variables as needed for your specific requirements. For detailed operations like schema creation, credential definition, issuing, and verification, refer to the [Aries Cloud Agent API documentation](https://github.com/hyperledger/aries-cloudagent-python/blob/main/AdminAPI.md).
