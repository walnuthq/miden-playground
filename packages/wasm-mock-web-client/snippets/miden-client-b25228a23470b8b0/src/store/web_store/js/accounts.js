import {
  accountCodes,
  accountStorages,
  accountVaults,
  accountAuths,
  accounts,
  foreignAccountCode,
} from "./schema.js";

// GET FUNCTIONS
export async function getAccountIds() {
  try {
    let allIds = new Set(); // Use a Set to ensure uniqueness

    // Iterate over each account entry
    await accounts.each((account) => {
      allIds.add(account.id); // Assuming 'account' has an 'id' property
    });

    return Array.from(allIds); // Convert back to array to return a list of unique IDs
  } catch (error) {
    console.error("Failed to retrieve account IDs: ", error.toString());
    throw error;
  }
}

export async function getAllAccountHeaders() {
  try {
    // Use a Map to track the latest record for each id based on nonce
    const latestRecordsMap = new Map();

    await accounts.each((record) => {
      const existingRecord = latestRecordsMap.get(record.id);
      if (
        !existingRecord ||
        BigInt(record.nonce) > BigInt(existingRecord.nonce)
      ) {
        latestRecordsMap.set(record.id, record);
      }
    });

    // Extract the latest records from the Map
    const latestRecords = Array.from(latestRecordsMap.values());

    const resultObject = await Promise.all(
      latestRecords.map(async (record) => {
        let accountSeedBase64 = null;
        if (record.accountSeed) {
          // Ensure accountSeed is processed as a Uint8Array and converted to Base64
          let accountSeedArrayBuffer = await record.accountSeed.arrayBuffer();
          let accountSeedArray = new Uint8Array(accountSeedArrayBuffer);
          accountSeedBase64 = uint8ArrayToBase64(accountSeedArray);
        }

        return {
          id: record.id,
          nonce: record.nonce,
          vaultRoot: record.vaultRoot,
          storageRoot: record.storageRoot,
          codeRoot: record.codeRoot,
          accountSeed: accountSeedBase64, // Now correctly formatted as Base64
          locked: record.locked,
        };
      })
    );

    return resultObject;
  } catch (error) {
    console.error(
      "Error fetching all latest account headers:",
      error.toString()
    );
    throw error;
  }
}

export async function getAccountHeader(accountId) {
  try {
    // Fetch all records matching the given id
    const allMatchingRecords = await accounts
      .where("id")
      .equals(accountId)
      .toArray();

    if (allMatchingRecords.length === 0) {
      console.log("No account header record found for given ID.");
      return null;
    }

    // Convert nonce to BigInt and sort
    // Note: This assumes all nonces are valid BigInt strings.
    const sortedRecords = allMatchingRecords.sort((a, b) => {
      const bigIntA = BigInt(a.nonce);
      const bigIntB = BigInt(b.nonce);
      return bigIntA > bigIntB ? -1 : bigIntA < bigIntB ? 1 : 0;
    });

    // The first record is the most recent one due to the sorting
    const mostRecentRecord = sortedRecords[0];

    let accountSeedBase64 = null;
    if (mostRecentRecord.accountSeed) {
      // Ensure accountSeed is processed as a Uint8Array and converted to Base64
      let accountSeedArrayBuffer =
        await mostRecentRecord.accountSeed.arrayBuffer();
      let accountSeedArray = new Uint8Array(accountSeedArrayBuffer);
      accountSeedBase64 = uint8ArrayToBase64(accountSeedArray);
    }
    const AccountHeader = {
      id: mostRecentRecord.id,
      nonce: mostRecentRecord.nonce,
      vaultRoot: mostRecentRecord.vaultRoot,
      storageRoot: mostRecentRecord.storageRoot,
      codeRoot: mostRecentRecord.codeRoot,
      accountSeed: accountSeedBase64,
      locked: mostRecentRecord.locked,
    };
    return AccountHeader;
  } catch (error) {
    console.error(
      `Error fetching account header for ID ${accountId}:`,
      error.toString()
    );
    throw error;
  }
}

export async function getAccountHeaderByCommitment(accountCommitment) {
  try {
    // Fetch all records matching the given commitment
    const allMatchingRecords = await accounts
      .where("accountCommitment")
      .equals(accountCommitment)
      .toArray();

    if (allMatchingRecords.length === 0) {
      console.log("No account header record found for given commitment.");
      return null;
    }

    // There should be only one match
    const matchingRecord = allMatchingRecords[0];

    let accountSeedBase64 = null;
    if (matchingRecord.accountSeed) {
      // Ensure accountSeed is processed as a Uint8Array and converted to Base64
      let accountSeedArrayBuffer =
        await matchingRecord.accountSeed.arrayBuffer();
      let accountSeedArray = new Uint8Array(accountSeedArrayBuffer);
      accountSeedBase64 = uint8ArrayToBase64(accountSeedArray);
    }
    const AccountHeader = {
      id: matchingRecord.id,
      nonce: matchingRecord.nonce,
      vaultRoot: matchingRecord.vaultRoot,
      storageRoot: matchingRecord.storageRoot,
      codeRoot: matchingRecord.codeRoot,
      accountSeed: accountSeedBase64,
      locked: matchingRecord.locked,
    };
    return AccountHeader;
  } catch (error) {
    console.error(
      `Error fetching account header for commitment ${accountCommitment}:`,
      error.toString()
    );
    throw error;
  }
}

export async function getAccountCode(codeRoot) {
  try {
    // Fetch all records matching the given root
    const allMatchingRecords = await accountCodes
      .where("root")
      .equals(codeRoot)
      .toArray();

    if (allMatchingRecords.length === 0) {
      console.log("No records found for given code root.");
      return null;
    }

    // The first record is the only one due to the uniqueness constraint
    const codeRecord = allMatchingRecords[0];

    // Convert the code Blob to an ArrayBuffer
    const codeArrayBuffer = await codeRecord.code.arrayBuffer();
    const codeArray = new Uint8Array(codeArrayBuffer);
    const codeBase64 = uint8ArrayToBase64(codeArray);

    return {
      root: codeRecord.root,
      code: codeBase64,
    };
  } catch (error) {
    console.error(
      `Error fetching account code for root ${codeRoot}:`,
      error.toString()
    );
    throw error;
  }
}

export async function getAccountStorage(storageRoot) {
  try {
    // Fetch all records matching the given root
    const allMatchingRecords = await accountStorages
      .where("root")
      .equals(storageRoot)
      .toArray();

    if (allMatchingRecords.length === 0) {
      console.log("No records found for given storage root.");
      return null;
    }

    // The first record is the only one due to the uniqueness constraint
    const storageRecord = allMatchingRecords[0];

    // Convert the module Blob to an ArrayBuffer
    const storageArrayBuffer = await storageRecord.slots.arrayBuffer();
    const storageArray = new Uint8Array(storageArrayBuffer);
    const storageBase64 = uint8ArrayToBase64(storageArray);
    return {
      root: storageRecord.root,
      storage: storageBase64,
    };
  } catch (error) {
    console.error(
      `Error fetching account storage for root ${storageRoot}:`,
      error.toString()
    );
    throw error;
  }
}

export async function getAccountAssetVault(vaultRoot) {
  try {
    // Fetch all records matching the given root
    const allMatchingRecords = await accountVaults
      .where("root")
      .equals(vaultRoot)
      .toArray();

    if (allMatchingRecords.length === 0) {
      console.log("No records found for given vault root.");
      return null;
    }

    // The first record is the only one due to the uniqueness constraint
    const vaultRecord = allMatchingRecords[0];

    // Convert the assets Blob to an ArrayBuffer
    const assetsArrayBuffer = await vaultRecord.assets.arrayBuffer();
    const assetsArray = new Uint8Array(assetsArrayBuffer);
    const assetsBase64 = uint8ArrayToBase64(assetsArray);

    return {
      root: vaultRecord.root,
      assets: assetsBase64,
    };
  } catch (error) {
    console.error(
      `Error fetching account vault for root ${vaultRoot}:`,
      error.toString()
    );
    throw error;
  }
}

export function getAccountAuthByPubKey(pubKey) {
  // Try to get the account auth from the cache
  let cachedSecretKey = ACCOUNT_AUTH_MAP.get(pubKey);

  // If it's not in the cache, throw an error
  if (!cachedSecretKey) {
    throw new Error("Account auth not found in cache.");
  }

  let data = {
    secretKey: cachedSecretKey,
  };

  return data;
}

var ACCOUNT_AUTH_MAP = new Map();
export async function fetchAndCacheAccountAuthByPubKey(pubKey) {
  try {
    // Fetch all records matching the given id
    const allMatchingRecords = await accountAuths
      .where("pubKey")
      .equals(pubKey)
      .toArray();

    if (allMatchingRecords.length === 0) {
      console.log("No account auth records found for given account ID.");
      return null; // No records found
    }

    // The first record is the only one due to the uniqueness constraint
    const authRecord = allMatchingRecords[0];

    // Store the auth info in the map
    ACCOUNT_AUTH_MAP.set(authRecord.pubKey, authRecord.secretKey);

    return {
      secretKey: authRecord.secretKey,
    };
  } catch (error) {
    console.error(
      `Error fetching account auth for pubKey ${pubKey}:`,
      error.toString()
    );
    throw error;
  }
}

// INSERT FUNCTIONS

export async function insertAccountCode(codeRoot, code) {
  try {
    // Create a Blob from the ArrayBuffer
    const codeBlob = new Blob([new Uint8Array(code)]);

    // Prepare the data object to insert
    const data = {
      root: codeRoot, // Using codeRoot as the key
      code: codeBlob,
    };

    // Perform the insert using Dexie
    await accountCodes.put(data);
  } catch (error) {
    console.error(
      `Error inserting code with root: ${codeRoot}:`,
      error.toString()
    );
    throw error;
  }
}

export async function insertAccountStorage(storageRoot, storageSlots) {
  try {
    const storageSlotsBlob = new Blob([new Uint8Array(storageSlots)]);

    // Prepare the data object to insert
    const data = {
      root: storageRoot, // Using storageRoot as the key
      slots: storageSlotsBlob, // Blob created from ArrayBuffer
    };

    // Perform the insert using Dexie
    await accountStorages.put(data);
  } catch (error) {
    console.error(
      `Error inserting storage with root: ${storageRoot}:`,
      error.toString()
    );
    throw error;
  }
}

export async function insertAccountAssetVault(vaultRoot, assets) {
  try {
    const assetsBlob = new Blob([new Uint8Array(assets)]);

    // Prepare the data object to insert
    const data = {
      root: vaultRoot, // Using vaultRoot as the key
      assets: assetsBlob,
    };

    // Perform the insert using Dexie
    await accountVaults.put(data);
  } catch (error) {
    console.error(
      `Error inserting vault with root: ${vaultRoot}:`,
      error.toString()
    );
    throw error;
  }
}

export async function insertAccountRecord(
  accountId,
  codeRoot,
  storageRoot,
  vaultRoot,
  nonce,
  committed,
  accountSeed,
  commitment
) {
  try {
    let accountSeedBlob = null;
    if (accountSeed) {
      accountSeedBlob = new Blob([new Uint8Array(accountSeed)]);
    }

    // Prepare the data object to insert
    const data = {
      id: accountId, // Using accountId as the key
      codeRoot: codeRoot,
      storageRoot: storageRoot,
      vaultRoot: vaultRoot,
      nonce: nonce,
      committed: committed,
      accountSeed: accountSeedBlob,
      accountCommitment: commitment,
      locked: false,
    };

    // Perform the insert using Dexie
    await accounts.add(data);
  } catch (error) {
    console.error(`Error inserting account: ${accountId}:`, error.toString());
    throw error;
  }
}

export async function insertAccountAuth(pubKey, secretKey) {
  try {
    // Prepare the data object to insert
    const data = {
      pubKey: pubKey,
      secretKey: secretKey,
    };

    // Perform the insert using Dexie
    await accountAuths.add(data);
  } catch (error) {
    console.error(
      `Error inserting auth for account: ${accountId}:`,
      error.toString()
    );
    throw error;
  }
}

export async function upsertForeignAccountCode(accountId, code, codeRoot) {
  try {
    await insertAccountCode(codeRoot, code);

    const data = {
      accountId,
      codeRoot,
    };

    await foreignAccountCode.put(data);
  } catch (error) {
    console.error(
      `Error updating foreign account code: (${accountId}, ${codeRoot}):`,
      error.toString()
    );
    throw error;
  }
}

export async function getForeignAccountCode(accountIds) {
  try {
    const foreignAccounts = await foreignAccountCode
      .where("accountId")
      .anyOf(accountIds)
      .toArray();

    if (foreignAccounts.length === 0) {
      console.log("No records found for the given account IDs.");
      return null; // No records found
    }

    let codeRoots = foreignAccounts.map((account) => account.codeRoot);

    const accountCode = await accountCodes
      .where("root")
      .anyOf(codeRoots)
      .toArray();

    const processedCode = foreignAccounts.map(async (foreignAccount) => {
      const matchingCode = accountCode.find(
        (code) => code.root === foreignAccount.codeRoot
      );

      // Convert the code Blob to an ArrayBuffer
      const codeArrayBuffer = await matchingCode.code.arrayBuffer();
      const codeArray = new Uint8Array(codeArrayBuffer);
      const codeBase64 = uint8ArrayToBase64(codeArray);

      return {
        accountId: foreignAccount.accountId,
        code: codeBase64,
      };
    });
    return processedCode;
  } catch (error) {
    console.error("Error fetching foreign account code:", error.toString());
    throw error;
  }
}

export async function lockAccount(accountId) {
  try {
    await accounts.where("id").equals(accountId).modify({ locked: true });
  } catch (error) {
    console.error(`Error locking account: ${accountId}:`, error.toString());
    throw error;
  }
}

// Delete functions

export async function undoAccountStates(accountCommitments) {
  try {
    await accounts
      .where("accountCommitment")
      .anyOf(accountCommitments)
      .delete();
  } catch (error) {
    console.error(
      `Error undoing account states: ${accountCommitments}:`,
      error.toString()
    );
    throw error;
  }
}

function uint8ArrayToBase64(bytes) {
  const binary = bytes.reduce(
    (acc, byte) => acc + String.fromCharCode(byte),
    ""
  );
  return btoa(binary);
}
