extern crate alloc;
extern crate console_error_panic_hook;
use alloc::sync::Arc;
use std::fmt::Write;

use miden_client::{
    keystore::WebKeyStore,
    store::web_store::WebStore,
    testing::mock::{MockClient, MockRpcApi},
};
use miden_objects::{Felt, crypto::rand::RpoRandomCoin};
use rand::{Rng, SeedableRng, rngs::StdRng};
use wasm_bindgen::prelude::*;

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
                    StdRng::from_seed(seed_array)
                } else {
                    return Err(JsValue::from_str("Seed must be exactly 32 bytes"));
                }
            }
            None => StdRng::from_os_rng(),
        };
        let coin_seed: [u64; 4] = rng.random();

        let rng = RpoRandomCoin::new(coin_seed.map(Felt::new));
        let web_store: WebStore = WebStore::new()
            .await
            .map_err(|_| JsValue::from_str("Failed to initialize WebStore"))?;
        let web_store = Arc::new(web_store);

        let keystore = WebKeyStore::new(rng);

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
