const { sendConnectionEmail } = require("./mail");
const path = require("path");
const express = require("express");
var axios = require("axios");
var randomstring = require("randomstring");
var app = express();
const config = require("./config");
const bodyParser = require("body-parser");
const CredentialTypeAttributes = require("./credentialType.json");
let connectionOBj = new Object();
const fs = require("fs");
const cors = require('cors');
app.use(cors());
app.use(express.json());
app.listen(3013, async () => {
  console.log("Listening on port 3013...");
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// app.use(express.urlencoded({ extended: true }));
app.get("/configure", async (req, res) => {
  try {
    // console.log("Credential Type: ", req.body.CredentialType);
    // const CredentialType = req.body.CredentialType;
    let response = {};

    let connection = await createConnection();
    let schemaA;
    let schemaB;
    
    // if (CredentialType === "GTIN") {
      schemaA = await createGtinCredentialDefinitionSchema();
    // } else {
      schemaB = await createCredentialDefinitionSchema();
    // }

    console.log(schemaA,schemaB);
    console.log("Connection: ", connection);

    if (connection && schemaA && schemaB) {
      console.log(JSON.stringify(connectionOBj));
      response = { status: 200, data: connectionOBj };
      await writeFile("config.json", JSON.stringify(connectionOBj));
      res.status(200).send(response);
    } else {
      response = { status: 500, data: "Internal server error" };
      res.status(500).send(response);
    }
  } catch (e) {
    let response = { status: 500, data: "Configuration failed" };
    res.status(500).send(response);
  }
});


app.post("/issue-credential", async (req, res) => {
  try {
    console.log("Request body: ", req.body);
    let CredentialType = req.body.CredentialType;
    var attributes = "";
    let response = {};
    console.log(
      connectionOBj["verifier_connection_id"],
      connectionOBj["issuer_connection_id"]
    );

    if (CredentialType == "GCP") {
      attributes = [
        {
          name: "BarcodeSeries",
          value: req.body.BarcodeSeries,
        },
        {
          name: "Gcp",
          value: req.body.Gcp,
        },
        {
          name: "Manufacturer",
          value: req.body.Manufacturer,
        },
        {
          name: "RegistrationDate",
          value: req.body.RegistrationDate,
        },
        {
          name: "ExpiryDate",
          value: req.body.ExpiryDate,
        },
      ];
    } else if (CredentialType == "national") {
      attributes = [
        {
          name: "id",
          value: req.body.id,
        },
        {
          name: "name",
          value: req.body.name,
        },
        {
          name: "b_country",
          value: req.body.b_country,
        },
        {
          name: "d_country",
          value: req.body.d_country,
        },
        {
          name: "gender",
          value: req.body.gender,
        },
        {
          name: "PNR",
          value: req.body.PNR,
        },
        {
          name: "dateOfTravel",
          value: req.body.dateOfTravel,
        },
      ];
    }

    let credential = await issueCredentials(
      connectionOBj["verifier_connection_id"],
      connectionOBj["cred_def_id_" + `${CredentialType}`],
      attributes
    );
    console.log("credentials ---- ", credential);
    const verifiableCredential = {
      "@context": [
        "https://www.w3.org/2018/credentials/v1"
      ],
      "type": ["VerifiableCredential"],
      "issuer": "did:example:Utwqp5cpEATQpGZL5WSQZJ",
      "issuanceDate": credential.created_at,
      "credentialSubject": {
        "id": credential.connection_id, // Replace with real subject DID
        "BarcodeSeries": credential.credential_proposal_dict.credential_proposal.attributes.find(attr => attr.name === "BarcodeSeries").value,
        "Gcp": credential.credential_proposal_dict.credential_proposal.attributes.find(attr => attr.name === "Gcp").value,
        "Manufacturer": credential.credential_proposal_dict.credential_proposal.attributes.find(attr => attr.name === "Manufacturer").value,
        "RegistrationDate": credential.credential_proposal_dict.credential_proposal.attributes.find(attr => attr.name === "RegistrationDate").value,
        "ExpiryDate": credential.credential_proposal_dict.credential_proposal.attributes.find(attr => attr.name === "ExpiryDate").value
      },
      "credentialStatus": {
        "id": credential.credential_exchange_id, // Credential status URL, replace with real one
        "type": "CredentialStatusList2021"
      },
      "proof": {
        "type": "Ed25519Signature2020",
        "created": new Date().toISOString(),
        "proofPurpose": "assertionMethod",
        "verificationMethod": credential.credential_definition_id, // Replace with issuer's verification method
        // "jws": credential.credential_offer_dict.${"offers~attach"}.data.base64 // Replace with actual JWS signature
    }
};
    res.status(200).json({
      message: "Credential generation success",
      credential:
         verifiableCredential,
    });
  } catch (e) {
    res.status(500).json({ message: "credential generation failed", e });
  }
});
app.post("/issue-gtin-credential", async (req, res) => {
  try {
    console.log("Request body: ", req.body);
    let attributes = [
      {
        name: "GTIN",
        value: req.body.GTIN,
      },
      {
        name: "GCP",
        value: req.body.GCP,
      },
      {
        name: "BrandName",
        value: req.body.BrandName,
      },
      {
        name: "ProductDescription",
        value: req.body.ProductDescription,
      },
      {
        name: "ProductImageURL",
        value: req.body.ProductImageURL,
      },
      {
        name: "GlobalProductCategory",
        value: req.body.GlobalProductCategory,
      },
      {
        name: "NetContent",
        value: req.body.NetContent,
      },
      {
        name: "CountryOfSale",
        value: req.body.CountryOfSale,
      },
      {
        name: "ExpiryDate",
        value: req.body.ExpiryDate,
      },
    ];

    let credential = await issueCredentials(
      connectionOBj["verifier_connection_id"],
      connectionOBj["cred_def_id_GTIN"],
      attributes
    );
    // let credential = issueCredentialsV2(
    //   connectionOBj["verifier_connection_id"],
    //   connectionOBj["cred_def_id_GTIN"],
    //   attributes,
    //   connectionOBj["schema_id_GTIN"],
    //   connectionOBj["schema_name_GTIN"] ,
    // )
    console.log("GTIN Credential Issued: ", credential);
  const verifiableCredential = {
      "@context": [
        "https://www.w3.org/2018/credentials/v1"
      ],
      "type": ["VerifiableCredential"],
      "issuer": "did:example:Utwqp5cpEATQpGZL5WSQZJ",
      "issuanceDate": credential.created_at,
      "credentialSubject": {
        "id": credential.connection_id, // Replace with real subject DID
        "GTIN": credential.credential_proposal_dict.credential_proposal.attributes.find(attr => attr.name === "GTIN").value,
        "GCP": credential.credential_proposal_dict.credential_proposal.attributes.find(attr => attr.name === "GCP").value,
        "BrandName": credential.credential_proposal_dict.credential_proposal.attributes.find(attr => attr.name === "BrandName").value,
        "ProductDescription": credential.credential_proposal_dict.credential_proposal.attributes.find(attr => attr.name === "ProductDescription").value,
        "ProductImageURL": credential.credential_proposal_dict.credential_proposal.attributes.find(attr => attr.name === "ProductImageURL").value,
        "GlobalProductCategory": credential.credential_proposal_dict.credential_proposal.attributes.find(attr => attr.name === "GlobalProductCategory").value,
        "NetContent": credential.credential_proposal_dict.credential_proposal.attributes.find(attr => attr.name === "NetContent").value,
        "CountryOfSale": credential.credential_proposal_dict.credential_proposal.attributes.find(attr => attr.name === "CountryOfSale").value,
        "ExpiryDate": credential.credential_proposal_dict.credential_proposal.attributes.find(attr => attr.name === "ExpiryDate").value
      },
      "credentialStatus": {
        "id": credential.credential_exchange_id, // Credential status URL, replace with real one
        "type": "CredentialStatusList2021"
      },
      "proof": {
        "type": "Ed25519Signature2020",
        "created": new Date().toISOString(),
        "proofPurpose": "assertionMethod",
        "verificationMethod": credential.credential_definition_id, // Replace with issuer's verification method
        // "jws": credential.credential_offer_dict.${"offers~attach"}.data.base64 // Replace with actual JWS signature
    }
};
    res.status(200).json({
      message: "GTIN Credential generation success",
      credential: verifiableCredential,
    });
  } catch (e) {
    res.status(500).json({ message: "GTIN credential generation failed", e });
  }
});

app.post("/issue-gtin-credential-2.0", async (req, res) => {
  try {
    console.log("Request body: ", req.body);

    let credential = await issueCredentials_2(
      connectionOBj["verifier_connection_id"],
      connectionOBj["cred_def_id_GTIN"],
      req.body
    );

    console.log("GTIN Credential Issued: ", credential);

    res.status(200).json({
      message: "GTIN Credential generation success",
      credential: credential,
    });
  } catch (e) {
    res.status(500).json({ message: "GTIN credential generation failed", e });
  }
});
// app.get("/verify-credential", async (req, res) => {
//   try {
//     let CredentialType = req.query.CredentialType;
//     let cred_id = await getCredentialByID(req.query.credential);
//     console.log("cccredId", cred_id);
//     let connection = await verifyCredentials(
//       connectionOBj["verifier_connection_id"],
//       connectionOBj["cred_def_id_" + `${CredentialType}`],
//       connectionOBj["issuer_connection_id"],
//       cred_id
//     );
//     res.status(200).json({
//       message: "credential verification success",
//       isVerfied: connection,
//     });
//   } catch (e) {
//     console.log(e);
//     let response = { data: e };
//     res.status(500).json({ message: "invaild credentials" });
//   }
// });
// app.get("/verify-credential", async (req, res) => {
//   try {
//     let CredentialType = req.query.CredentialType;
//     let cred_id = await getCredentialByID(req.query.credential);
//     console.log("cccredId", cred_id);
//     let connection = await verifyCredentials(
//       connectionOBj["verifier_connection_id"],
//       connectionOBj["cred_def_id_" + `${CredentialType}`],
//       connectionOBj["issuer_connection_id"],
//       cred_id
//     );
//     res.status(200).json({
//       message: "credential verification success",
//       isVerfied: connection,
//     });
//   } catch (e) {
//     console.log(e);
//     let response = { data: e };
//     res.status(500).json({ message: "invaild credentials" });
//   }
// });

app.post("/issue-GCP", async (req, res) => {
  try {
    console.log("Request body: ", req.body);
    let CredentialType = req.body.CredentialType;
    let attributes = [];

    // Set the attributes for "GCP" type credential
    if (CredentialType === "GCP") {
      attributes = [
        { name: "BarcodeSeries", value: req.body.BarcodeSeries },
        { name: "Gcp", value: req.body.Gcp },
        { name: "Manufacturer", value: req.body.Manufacturer },
        { name: "RegistrationDate", value: req.body.RegistrationDate },
        { name: "ExpiryDate", value: req.body.ExpiryDate },
      ];
    } else {
      return res.status(400).json({ message: "Unsupported CredentialType" });
    }

    // Call issueCredentials_2 function with the connection and credential definition
    let credential = await issueGCP_2(
      connectionOBj["verifier_connection_id"],
      connectionOBj["cred_def_id_" + CredentialType],
      attributes
    );

    console.log("Credentials issued: ", credential);

    // Respond with the issued credential
    res.status(200).json({
      message: "Credential generation success",
      credential: credential,
    });
  } catch (e) {
    console.error("Credential generation error: ", e);
    res.status(500).json({ message: "Credential generation failed", error: e });
  }
});


app.get("/verify-credential", async (req, res) => {
  try {
    let CredentialType = req.query.CredentialType;
    let cred_id = await getCredentialByID(req.query.credential);
    console.log("cccredId", cred_id);
    let connection = await verifyCredentials(
      connectionOBj["verifier_connection_id"],
      connectionOBj["cred_def_id_" + `${CredentialType}`],
      connectionOBj["issuer_connection_id"],
      cred_id
    );
    res.status(200).json({
      message: "credential verification success",
      isVerfied: connection,
    });
  } catch (e) {
    console.log(e);
    let response = { data: e };
    res.status(500).json({ message: "invaild credentials" });
  }
});

app.get("/getProof", async (req, res) => {
  try {
    let CredentialType = req.query.CredentialType;
    let cred_id = await getCredentialByID(req.query.credential);
    console.log("cccredId", cred_id);
    let connection = await getProof(
      connectionOBj["verifier_connection_id"],
      connectionOBj["cred_def_id_" + `${CredentialType}`],
      connectionOBj["issuer_connection_id"],
      cred_id
    );
    res.status(200).json({
      message: "credential verification success",
      isVerfied: connection,
    });
  } catch (e) {
    console.log(e);
    let response = { data: e };
    res.status(500).json({ message: "invaild Proof" });
  }
});
app.get("/verifyProof", async (req, res) => {
  try {
    let presentationId = req.query.presentationId;
    // let cred_id = await getCredentialByID(req.query.credential);
    // console.log("cccredId", cred_id);
    let connection = await verifyProof(presentationId
    );
    res.status(200).json({
      message: "credential verification success",
      isVerfied: connection,
    });
  } catch (e) {
    console.log(e);
    let response = { data: e };
    res.status(500).json({ message: "invaild credentials" , response});
  }
});

app.get("/verify-gtin-credential", async (req, res) => {
  try {
    let cred_id = await getCredentialByGTIN(req.query.GTIN);
    console.log("GTIN cred_id", cred_id);
    let connection = await verifyGTINCredentials(
      connectionOBj["verifier_connection_id"],
      connectionOBj["cred_def_id_GTIN"],
      connectionOBj["issuer_connection_id"],
      cred_id
    );
    res.status(200).json({
      message: "GTIN credential verification success",
      isVerified: connection,
    });
  } catch (e) {
    console.log(e);
    let response = { data: e };
    res.status(500).json({ message: "Invalid GTIN credentials" });
  }
});

app.get("/verify-gtin-credential-2.0", async (req, res) => {
    let GTIN = req.query.GTIN;
  try {
    let connection = await verifyGTINCredentials02(
      connectionOBj["verifier_connection_id"],
      connectionOBj["cred_def_id_GTIN"],
      connectionOBj["issuer_connection_id"],
      GTIN
    );
    res.status(200).json({
      message: "GTIN credential verification success",
      isVerified: connection,
    });
  } catch (e) {
    console.log(e);
    let response = { data: e };
    res.status(500).json({ message: "Invalid GTIN credentials" });
  }
});

app.get("/verify-gcp02", async (req, res) => {
  let GCP = req.query.GCP;
  try {
    let connection = await verifyGCP(
      connectionOBj["verifier_connection_id"],
      connectionOBj["cred_def_id_GCP"],
      connectionOBj["issuer_connection_id"],
      GCP
    );
    res.status(200).json({
      message: "GCP credential verification success",
      isVerified: connection,
    });
  } catch (e) {
    console.log(e);
    let response = { data: e };
    res.status(500).json({ message: "Invalid GCP credentials" });
  }
});


app.post("/get-gtin-proof", async (req, res) => {
  try {
    const { GTIN, usermail } = req.body; // Get GTIN and usermail from the request body

    if (!GTIN) {
      return res.status(400).json({ message: "GTIN is required" });
    }
  
    let connection = await verifyGTINCredentials02(
      connectionOBj["verifier_connection_id"],
      connectionOBj["cred_def_id_GTIN"],
      connectionOBj["issuer_connection_id"],
      GTIN
    );

    // Save the connection response as a JSON file
    const connectionFilePath = path.join(__dirname, "connectionResponse.json");
    fs.writeFileSync(connectionFilePath, JSON.stringify(connection, null, 2));

    if (usermail) {
      // Send email with JSON file attachment
      await sendConnectionEmail(usermail, connectionFilePath);
      res.status(200).json({
        message: "GTIN credential verification success. Email sent.",
        isVerified: connection,
      });
    } else {
      // If no email is provided, just return the response
      res.status(200).json({
        message: "GTIN credential verification success",
        isVerified: connection,
      });
    }

    try {
      fs.unlinkSync(connectionFilePath);
    } catch (err) {
      console.error(`Error cleaning up the JSON file: ${err.message}`);
      // We don't return a failure here because the primary operation succeeded
    }

  } catch (e) {
    console.error(`Unexpected error: ${e.message}`);
    res.status(500).json({ message: "An unexpected error occurred" });
  }
});

async function createConnection() {
  try {
    var createConnectionResponse = await axios.post(
      config.ISSUER_AGENT_API_URL + "/connections/create-invitation",
      {}
    );
    console.log("connection response", createConnectionResponse);

    connectionOBj["verifier_connection_id"] =
      createConnectionResponse.data.connection_id;

    var receiveInvitationRespone = await axios.post(
      config.HOLDER_AGENT_API_URL + "/connections/receive-invitation",
      {
        "@id": createConnectionResponse.data.invitation["@id"],
        label: createConnectionResponse.data.invitation.label,
        serviceEndpoint:
          createConnectionResponse.data.invitation.serviceEndpoint,
        recipientKeys: createConnectionResponse.data.invitation.recipientKeys,
      }
    );
    connectionOBj["issuer_connection_id"] =
      receiveInvitationRespone.data.connection_id;
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}

async function createCredentialDefinitionSchema() {
  try {
    // console.log("CredentialType  In defination function: ", CredentialType);
    let schema_name = "GS1India-" + randomstring.generate(3);
    let attributesToPass = "";

    attributesToPass = CredentialTypeAttributes.GCP;
    
    console.log("attributes: ", attributesToPass);

    var createSchema = await axios.post(
      config.ISSUER_AGENT_API_URL + "/schemas",
      {
        attributes: attributesToPass,
        schema_name: schema_name,
        schema_version: "1.0",
      }
    );
    connectionOBj["schema_name_GCP"] = schema_name;
    connectionOBj["schema_id_GCP"] = createSchema.data.schema_id;
    var createCredentialDefiniton = await axios.post(
      config.ISSUER_AGENT_API_URL + "/credential-definitions",
      {
        schema_id: createSchema.data.schema_id,
        support_revocation: false,
        tag: "default",
      }
    );
    connectionOBj["cred_def_id_GCP"] =
      createCredentialDefiniton.data.credential_definition_id;

    console.log("connection object: ", connectionOBj);

    return true;
  } catch (e) {
    console.log("error", e);
    return false;
  }
}

async function issueCredentials(connection_id, cred_def_id, attributes) {
  console.log("connection_id", connection_id);
  console.log("cred_def_id", cred_def_id);
  console.log("attributes", attributes);

  let payload = {
    connection_id: connection_id,
    cred_def_id: cred_def_id,
    credential_proposal: {
      "@type": "issue-credential/1.0/credential-preview",
      attributes,
    },
    schema_version: "1.0",
    trace: true,
  };

  try {
    var issueCredentials = await axios.post(
      config.ISSUER_AGENT_API_URL + "/issue-credential/send",
      payload
    );
    console.log("bnmmdata", JSON.stringify(issueCredentials.data));

    return issueCredentials.data;
  } catch (e) {
    console.log("eeeee", e);
  }
}
async function issueCredentials_2(connection_id, cred_def_id, attributes) {
  console.log("connection_id", connection_id);
  console.log("cred_def_id", cred_def_id);
  console.log("attributes", attributes);

  let payload = {
    connection_id: connection_id,
    "filter": {
        "ld_proof": {
            "credential": {
                "@context": [
                    "https://www.w3.org/2018/credentials/v1",
                    "https://ref.gs1.org/gs1/vc/license-context/"
                ],
                "type": [
                    "VerifiableCredential",
                    "GS1IdentificationKeyLicenseCredential"
                ],
                "issuer": "did:key:zUC7HWE1JftWSqZk666fohSK9PqFzfmNBASKCGM5Mwk3KEmk5b956dHg5pNDpRxrSfkCzfJ7sEfjxEawCoXFL4iWL95kLWCeQifSJ1u7W15TzEmYvHV2LYD2VsyM9Rjg3DYPPS7",
                "issuanceDate": "2020-01-01T12:00:00Z",
                "credentialSubject": {
                    "id": "did:key:zUC73LjdKKs8fijpEZjpxszbhKknjT663kCHp84YtKKurF2qhfHZBcxMztDmtPCxniC8B4isvJNknqyinUyj1A6BvWGVHHaa6TMgM5V5V4rzXyShW5rucH4pBJ7mBCF11GMvAcw",
                    "organization": {
                      "gs1:partyGLN": "7541234000006",
                      "gs1:organizationName": attributes.CompanyName,
                      "gs1:ProductDescription": attributes.ProductDescription,
                      "gs1:ExpiryDate": attributes.ExpiryDate,
                      "gs1:GCP": attributes.GCP,
                      "gs1:ProductImageURL": attributes.ProductImageURL,
                      "gs1:GlobalProductCategory": attributes.GlobalProductCategory,
                      "gs1:NetContent": attributes.NetContent,
                      "gs1:CountryOfSale":attributes.CountryOfSale,
                      "gs1:BrandName":attributes.BrandName
                    },
                    "extendsCredential": "https://id.gs1.org/vc/license/gs1_prefix/754627",
                    "licenseValue": attributes.GTIN,
                    "alternativeLicenseValue": attributes.GTIN,
                    "identificationKeyType": "GTIN"
                }
            },
            "options": {
                "proofType": "BbsBlsSignature2020"
            }
        }
    }
};

  try {
    var issueCredentials = await axios.post(
      config.ISSUER_AGENT_API_URL + "/issue-credential-2.0/send",
      payload
    );
    console.log("bnmmdata", JSON.stringify(issueCredentials.data));

    return issueCredentials.data;
  } catch (e) {
    console.log("eeeee", e);
  }
}

async function issueGCP_2(connection_id, cred_def_id, attributes) {
  console.log("connection_id", connection_id);
  console.log("cred_def_id", cred_def_id);
  console.log("attributes", attributes);

  let payload = {
    connection_id: connection_id,
    filter: {
      ld_proof: {
        credential: {
          "@context": [
            "https://www.w3.org/2018/credentials/v1",
            "https://ref.gs1.org/gs1/vc/license-context/"
          ],
          type: [
            "VerifiableCredential",
            "GS1IdentificationKeyLicenseCredential"
          ],
          issuer: "did:key:zUC7HWE1JftWSqZk666fohSK9PqFzfmNBASKCGM5Mwk3KEmk5b956dHg5pNDpRxrSfkCzfJ7sEfjxEawCoXFL4iWL95kLWCeQifSJ1u7W15TzEmYvHV2LYD2VsyM9Rjg3DYPPS7",
          issuanceDate: new Date().toISOString(),
          credentialSubject: {
            id: "did:key:zUC73LjdKKs8fijpEZjpxszbhKknjT663kCHp84YtKKurF2qhfHZBcxMztDmtPCxniC8B4isvJNknqyinUyj1A6BvWGVHHaa6TMgM5V5V4rzXyShW5rucH4pBJ7mBCF11GMvAcw",
            organization: {
              "gs1:partyGLN": "7541234000006",
              "gs1:organizationName": attributes.find(attr => attr.name === 'Manufacturer').value,
              "gs1:BarcodeSeries": attributes.find(attr =>attr.name === 'BarcodeSeries' ).value,
            "gs1:RegistrationDate": attributes.find(attr =>attr.name === 'RegistrationDate' ).value,
            "gs1:ExpiryDate": attributes.find(attr =>attr.name === 'ExpiryDate' ).value,
            },
            extendsCredential: "https://id.gs1.org/vc/license/gs1_prefix/754627",
            licenseValue: attributes.find(attr => attr.name === 'Gcp').value,
            alternativeLicenseValue: attributes.find(attr => attr.name === 'Gcp').value,
            identificationKeyType: "GTIN",
            
          }
        },
        options: {
          proofType: "BbsBlsSignature2020"
        }
      }
    }
  };

  // Simulate credential issuing (you can replace this with an actual API call)
  try {
    var issueCredentials = await axios.post(
      config.ISSUER_AGENT_API_URL + "/issue-credential-2.0/send",
      payload
    );
    console.log("...GCP DATA...", JSON.stringify(issueCredentials.data));

    return issueCredentials.data;
  } catch (e) {
    console.log("ERROR", e);
  }
}

async function verifyGCP(
  verifier_connection_id,
  cred_def_id,
  issuer_connection_id,
  gcp
) {
  try {
    let request = {
      "comment": "Verifying GCP attributes",
      connection_id: verifier_connection_id,
      "presentation_request": {
        "dif": {
          "options": {
            "challenge": "3fa85f64-5717-4562-b3fc-2c963f66afa7",
            "domain": "4jt78h47fh47"
          },
          "presentation_definition": {
            "id": "32f54163-7166-48f1-93d8-ff217bdb0654",
            "format": {
              "ldp_vp": {
                "proof_type": [
                  "BbsBlsSignature2020"
                ]
              }
            },
            "input_descriptors": [
              {
                "id": "GCP Credential",
                "name": "GCP Verification",
                "schema": [
                  {
                    "uri": "https://www.w3.org/2018/credentials#VerifiableCredential"
                  },
                  {
                    "uri": "https://gs1.org/voc/GS1IdentificationKeyLicenseCredential"
                  }
                ],
                "constraints": {
                  "limit_disclosure": "required",
                  "is_holder": [
                    {
                      "directive": "required",
                      "field_id": [
                        "1f44d55f-f161-4938-a659-f8026467f126"
                      ]
                    }
                  ],
                  "fields": [
                    {
                      "id": "1f44d55f-f161-4938-a659-f8026467f126",
                      "path": [
                        "$.credentialSubject.licenseValue"
                      ],
                      "purpose": "The claim must be from one of the specified issuers",
                      "filter": {
                        "const": gcp
                      }
                    },
                    {
                      "path": [
                        "$.credentialSubject.extendsCredential"
                      ],
                      "purpose": "The claim must be from one of the specified issuers"
                    },
                    {
                      "path": [
                          "$.credentialSubject.organization"
                      ],
                      "purpose": "The claim must be from one of the specified issuers"
                  }
                  ]
                }
              }
            ]
          }
        }
      }
    }
    
    var presentProofRequest = await axios.post(
      config.ISSUER_AGENT_API_URL + "/present-proof-2.0/send-request",
      request
    );
    console.log("prstr", presentProofRequest.data);
    let thread_id = presentProofRequest.data.thread_id;
    await sleep(1000);
    console.log("present proof request done...........");
    try {
      var fetch_profs = await axios.get(
        config.HOLDER_AGENT_API_URL + 
          "/present-proof-2.0/records?thread_id=" +
          thread_id
      );
    } catch (e) {
      console.log(e);
    }

    let holder_presentation =
      fetch_profs.data.results[0].pres_ex_id;
    console.log("fetch_profs", fetch_profs);
    console.log("fetch proof request done...........",holder_presentation);

    // Prepare the presentation payload for GTIN and CompanyName
    let presentProofPayload = {
      "dif": {
  }
    };

    await sleep(1000);
    
    // Send presentation using /present-proof-2.0/records/{pres_ex_id}/send-presentation
    let send_presentation = await axios.post(
      config.HOLDER_AGENT_API_URL +
        `/present-proof-2.0/records/${holder_presentation}/send-presentation`,
      presentProofPayload
    );

    console.log("....PRESENT DATA....",send_presentation.data);
    console.log("Presentation sent..........");

    console.log(
      "exchange id........." + presentProofRequest.data.pres_ex_id
    );
    await sleep(2000);

    // Verify presentation using /present-proof-2.0/records/{pres_ex_id}/verify-presentation
    let verify_presentation = await axios.post(
      config.ISSUER_AGENT_API_URL +
        `/present-proof-2.0/records/${presentProofRequest.data.pres_ex_id}/verify-presentation`
    );

    console.log(JSON.stringify(verify_presentation.data));
    console.log("presentation verified...........");

    return verify_presentation.data;
  } catch (e) {
    console.log(e);
    throw new Error("Verification failed", e);
  }
}


async function verifyCredentials(
  verifier_connection_id,
  cred_def_id,
  issuer_connection_id,
  cred_id
) {
  try {
    let request = {     
      connection_id: verifier_connection_id,
      proof_request: {
        name: "Proof of GCP",
        version: "1.0",
        requested_attributes: {
          BarcodeSeries: {
            name: "BarcodeSeries",
            restrictions: [
              {
                cred_def_id: cred_def_id,
              },
            ],
          },
          Gcp: {
            name: "Gcp",
            restrictions: [
              {
                cred_def_id: cred_def_id,
              },
            ],
          },
          Manufacturer: {
            name: "Manufacturer",
            restrictions: [
              {
                cred_def_id: cred_def_id,
              },
            ],
          },
          RegistrationDate: {
            name: "RegistrationDate",
            restrictions: [
              {
                cred_def_id: cred_def_id,
              },
            ],
          },
          ExpiryDate: {
            name: "ExpiryDate",
            restrictions: [
              {
                cred_def_id: cred_def_id,
              },
            ],
          },
        },
        requested_predicates: {},
      },
    };
    var presentProofRequest = await axios.post(
      config.ISSUER_AGENT_API_URL + "/present-proof/send-request",
      request
    );
    console.log("prstr", presentProofRequest.data);
    let thread_id = presentProofRequest.data.thread_id;
    await sleep(1000);
    console.log("present proof request done...........");
    try {
      var fetch_profs = await axios.get(
        config.HOLDER_AGENT_API_URL + 
          "/present-proof/records?thread_id=" +
          thread_id
      );
    } catch (e) {
      console.log(e);
    }

    let holder_presentation =
      fetch_profs.data.results[0].presentation_exchange_id;
    console.log("fetch_profs", fetch_profs);

    console.log("fetch proof request done...........");
    let presentProofPayload = {
      auto_remove: true,
      requested_attributes: {
        BarcodeSeries: {
          cred_id: cred_id,
          revealed: true,
        },
        Gcp: {
          cred_id: cred_id,
          revealed: true,
        },
        Manufacturer: {
          cred_id: cred_id,
          revealed: true,
        },
        RegistrationDate: {
          cred_id: cred_id,
          revealed: true,
        },
        ExpiryDate: {
          cred_id: cred_id,
          revealed: true,
        },
      },
      requested_predicates: {},
      self_attested_attributes: {},
      trace: false,
    };
    await sleep(1000);
    let send_presentation = await axios.post(
      config.HOLDER_AGENT_API_URL +
        `/present-proof/records/${holder_presentation}/send-presentation`,
      presentProofPayload
    );

    console.log(send_presentation.data);
    console.log("Presentation sent..........");

    //present-oof/records/44ff6e3b-487b-417d-945b-f264f08a5980/verify-presentation

    console.log(
      "exchange id........." + presentProofRequest.data.presentation_exchange_id
    );
    await sleep(2000);
    let verify_presentation = await axios.post(
      config.ISSUER_AGENT_API_URL +
        `/present-proof/records/${presentProofRequest.data.presentation_exchange_id}/verify-presentation`
    );

    console.log(JSON.stringify(verify_presentation.data));

    console.log("presentation verfied...........");
    return verify_presentation.data;
  } catch (e) {
    console.log(e);
    throw new Error("Verrfication failed ", e);
  }
}
async function getProof(
  verifier_connection_id,
  cred_def_id,
  issuer_connection_id,
  cred_id
) {
  try {
    let request = {
      connection_id: verifier_connection_id,
      proof_request: {
        name: "Proof of GCP",
        version: "1.0",
        requested_attributes: {
          BarcodeSeries: {
            name: "BarcodeSeries",
            restrictions: [
              {
                cred_def_id: cred_def_id,
              },
            ],
          },
          Gcp: {
            name: "Gcp",
            restrictions: [
              {
                cred_def_id: cred_def_id,
              },
            ],
          },
          Manufacturer: {
            name: "Manufacturer",
            restrictions: [
              {
                cred_def_id: cred_def_id,
              },
            ],
          },
          RegistrationDate: {
            name: "RegistrationDate",
            restrictions: [
              {
                cred_def_id: cred_def_id,
              },
            ],
          },
          ExpiryDate: {
            name: "ExpiryDate",
            restrictions: [
              {
                cred_def_id: cred_def_id,
              },
            ],
          },
        },
        requested_predicates: {},
      },
    };
    var presentProofRequest = await axios.post(
      config.ISSUER_AGENT_API_URL + "/present-proof/send-request",
      request
    );
    console.log("prstr", presentProofRequest.data);
    let thread_id = presentProofRequest.data.thread_id;
    await sleep(1000);
    console.log("present proof request done...........");
    try {
      var fetch_profs = await axios.get(
        config.HOLDER_AGENT_API_URL +
          "/present-proof/records?thread_id=" +
          thread_id
      );
    } catch (e) {
      console.log(e);
    }

    let holder_presentation =
      fetch_profs.data.results[0].presentation_exchange_id;
    console.log("fetch_profs", fetch_profs);

    console.log("fetch proof request done...........");
    let presentProofPayload = {
      auto_remove: true,
      requested_attributes: {
        BarcodeSeries: {
          cred_id: cred_id,
          revealed: true,
        },
        Gcp: {
          cred_id: cred_id,
          revealed: true,
        },
        Manufacturer: {
          cred_id: cred_id,
          revealed: true,
        },
        RegistrationDate: {
          cred_id: cred_id,
          revealed: true,
        },
        ExpiryDate: {
          cred_id: cred_id,
          revealed: true,
        },
      },
      requested_predicates: {},
      self_attested_attributes: {},
      trace: false,
    };
    await sleep(1000);
    let send_presentation = await axios.post(
      config.HOLDER_AGENT_API_URL +
        `/present-proof/records/${holder_presentation}/send-presentation`,
      presentProofPayload
    );

    console.log(send_presentation.data);
    console.log("Presentation sent..........");

    //present-oof/records/44ff6e3b-487b-417d-945b-f264f08a5980/verify-presentation

    console.log(
      "exchange id........." + presentProofRequest.data.presentation_exchange_id
    );

    send_presentation.data.exchange_id = presentProofRequest.data.presentation_exchange_id;

    return send_presentation.data;
  } catch (e) {
    console.log(e);
    throw new Error("Verrfication failed ", e);
  }
}
async function verifyProof(presentationId) {
  try {
    let verify_presentation = await axios.post(
      config.ISSUER_AGENT_API_URL +
        `/present-proof/records/${presentationId}/verify-presentation`
    );

    console.log(JSON.stringify(verify_presentation.data));

    console.log("presentation verfied...........");

    return JSON.stringify(verify_presentation.data);
  } catch (e) {
    console.log(e);
    throw new Error("Verrfication failed ", e);
  }
}
async function verifyGTINCredentials(
  verifier_connection_id,
  cred_def_id,
  issuer_connection_id,
  cred_id
) {
  try {
    let request = {
      connection_id: verifier_connection_id,
      proof_request: {
        name: "Proof of GTIN",
        version: "1.0",
        requested_attributes: {
          GTIN: {
            name: "GTIN",
            restrictions: [
              {
                cred_def_id: cred_def_id,
              },
            ],
          },
          GCP: {
            name: "GCP",
            restrictions: [
              {
                cred_def_id: cred_def_id,
              },
            ],
          },
          BrandName: {
            name: "BrandName",
            restrictions: [
              {
                cred_def_id: cred_def_id,
              },
            ],
          },
          ProductDescription: {
            name: "ProductDescription",
            restrictions: [
              {
                cred_def_id: cred_def_id,
              },
            ],
          },
          ExpiryDate: {
            name: "ExpiryDate",
            restrictions: [
              {
                cred_def_id: cred_def_id,
              },
            ],
          },
          NetContent: {
            name: "NetContent",
            restrictions: [
              {
                cred_def_id: cred_def_id,
              },
            ],
          },
        },
        requested_predicates: {},
      },
    };
    var presentProofRequest = await axios.post(
      config.ISSUER_AGENT_API_URL + "/present-proof/send-request",
      request
    );
    console.log("prstr", presentProofRequest.data);
    let thread_id = presentProofRequest.data.thread_id;
    await sleep(1000);
    console.log("present proof request done...........");
    try {
      var fetch_profs = await axios.get(
        config.HOLDER_AGENT_API_URL +
          "/present-proof/records?thread_id=" +
          thread_id
      );
    } catch (e) {
      console.log(e);
    }

    let holder_presentation =
      fetch_profs.data.results[0].presentation_exchange_id;
    console.log("fetch_profs", fetch_profs);

    console.log("fetch proof request done...........");
    let presentProofPayload = {
      auto_remove: true,
      requested_attributes: {
        GTIN: {
          cred_id: cred_id,
          revealed: true,
        },
        GCP: {
          cred_id: cred_id,
          revealed: true,
        },
        BrandName: {
          cred_id: cred_id,
          revealed: true,
        },
        ProductDescription: {
          cred_id: cred_id,
          revealed: true,
        },
        ExpiryDate: {
          cred_id: cred_id,
          revealed: true,
        },
        NetContent: {
          cred_id: cred_id,
          revealed: true,
        },
      },
      requested_predicates: {},
      self_attested_attributes: {},
      trace: false,
    };
    await sleep(1000);
    let send_presentation = await axios.post(
      config.HOLDER_AGENT_API_URL +
        `/present-proof/records/${holder_presentation}/send-presentation`,
      presentProofPayload
    );

    console.log(send_presentation.data);
    console.log("Presentation sent..........");

    //present-oof/records/44ff6e3b-487b-417d-945b-f264f08a5980/verify-presentation

    console.log(
      "exchange id........." + presentProofRequest.data.presentation_exchange_id
    );
    await sleep(2000);
    let verify_presentation = await axios.post(
      config.ISSUER_AGENT_API_URL +
        `/present-proof/records/${presentProofRequest.data.presentation_exchange_id}/verify-presentation`
    );

    console.log(JSON.stringify(verify_presentation.data));

    console.log("presentation verfied...........");

    return verify_presentation.data;
  } catch (e) {
    console.log(e);
    throw new Error("Verrfication failed ", e);
  }
}

async function verifyGTINCredentials02(
  verifier_connection_id,
  cred_def_id,
  issuer_connection_id,
  gtin
) {
  try {
    let request = {
      "comment": "string",
         connection_id: verifier_connection_id,
      "presentation_request": {
          "dif": {
              "options": {
                  "challenge": "3fa85f64-5717-4562-b3fc-2c963f66afa7",
                  "domain": "4jt78h47fh47"
              },
              "presentation_definition": {
                  "id": "32f54163-7166-48f1-93d8-ff217bdb0654",
                  "format": {
                      "ldp_vp": {
                          "proof_type": [
                              "BbsBlsSignature2020"
                          ]
                      }
                  },
                  "input_descriptors": [
                      {
                          "id": "GTIN Credential",
                          "name": "Gtin Verification",
                          "schema": [
                              {
                                  "uri": "https://www.w3.org/2018/credentials#VerifiableCredential"
                              },
                              {
                                  "uri": "https://gs1.org/voc/GS1IdentificationKeyLicenseCredential"
                              }
                          ],
                          "constraints": {
                              "limit_disclosure": "required",
                              "is_holder": [
                                  {
                                      "directive": "required",
                                      "field_id": [
                                          "1f44d55f-f161-4938-a659-f8026467f126"
                                      ]
                                  }
                              ],
                              "fields": [
                                  {
                                      "id": "1f44d55f-f161-4938-a659-f8026467f126",
                                      "path": [
                                          "$.credentialSubject.licenseValue"
                                      ],
                                      "purpose": "The claim must be from one of the specified issuers",
                                      "filter": {
                                        "const": gtin,
                                    }
                                  },
                                  {
                                      "path": [
                                          "$.credentialSubject.organization"
                                      ],
                                      "purpose": "The claim must be from one of the specified issuers"
                                  }
                              ]
                          }
                      }
                  ]
              }
          }
      }
  };
  console.log("Request being sent:", request);

    // Send proof request using /present-proof-2.0/send-request
    var presentProofRequest = await axios.post(
      config.ISSUER_AGENT_API_URL + "/present-proof-2.0/send-request",
      request
    );
    console.log("prstr", presentProofRequest.data);
    let thread_id = presentProofRequest.data.thread_id;
    await sleep(1000);
    console.log("present proof request done...........");

    // Fetch proof records using /present-proof-2.0/records
    try {
      var fetch_profs = await axios.get(
        config.HOLDER_AGENT_API_URL +
          "/present-proof-2.0/records?thread_id=" +
          thread_id
      );
    } catch (e) {
      console.log(e);
    }

    let holder_presentation =
      fetch_profs.data.results[0].pres_ex_id;
    console.log("fetch_profs", fetch_profs);
    console.log("fetch proof request done...........",holder_presentation);

    // Prepare the presentation payload for GTIN and CompanyName
    let presentProofPayload = {
      "dif": {
  }
    };

    await sleep(1000);
    
    // Send presentation using /present-proof-2.0/records/{pres_ex_id}/send-presentation
    let send_presentation = await axios.post(
      config.HOLDER_AGENT_API_URL +
        `/present-proof-2.0/records/${holder_presentation}/send-presentation`,
      presentProofPayload
    );

    console.log("....PRESENT DATA....",send_presentation.data);
    console.log("Presentation sent..........");

    console.log(
      "exchange id........." + presentProofRequest.data.pres_ex_id
    );
    await sleep(2000);

    // Verify presentation using /present-proof-2.0/records/{pres_ex_id}/verify-presentation
    let verify_presentation = await axios.post(
      config.ISSUER_AGENT_API_URL +
        `/present-proof-2.0/records/${presentProofRequest.data.pres_ex_id}/verify-presentation`
    );

    console.log(JSON.stringify(verify_presentation.data));
    console.log("presentation verified...........");

    return verify_presentation.data;
  } catch (e) {
    console.log(e);
    throw new Error("Verification failed", e);
  }
}


async function getGTINProof(
  verifier_connection_id,
  cred_def_id,
  issuer_connection_id,
  cred_id
) {
  try {
    let request = {
      connection_id: verifier_connection_id,
      proof_request: {
        name: "Proof of GTIN",
        version: "1.0",
        requested_attributes: {
          GTIN: {
            name: "GTIN",
            restrictions: [
              {
                cred_def_id: cred_def_id,
              },
            ],
          },
          GCP: {
            name: "GCP",
            restrictions: [
              {
                cred_def_id: cred_def_id,
              },
            ],
          },
          BrandName: {
            name: "BrandName",
            restrictions: [
              {
                cred_def_id: cred_def_id,
              },
            ],
          },
          ProductDescription: {
            name: "ProductDescription",
            restrictions: [
              {
                cred_def_id: cred_def_id,
              },
            ],
          },
          ExpiryDate: {
            name: "ExpiryDate",
            restrictions: [
              {
                cred_def_id: cred_def_id,
              },
            ],
          },
          NetContent: {
            name: "NetContent",
            restrictions: [
              {
                cred_def_id: cred_def_id,
              },
            ],
          },
        },
        requested_predicates: {},
      },
    };
    var presentProofRequest = await axios.post(
      config.ISSUER_AGENT_API_URL + "/present-proof/send-request",
      request
    );
    console.log("prstr", presentProofRequest.data);
    let thread_id = presentProofRequest.data.thread_id;
    await sleep(1000);
    console.log("present proof request done...........");
    try {
      var fetch_profs = await axios.get(
        config.HOLDER_AGENT_API_URL +
          "/present-proof/records?thread_id=" +
          thread_id
      );
    } catch (e) {
      console.log(e);
    }

    let holder_presentation =
      fetch_profs.data.results[0].presentation_exchange_id;
    console.log("fetch_profs", fetch_profs);

    console.log("fetch proof request done...........");
    let presentProofPayload = {
      auto_remove: true,
      requested_attributes: {
        GTIN: {
          cred_id: cred_id,
          revealed: true,
        },
        GCP: {
          cred_id: cred_id,
          revealed: true,
        },
        BrandName: {
          cred_id: cred_id,
          revealed: true,
        },
        ProductDescription: {
          cred_id: cred_id,
          revealed: true,
        },
        ExpiryDate: {
          cred_id: cred_id,
          revealed: true,
        },
        NetContent: {
          cred_id: cred_id,
          revealed: true,
        },
      },
      requested_predicates: {},
      self_attested_attributes: {},
      trace: false,
    };
    await sleep(1000);
    let send_presentation = await axios.post(
      config.HOLDER_AGENT_API_URL +
        `/present-proof/records/${holder_presentation}/send-presentation`,
      presentProofPayload
    );

    console.log(send_presentation.data);
    console.log("Presentation sent..........");

    //present-oof/records/44ff6e3b-487b-417d-945b-f264f08a5980/verify-presentation

    console.log(
      "exchange id........." + presentProofRequest.data.presentation_exchange_id
    );
    // await sleep(2000);
    // let verify_presentation = await axios.post(
    //   config.ISSUER_AGENT_API_URL +
    //     `/present-proof/records/${presentProofRequest.data.presentation_exchange_id}/verify-presentation`
    // );

    // console.log(JSON.stringify(verify_presentation.data));

    // console.log("presentation verfied...........");
    send_presentation.data.exchange_id = presentProofRequest.data.presentation_exchange_id;
    return send_presentation.data;
  } catch (e) {
    console.log(e);
    throw new Error("Verrfication failed ", e);
  }
}
async function createGtinCredentialDefinitionSchema() {
  try {
    console.log("Creating GTIN Schema and Credential Definition...");
    
    let schema_name = "GTIN-" + randomstring.generate(3);
    let attributesToPass = ["GTIN", "GCP", "BrandName", "ProductDescription", "ProductImageURL", "GlobalProductCategory", "NetContent", "CountryOfSale", "ExpiryDate"];

    var createSchema = await axios.post(
      config.ISSUER_AGENT_API_URL + "/schemas",
      {
        attributes: attributesToPass,
        schema_name: schema_name,
        schema_version: "1.0",
      }
    );
    connectionOBj["schema_name_GTIN"] = schema_name;
    connectionOBj["schema_id_GTIN"] = createSchema.data.schema_id;
    var createCredentialDefinition = await axios.post(
      config.ISSUER_AGENT_API_URL + "/credential-definitions",
      {
        schema_id: createSchema.data.schema_id,
        support_revocation: false,
        tag: "default",
      }
    );

    connectionOBj["cred_def_id_GTIN"] = createCredentialDefinition.data.credential_definition_id;

    console.log("GTIN Credential Definition Created: ", connectionOBj);
    return true;
  } catch (e) {
    console.log("Error creating GTIN schema and credential definition: ", e);
    return false;
  }
}

async function getCredentialByID(id) {
  try {
    var request = {
      params: { wql: `{"attr::Gcp::value": "${id}"}` },
    };
    console.log(request);
    let cred_id = await axios.get(
      config.HOLDER_AGENT_API_URL + `/credentials`,
      request
    );

    return cred_id.data.results[0].referent;
  } catch (e) {
    throw new Error("Invalid Credentialssss",e);
  }
}

async function getCredentialByGTIN(id) {
  try {
    var request = {
      params: { wql: `{"attr::GTIN::value": "${id}"}` },
    };
    console.log(request);
    let cred_id = await axios.get(
      config.HOLDER_AGENT_API_URL + `/credentials`,
      request
    );

    return cred_id.data.results[0].referent;
  } catch (e) {
    throw new Error("Invalid Credentialssss",e);
  }
}
async function readFile(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, "utf8", function (err, data) {
      if (err) {
        reject(err);
      }
      resolve(data);
    });
  });
}
async function writeFile(path, data) {
  return new Promise(function (resolve, reject) {
    fs.writeFile(path, data, "utf8", function (err) {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

function sleep(ms) {
  console.log("sleep............");
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
