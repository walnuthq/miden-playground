use core::str::FromStr;

use miden_objects::account::NetworkId as NativeNetworkId;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Clone, Copy)]
pub struct NetworkId(NativeNetworkId);

#[wasm_bindgen]
impl NetworkId {
    #[wasm_bindgen(constructor)]
    pub fn new(string: &str) -> NetworkId {
        NetworkId(NativeNetworkId::new(string).unwrap())
    }

    pub fn mainnet() -> NetworkId {
        NetworkId(NativeNetworkId::Mainnet)
    }

    pub fn testnet() -> NetworkId {
        NetworkId(NativeNetworkId::Testnet)
    }

    pub fn devnet() -> NetworkId {
        NetworkId(NativeNetworkId::Devnet)
    }

    #[wasm_bindgen(js_name = "tryFromStr")]
    pub fn try_from_str(s: &str) -> Result<NetworkId, JsValue> {
        let network_id = NativeNetworkId::from_str(s)
            .map_err(|e| JsValue::from_str(&format!("Invalid NetworkId string: {e:?}")))?;
        Ok(NetworkId(network_id))
    }

    #[wasm_bindgen(js_name = "asStr")]
    pub fn as_str(&self) -> String {
        self.0.to_string()
    }

    /* #[wasm_bindgen(js_name = "isMainnet")]
    pub fn is_mainnet(&self) -> bool {
        matches!(self.0, NetworkId::Mainnet)
    }

    #[wasm_bindgen(js_name = "isTestnet")]
    pub fn is_testnet(&self) -> bool {
        matches!(self.0, NetworkId::Testnet)
    }

    #[wasm_bindgen(js_name = "isDevnet")]
    pub fn is_devnet(&self) -> bool {
        matches!(self.0, NetworkId::Devnet)
    } */
}

// CONVERSIONS
// ================================================================================================

impl From<NetworkId> for NativeNetworkId {
    fn from(network_id: NetworkId) -> Self {
        network_id.0
    }
}

impl From<&NetworkId> for NativeNetworkId {
    fn from(network_id: &NetworkId) -> Self {
        network_id.0
    }
}
