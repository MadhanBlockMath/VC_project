Sure! Below are the detailed steps to set up an Aries mobile agent and connect it with an Aries Cloud Issuer Agent. The process involves setting up the mobile agent application and configuring it to communicate with the cloud agent.

### Prerequisites
- A mobile device (iOS or Android) to run the Aries mobile agent app.
- Docker and Docker Compose installed on your machine for the cloud agent setup.
- Basic knowledge of Docker, Docker Compose, and mobile app installation.

### Step 1: Set Up Aries Cloud Issuer Agent
1. **Create a directory for the issuer agent setup**:
   ```sh
   mkdir aries-cloud-issuer
   cd aries-cloud-issuer
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

### Step 2: Set Up Aries Mediator (if not already done)
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

### Step 3: Install Aries Mobile Agent App
Download and install an Aries mobile agent app on your mobile device. Commonly used apps include:
- **Trinsic Wallet**
- **Connect.Me by Evernym**
- **Streetcred ID**

You can find these apps in the Apple App Store or Google Play Store.

### Step 4: Set Up and Configure the Mobile Agent
1. **Open the mobile agent app** and follow the setup instructions to create a new wallet if required.

2. **Obtain a Connection Invitation** from the Aries Cloud Issuer Agent. You can do this by accessing the cloud agent's admin API. 

   Example API call to create a connection invitation:
   ```sh
   curl -X POST -H "x-api-key: admin_api_key" -H "Content-Type: application/json" -d '{}' http://localhost:3003/connections/create-invitation
   ```

   This will return a JSON response containing an invitation URL and a QR code.

3. **Scan the QR Code** or manually enter the invitation URL into the mobile agent app to establish a connection between the mobile agent and the cloud agent.

### Step 5: Issue a Credential from the Cloud Agent to the Mobile Agent
1. **Create a Schema** (if not already created):
   ```sh
   curl -X POST -H "x-api-key: admin_api_key" -H "Content-Type: application/json" -d '{
     "schema_name": "degree schema",
     "schema_version": "1.0",
     "attributes": ["name", "degree", "date"]
   }' http://localhost:3003/schemas
   ```

2. **Create a Credential Definition**:
   ```sh
   curl -X POST -H "x-api-key: admin_api_key" -H "Content-Type: application/json" -d '{
     "schema_id": "your_schema_id",
     "tag": "default"
   }' http://localhost:3003/credential-definitions
   ```

3. **Issue a Credential** to the mobile agent:
   ```sh
   curl -X POST -H "x-api-key: admin_api_key" -H "Content-Type: application/json" -d '{
     "connection_id": "your_connection_id",
     "credential_definition_id": "your_cred_def_id",
     "credential_proposal": {
       "attributes": [
         {"name": "name", "value": "Alice"},
         {"name": "degree", "value": "BSc Computer Science"},
         {"name": "date", "value": "2024-05-17"}
       ]
     }
   }' http://localhost:3003/issue-credential/send
   ```

### Step 6: Verify the Credential on the Mobile Agent
After issuing the credential, the mobile agent will receive a notification. Follow the prompts in the mobile agent app to accept and store the credential in your wallet.

### Conclusion
By following these steps, you will have set up an Aries Cloud Issuer Agent and connected it to an Aries Mobile Agent, enabling credential issuance and storage on the mobile device. Adjust the `docker-compose.yml` files and environment variables as needed for your specific requirements. For detailed operations like schema creation, credential definition, issuing, and verification, refer to the [Aries Cloud Agent API documentation](https://github.com/hyperledger/aries-cloudagent-python/blob/main/AdminAPI.md).
