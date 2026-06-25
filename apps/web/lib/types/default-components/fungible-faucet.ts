import type { Component } from "@/lib/types/component";
import { defaultComponent } from "@/lib/utils/component";

const fungibleFaucet: Component = {
  ...defaultComponent(),
  id: "fungible-faucet",
  name: "Fungible Faucet",
  type: "account",
  scriptId: "fungible-faucet",
  storageSlots: [
    {
      name: "miden::standards::faucets::token_description_4",
      type: "value",
      value: "0",
    },
    {
      name: "miden::standards::faucets::external_link_2",
      type: "value",
      value: "0",
    },
    {
      name: "miden::standards::faucets::external_link_5",
      type: "value",
      value: "0",
    },
    {
      name: "miden::standards::faucets::token_description_2",
      type: "value",
      value: "0",
    },
    {
      name: "miden::standards::faucets::logo_uri_3",
      type: "value",
      value: "0",
    },
    {
      name: "miden::standards::faucets::token_description_0",
      type: "value",
      value: "0",
    },
    {
      name: "miden::standards::faucets::logo_uri_4",
      type: "value",
      value: "0",
    },
    {
      name: "miden::standards::faucets::policies::policy_manager::active_mint_policy_proc_root",
      type: "value",
      value: "0",
    },
    {
      name: "miden::standards::faucets::token_name_1",
      type: "value",
      value: "0",
    },
    {
      name: "miden::standards::faucets::external_link_3",
      type: "value",
      value: "0",
    },
    {
      name: "miden::standards::faucets::logo_uri_5",
      type: "value",
      value: "0",
    },
    {
      name: "miden::standards::faucets::mutability_config",
      type: "value",
      value: "0",
    },
    {
      name: "miden::standards::faucets::external_link_4",
      type: "value",
      value: "0",
    },
    {
      name: "miden::standards::auth::singlesig::scheme",
      type: "value",
      value: "0",
    },
    {
      name: "miden::standards::faucets::policies::policy_manager::active_burn_policy_proc_root",
      type: "value",
      value: "0",
    },
    {
      name: "miden::standards::access::pausable::is_paused",
      type: "value",
      value: "0",
    },
    {
      name: "miden::standards::faucets::token_description_3",
      type: "value",
      value: "0",
    },
    {
      name: "miden::standards::faucets::policies::policy_manager::allowed_send_policy_proc_roots",
      type: "map",
      value: "",
    },
    {
      name: "miden::standards::faucets::logo_uri_6",
      type: "value",
      value: "0",
    },
    {
      name: "miden::standards::faucets::policies::policy_manager::allowed_burn_policy_proc_roots",
      type: "map",
      value: "",
    },
    {
      name: "miden::standards::faucets::logo_uri_0",
      type: "value",
      value: "0",
    },
    {
      name: "miden::standards::faucets::external_link_1",
      type: "value",
      value: "0",
    },
    {
      name: "miden::standards::faucets::logo_uri_1",
      type: "value",
      value: "0",
    },
    {
      name: "miden::standards::faucets::token_description_5",
      type: "value",
      value: "0",
    },
    {
      name: "miden::standards::faucets::fungible::token_config",
      type: "value",
      value: "0",
    },
    {
      name: "miden::standards::faucets::token_description_1",
      type: "value",
      value: "0",
    },
    {
      name: "miden::standards::auth::singlesig::pub_key",
      type: "value",
      value: "0",
    },
    {
      name: "miden::standards::faucets::token_description_6",
      type: "value",
      value: "0",
    },
    {
      name: "miden::standards::faucets::logo_uri_2",
      type: "value",
      value: "0",
    },
    {
      name: "miden::standards::faucets::external_link_0",
      type: "value",
      value: "0",
    },
    {
      name: "miden::standards::faucets::external_link_6",
      type: "value",
      value: "0",
    },
    {
      name: "miden::standards::faucets::token_name_0",
      type: "value",
      value: "0",
    },
    {
      name: "miden::standards::faucets::policies::policy_manager::allowed_receive_policy_proc_roots",
      type: "map",
      value: "",
    },
    {
      name: "miden::standards::metadata::storage_schema::commitment",
      type: "value",
      value: "0",
    },
    {
      name: "miden::standards::faucets::policies::policy_manager::allowed_mint_policy_proc_roots",
      type: "map",
      value: "",
    },
  ],
};

export default fungibleFaucet;
