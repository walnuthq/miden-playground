extern crate alloc;
extern crate console_error_panic_hook;
use alloc::sync::Arc;
use std::fmt::Write;

use miden_client::{
    keystore::WebKeyStore,
    store::{Store, TransactionFilter, web_store::WebStore},
    testing::mock::{MockClient, MockRpcApi},
    utils::RwLock,
};
use miden_objects::{Felt, crypto::rand::RpoRandomCoin};
use miden_testing::{MockChain, MockChainNote};
use rand::{Rng, SeedableRng, rngs::StdRng};
use wasm_bindgen::prelude::*;
use web_sys::console;

pub mod account;
pub mod export;
pub mod helpers;
pub mod import;
pub mod models;
pub mod new_account;
pub mod new_transactions;
pub mod notes;
pub mod sync;
pub mod transactions;
pub mod utils;

#[wasm_bindgen]
pub struct MockWebClient {
    store: Option<Arc<WebStore>>,
    keystore: Option<WebKeyStore<RpoRandomCoin>>,
    inner: Option<MockClient>,
}

impl Default for MockWebClient {
    fn default() -> Self {
        Self::new()
    }
}

#[wasm_bindgen]
impl MockWebClient {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        console_error_panic_hook::set_once();
        MockWebClient {
            store: None,
            keystore: None,
            inner: None,
        }
    }

    pub(crate) fn get_mut_inner(&mut self) -> Option<&mut MockClient> {
        self.inner.as_mut()
    }

    #[wasm_bindgen(js_name = "createClient")]
    pub async fn create_client(
        &mut self,
        _node_url: Option<String>,
        seed: Option<Vec<u8>>,
    ) -> Result<JsValue, JsValue> {
        let mut rng = match seed {
            Some(seed_bytes) => {
                if seed_bytes.len() == 32 {
                    let mut seed_array = [0u8; 32];
                    seed_array.copy_from_slice(&seed_bytes);
                    console::log_1(&format!("{:?}", seed_array).into());
                    StdRng::from_seed(seed_array)
                } else {
                    return Err(JsValue::from_str("Seed must be exactly 32 bytes"));
                }
            }
            None => StdRng::from_os_rng(),
        };
        let coin_seed: [u64; 4] = rng.random();
        // console::log_1(&format!("{:?}", coin_seed).into());
        // let coin_seed2: [u64; 4] = rng.random();
        // console::log_1(&format!("{:?}", coin_seed2).into());
        // let coin_seed3: [u64; 4] = rng.random();
        // console::log_1(&format!("{:?}", coin_seed3).into());

        let rng = RpoRandomCoin::new(coin_seed.map(Felt::new));
        let web_store: WebStore = WebStore::new()
            .await
            .map_err(|_| JsValue::from_str("Failed to initialize WebStore"))?;
        let web_store = Arc::new(web_store);

        let keystore = WebKeyStore::new(rng);

        // let mut api = MockRpcApi::new();
        // let account_ids = web_store
        //     .get_account_ids()
        //     .await
        //     .map_err(|_| JsValue::from_str("Failed to retrieve account IDs"))?;
        // let accounts = account_ids.map(|account_id| web_store.get_account(account_id).await);
        /* let account_id = account_ids[0];
        let account_record = web_store
            .get_account(account_id)
            .await
            .map_err(|_| JsValue::from_str("Failed to retrieve account"))?;*/
        // let mut accounts = vec![];
        // for account_id in account_ids {
        //     let account_record = web_store
        //         .get_account(account_id)
        //         .await
        //         .map_err(|_| JsValue::from_str("Failed to retrieve account"))?;
        //     let account = account_record.unwrap().into();
        //     accounts.push(account);
        // }
        /*let accounts = account_ids
        .iter()
        .map(async |account_id| {
            let ar = web_store
                .get_account(*account_id)
                .await
                .map_err(|_| JsValue::from_str("Failed to retrieve account"))?;
            let a: miden_objects::account::Account = account_record.unwrap().into();
            a
        })
        .collect::<Vec<miden_objects::account::Account>>();*/
        // let account: miden_objects::account::Account = account_record.unwrap().into();
        // console::log_1(&format!("{:?}", account_ids).into());
        /* let block_num = web_store
        .get_sync_height()
        .await
        .map_err(|_| JsValue::from_str("Failed to retrieve sync height"))?; */
        // let block_num_result = web_store.get_sync_height().await;
        // let block_num = match block_num_result {
        //     Ok(block_num) => block_num,
        //     Err(_) => 0.into(),
        // };
        // console::log_1(&format!("{:?}", block_num).into());
        // let mut mock_chain2 = MockChain::with_accounts(&accounts);
        // let commitment = mock_chain2.latest_block_header().commitment();
        // console::log_1(
        //     &format!("mock_chain2 initial commitment: {:?}", commitment.to_hex()).into(),
        // );
        // let mock_chain = MockChain::new();
        //let mock_chain = MockChain::new();
        /* if block_num.as_usize() > 0 {
            let _ = mock_chain.prove_until_block(block_num);
        }*/
        // let commitment = mock_chain.latest_block_header().commitment();
        // console::log_1(&format!("initial commitment: {:?}", commitment.to_hex()).into());
        // let abc=mock_chain.latest_partial_blockchain().
        // api.mock_chain = Arc::new(RwLock::new(mock_chain));

        self.inner = Some(MockClient::new(
            Arc::new(MockRpcApi::new()),
            Box::new(rng),
            web_store.clone(),
            Arc::new(keystore.clone()),
            true,
            None,
            None,
        ));
        self.store = Some(web_store);
        self.keystore = Some(keystore);

        /* let client = self.get_mut_inner().unwrap();
        let rpc_api = client.test_rpc_api();
        let (block_header, mmr_proof) = rpc_api
            .get_block_header_by_number(Some(0.into()), false)
            .await
            .map_err(|_| JsValue::from_str("Failed to retrieve block header"))?;
        let commitment = block_header.commitment();
        console::log_1(&format!("initial commitment: {:?}", commitment.to_hex()).into());

        let mut mock_chain = MockChain::new();
        let commitment = mock_chain.latest_block_header().commitment();
        console::log_1(&format!("initial commitment: {:?}", commitment.to_hex()).into());

        let transactions = client
            .get_transactions(TransactionFilter::All)
            .await
            .map_err(|_| JsValue::from_str("Failed to retrieve transactions"))?;
        for transaction in transactions {
            // let nullifiers = transaction.details.input_note_nullifiers;
            let notes: Vec<miden_objects::transaction::OutputNote> =
                transaction.details.output_notes.iter().cloned().collect();
            let nullifiers: Vec<miden_objects::note::Nullifier> = transaction
                .details
                .input_note_nullifiers
                .into_iter()
                .map(Into::into)
                .collect();
            //
            for note in notes {
                mock_chain.add_pending_note(note);
            }
            //
            for nullifier in nullifiers {
                mock_chain.add_pending_nullifier(nullifier);
            }
            //
            mock_chain.prove_next_block();
            let commitment = mock_chain.latest_block_header().commitment();
            console::log_1(&format!("tx commitment: {:?}", commitment.to_hex()).into());
        } */

        Ok(JsValue::from_str("Client created successfully"))
    }
}

// ERROR HANDLING HELPERS
// ================================================================================================

fn js_error_with_context<T>(err: T, context: &str) -> JsValue
where
    T: core::error::Error,
{
    let mut error_string = context.to_string();
    let mut source = Some(&err as &dyn core::error::Error);
    while let Some(err) = source {
        write!(error_string, ": {err}").expect("writing to string should always succeeds");
        source = err.source();
    }
    JsValue::from(error_string)
}
